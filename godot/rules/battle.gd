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
	if not fighter.is_alive():
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

	var outcome: BattleResult = check_winner()
	if outcome.ended:
		result = outcome
		events.append(BattleEvent.new(BattleEvent.Type.BATTLE_ENDED, null, null, outcome.winner, "draw" if outcome.draw else "winner %d" % outcome.winner))
		battle_ended.emit(outcome)
		return events

	_begin_turn(1 - team_idx, events)
	return events


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
	for fighter: Fighter in team.fighters:
		fighter.tick_cooldowns()
		for expired: ActiveEffect in fighter.tick_effects():
			events.append(BattleEvent.new(BattleEvent.Type.REDUCTION_EXPIRED, fighter, fighter, 0, expired.source_name))
	events.append(BattleEvent.new(BattleEvent.Type.TURN_STARTED, null, null, turn))
	turn_started.emit(team_idx, turn)


func _queue_cost(actions: Array[Action]) -> Array[ChakraType.Type]:
	var cost: Array[ChakraType.Type] = []
	for action: Action in actions:
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
		if not action.ability.is_ready():
			return "ability is on cooldown"
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
	for target: Fighter in targets:
		for effect: EffectData in action.ability.data.effects:
			_apply_effect(source, target, action.ability.data, effect, events)


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


func _apply_effect(source: Fighter, target: Fighter, ability: AbilityData, effect: EffectData, events: Array[BattleEvent]) -> void:
	match effect.kind:
		EffectData.Kind.DAMAGE:
			if not target.is_alive():
				return
			var old_hp: int = target.hp
			var dealt: int = target.take_damage(effect.value)
			events.append(BattleEvent.new(BattleEvent.Type.DAMAGE, source, target, dealt, ability.display_name))
			_report_hp(target, old_hp, events)
		EffectData.Kind.HEAL:
			if not target.is_alive() or target.is_full_hp():
				return
			var old_hp: int = target.hp
			var healed: int = target.heal(effect.value)
			events.append(BattleEvent.new(BattleEvent.Type.HEAL, source, target, healed, ability.display_name))
			_report_hp(target, old_hp, events)
		EffectData.Kind.DAMAGE_REDUCTION:
			if not target.is_alive():
				return
			target.add_reduction(ability.display_name, effect.value, effect.duration, effect.is_percent, effect.invulnerable)
			events.append(BattleEvent.new(BattleEvent.Type.REDUCTION_ADDED, source, target, effect.value, ability.display_name))


func _report_hp(fighter: Fighter, old_hp: int, events: Array[BattleEvent]) -> void:
	if old_hp != fighter.hp:
		hp_changed.emit(fighter, old_hp, fighter.hp)
	if old_hp > 0 and fighter.hp == 0:
		events.append(BattleEvent.new(BattleEvent.Type.FIGHTER_DIED, null, fighter))
		fighter_died.emit(fighter)
