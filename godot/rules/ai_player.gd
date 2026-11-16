class_name AiPlayer
extends RefCounted

const AVOID_INVULNERABLE_ABILITIES: bool = true


func plan_turn(battle: Battle, team_idx: int, rng: Rng) -> TurnPlan:
	var plan: TurnPlan = TurnPlan.new()
	var acted: Array[Fighter] = []
	var added: bool = true
	while added:
		added = false
		for fighter: Fighter in battle.teams[team_idx].fighters:
			if not fighter.is_alive() or fighter.is_stunned() or acted.has(fighter):
				continue
			var action: Action = _choose_action(battle, team_idx, fighter, plan.actions, rng)
			if action == null:
				continue
			plan.actions.append(action)
			acted.append(fighter)
			added = true
	plan.random_payment = _pay_random_slots(battle, team_idx, plan.actions, rng)
	return plan


func grants_invulnerability(ability: AbilityData) -> bool:
	for effect: EffectData in ability.effects:
		if effect.kind == EffectData.Kind.DAMAGE_REDUCTION and effect.invulnerable:
			return true
	return false


func _choose_action(battle: Battle, team_idx: int, fighter: Fighter, planned: Array[Action], rng: Rng) -> Action:
	var options: Array[Action] = []
	for state: AbilityState in fighter.abilities:
		if not state.is_ready():
			continue
		if AVOID_INVULNERABLE_ABILITIES and grants_invulnerability(state.data):
			continue
		var targets: Array[Fighter] = battle.valid_targets(team_idx, fighter, state)
		if targets.is_empty():
			continue
		var candidate: Array[Action] = planned.duplicate()
		candidate.append(Action.new(fighter, state))
		if not battle.can_afford_queue(team_idx, candidate):
			continue
		options.append(Action.new(fighter, state, _pick_target(state, targets, rng)))
	if options.is_empty():
		return null
	return rng.pick(options)


func _pick_target(state: AbilityState, targets: Array[Fighter], rng: Rng) -> Fighter:
	var needs_pick: bool = state.data.target_type in [AbilityData.Target.ENEMY, AbilityData.Target.ALLY]
	if not needs_pick:
		return null
	return rng.pick(targets)


func _pay_random_slots(battle: Battle, team_idx: int, actions: Array[Action], rng: Rng) -> Array[ChakraType.Type]:
	var left: Array[ChakraType.Type] = battle.teams[team_idx].pool.chakras.duplicate()
	var random_slots: int = 0
	for action: Action in actions:
		for type: ChakraType.Type in action.ability.data.cost:
			if type == ChakraType.Type.RANDOM:
				random_slots += 1
			else:
				left.remove_at(left.find(type))
	rng.shuffle(left)
	var payment: Array[ChakraType.Type] = []
	for i: int in random_slots:
		payment.append(left[i])
	return payment
