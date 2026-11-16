class_name Battle
extends RefCounted

signal turn_started(team_idx: int, turn: int)
signal hp_changed(fighter: Fighter, old_hp: int, new_hp: int)
signal chakra_changed(team_idx: int)
signal fighter_died(fighter: Fighter)
signal battle_ended(result: BattleResult)

var teams: Array[Team] = []
var turn: int = 0
var current_team: int = 0
var result: BattleResult = BattleResult.new()

var _rng: Rng


func _init(team_a: Team, team_b: Team, rng: Rng) -> void:
	teams = [team_a, team_b]
	_rng = rng


func start() -> Array[BattleEvent]:
	turn = 0
	current_team = 0
	result = BattleResult.new()
	var events: Array[BattleEvent] = []
	_begin_turn(0, events)
	return events


func valid_targets(team_idx: int, fighter: Fighter, ability: AbilityState) -> Array[Fighter]:
	var result_list: Array[Fighter] = []
	if not fighter.is_alive() or fighter.is_stunned() or not fighter.can_use_ability(ability.data):
		return result_list
	var is_heal: bool = ability.data.has_effect(EffectData.Kind.HEAL)
	match ability.data.target_type:
		AbilityData.Target.ENEMY, AbilityData.Target.ALL_ENEMIES:
			for enemy: Fighter in teams[1 - team_idx].living_fighters():
				if not enemy.is_invulnerable():
					result_list.append(enemy)
		AbilityData.Target.ALLY, AbilityData.Target.ALL_ALLIES:
			for ally: Fighter in teams[team_idx].living_fighters():
				if not is_heal or not ally.is_full_hp():
					result_list.append(ally)
		AbilityData.Target.SELF:
			if not is_heal or not fighter.is_full_hp():
				result_list.append(fighter)
	return result_list


func can_afford_queue(team_idx: int, actions: Array[Action]) -> bool:
	return teams[team_idx].pool.can_pay(_queue_cost(actions))


func submit_turn(team_idx: int, actions: Array[Action], random_payment: Array[ChakraType.Type]) -> Array[BattleEvent]:
	var events: Array[BattleEvent] = []
	var error: String = _validate(team_idx, actions, random_payment)
	if error != "":
		events.append(BattleEvent.new(BattleEvent.Type.REJECTED, null, null, 0, error))
		return events

	var team: Team = teams[team_idx]
	team.pool.pay(_queue_cost(actions), random_payment)
	chakra_changed.emit(team_idx)

	for action: Action in actions:
		_resolve(team_idx, action, events)

	for fighter: Fighter in team.living_fighters():
		for expired: ActiveEffect in fighter.tick_stuns():
			_report_expired(fighter, expired, events)

	var outcome: BattleResult = check_winner()
	if outcome.ended:
		result = outcome
		events.append(BattleEvent.new(BattleEvent.Type.BATTLE_ENDED, null, null, outcome.winner, "draw" if outcome.draw else "winner %d" % outcome.winner))
		battle_ended.emit(outcome)
		return events

	_begin_turn(1 - team_idx, events)
	return events


func surrender(team_idx: int) -> Array[BattleEvent]:
	var events: Array[BattleEvent] = []
	if result.ended or team_idx != current_team:
		events.append(BattleEvent.new(BattleEvent.Type.REJECTED, null, null, 0, "cannot surrender now"))
		return events
	var outcome: BattleResult = BattleResult.new()
	outcome.ended = true
	outcome.winner = 1 - team_idx
	result = outcome
	events.append(BattleEvent.new(BattleEvent.Type.BATTLE_ENDED, null, null, outcome.winner, "team %d surrendered" % team_idx))
	battle_ended.emit(outcome)
	return events


func exchange_chakra(team_idx: int, five_chakras: Array[ChakraType.Type], target: ChakraType.Type) -> bool:
	if result.ended or team_idx != current_team:
		return false
	if not teams[team_idx].pool.exchange(five_chakras, target):
		return false
	chakra_changed.emit(team_idx)
	return true


func check_winner() -> BattleResult:
	var outcome: BattleResult = BattleResult.new()
	var first_down: bool = teams[0].is_defeated()
	var second_down: bool = teams[1].is_defeated()
	if first_down and second_down:
		outcome.ended = true
		outcome.draw = true
	elif first_down:
		outcome.ended = true
		outcome.winner = 1
	elif second_down:
		outcome.ended = true
		outcome.winner = 0
	return outcome


func _begin_turn(team_idx: int, events: Array[BattleEvent]) -> void:
	turn += 1
	current_team = team_idx
	var team: Team = teams[team_idx]
	var gained: int = 1 if turn == 1 else team.living_fighters().size()
	for i: int in gained:
		var type: ChakraType.Type = _rng.pick(ChakraType.real_types())
		team.pool.add(type)
	events.append(BattleEvent.new(BattleEvent.Type.CHAKRA_GAINED, null, null, gained))
	chakra_changed.emit(team_idx)
	for fighter: Fighter in team.living_fighters():
		fighter.tick_cooldowns()
		for expired: ActiveEffect in fighter.tick_effects():
			_report_expired(fighter, expired, events)
	events.append(BattleEvent.new(BattleEvent.Type.TURN_STARTED, null, null, turn))
	turn_started.emit(team_idx, turn)


func _queue_cost(actions: Array[Action]) -> Array[ChakraType.Type]:
	var cost: Array[ChakraType.Type] = []
	for action: Action in actions:
		if action.source != null and action.source.is_stunned():
			continue
		cost.append_array(action.ability.data.cost)
	return cost


func _validate(team_idx: int, actions: Array[Action], random_payment: Array[ChakraType.Type]) -> String:
	if result.ended:
		return "battle is over"
	if team_idx != current_team:
		return "not this team's turn"
	var team: Team = teams[team_idx]
	var seen: Array[Fighter] = []
	for action: Action in actions:
		if action.source == null or action.ability == null or not team.owns(action.source):
			return "action source is not on this team"
		if not action.source.is_alive():
			return "dead fighter cannot act"
		if seen.has(action.source):
			return "fighter acts twice"
		seen.append(action.source)
		if not action.source.abilities.has(action.ability):
			return "ability does not belong to the fighter"
		if action.source.is_stunned():
			return "fighter is stunned"
		if not action.ability.is_ready():
			return "ability is on cooldown"
		if not action.source.can_use_ability(action.ability.data):
			return "ability is not enabled"
		var targets: Array[Fighter] = valid_targets(team_idx, action.source, action.ability)
		if targets.is_empty():
			return "no valid target"
		var needs_pick: bool = action.ability.data.target_type in [AbilityData.Target.ENEMY, AbilityData.Target.ALLY]
		if needs_pick and not targets.has(action.target):
			return "invalid target"
	var cost: Array[ChakraType.Type] = _queue_cost(actions)
	if not team.pool.can_pay(cost):
		return "not enough chakra"
	var scratch: ChakraPool = ChakraPool.new()
	scratch.chakras = team.pool.chakras.duplicate()
	if not scratch.pay(cost, random_payment):
		return "invalid random payment"
	return ""


func _resolve(team_idx: int, action: Action, events: Array[BattleEvent]) -> void:
	var source: Fighter = action.source
	if not source.is_alive():
		return
	var targets: Array[Fighter] = _resolve_targets(team_idx, action)
	events.append(BattleEvent.new(BattleEvent.Type.ABILITY_USED, source, action.target, 0, action.ability.data.display_name))
	action.ability.start_cooldown()
	if not targets.is_empty():
		for effect: EffectData in action.ability.data.effects:
			_apply_effect(source, targets, action.ability, effect, events)
	source.record_use(action.ability.data)


func _resolve_targets(team_idx: int, action: Action) -> Array[Fighter]:
	var targets: Array[Fighter] = []
	match action.ability.data.target_type:
		AbilityData.Target.ENEMY, AbilityData.Target.ALLY:
			if action.target.is_alive():
				targets.append(action.target)
		AbilityData.Target.SELF:
			targets.append(action.source)
		AbilityData.Target.ALL_ENEMIES:
			for enemy: Fighter in teams[1 - team_idx].living_fighters():
				targets.append(enemy)
		AbilityData.Target.ALL_ALLIES:
			for ally: Fighter in teams[team_idx].living_fighters():
				targets.append(ally)
	return targets


func _apply_effect(source: Fighter, targets: Array[Fighter], used: AbilityState, effect: EffectData, events: Array[BattleEvent]) -> void:
	var ability: AbilityData = used.data
	match effect.kind:
		EffectData.Kind.DAMAGE:
			var bonus: int = source.buff_bonus(ability) + source.stack_bonus(ability)
			for target: Fighter in targets:
				_deal_damage(source, target, ability, effect.value + bonus, events)
		EffectData.Kind.HEAL:
			for target: Fighter in targets:
				if not target.is_alive() or target.is_full_hp():
					continue
				var old_hp: int = target.hp
				var healed: int = target.heal(effect.value)
				events.append(BattleEvent.new(BattleEvent.Type.HEAL, source, target, healed, ability.display_name))
				_report_hp(target, old_hp, events)
		EffectData.Kind.DAMAGE_REDUCTION:
			for target: Fighter in targets:
				if not target.is_alive():
					continue
				target.add_reduction(ability.display_name, effect.value, effect.duration, effect.is_percent, effect.invulnerable, effect.description)
				events.append(BattleEvent.new(BattleEvent.Type.REDUCTION_ADDED, source, target, effect.value, ability.display_name))
		EffectData.Kind.STUN:
			for target: Fighter in targets:
				if not target.is_alive():
					continue
				var stun: ActiveEffect = target.add_stun(ability.display_name, effect.duration, effect.description)
				_report_added(source, target, stun, events)
		EffectData.Kind.BUFF:
			_report_added(source, source, source.add_buff(ability.display_name, effect.value, effect.duration, effect.ability_names, effect.description), events)
		EffectData.Kind.ENABLE_ABILITY:
			_report_added(source, source, source.add_enable(ability.display_name, effect.duration, effect.ability_names, effect.description), events)
		EffectData.Kind.TRANSFORM:
			if effect.value > 0:
				for target: Fighter in targets:
					_deal_damage(source, target, ability, effect.value, events)
			var transform: ActiveEffect = source.add_transform(ability.display_name, used, effect.replacement, effect.duration, effect.description)
			if transform != null:
				_report_added(source, source, transform, events)


func _deal_damage(source: Fighter, target: Fighter, ability: AbilityData, amount: int, events: Array[BattleEvent]) -> void:
	if not target.is_alive():
		return
	var old_hp: int = target.hp
	var dealt: int = target.take_damage(amount)
	events.append(BattleEvent.new(BattleEvent.Type.DAMAGE, source, target, dealt, ability.display_name))
	_report_hp(target, old_hp, events)


func _report_added(source: Fighter, target: Fighter, effect: ActiveEffect, events: Array[BattleEvent]) -> void:
	var text: String = "%s: %s for %s" % [effect.source_name, effect.description, effect.turns_text()]
	events.append(BattleEvent.new(BattleEvent.Type.EFFECT_ADDED, source, target, effect.value, text))


func _report_expired(fighter: Fighter, effect: ActiveEffect, events: Array[BattleEvent]) -> void:
	if effect.kind == EffectData.Kind.DAMAGE_REDUCTION:
		events.append(BattleEvent.new(BattleEvent.Type.REDUCTION_EXPIRED, fighter, fighter, 0, effect.source_name))
		return
	var text: String = "%s ended: %s" % [effect.source_name, effect.description]
	if effect.kind == EffectData.Kind.TRANSFORM:
		text = "%s ended: %s is back" % [effect.source_name, effect.original_state.data.display_name]
	events.append(BattleEvent.new(BattleEvent.Type.EFFECT_EXPIRED, fighter, fighter, 0, text))


func _report_hp(fighter: Fighter, old_hp: int, events: Array[BattleEvent]) -> void:
	if old_hp != fighter.hp:
		hp_changed.emit(fighter, old_hp, fighter.hp)
	if old_hp > 0 and fighter.hp == 0:
		events.append(BattleEvent.new(BattleEvent.Type.FIGHTER_DIED, null, fighter))
		fighter_died.emit(fighter)
