class_name ActionQueue
extends RefCounted

signal changed

var battle: Battle
var team_idx: int = 0
var actions: Array[Action] = []


func _init(queue_battle: Battle, queue_team: int) -> void:
	battle = queue_battle
	team_idx = queue_team


func try_add(action: Action) -> String:
	var error: String = rejection_for(action.source, action.ability, action.target)
	if error != "":
		return error
	actions.append(action)
	changed.emit()
	return ""


func rejection_for(fighter: Fighter, state: AbilityState, target: Fighter) -> String:
	if not battle.teams[team_idx].owns(fighter):
		return "Not on this team"
	if not fighter.is_alive():
		return "Down"
	if fighter.is_stunned():
		return "Stunned"
	if has_action_for(fighter):
		return "Action already queued"
	if not state.is_ready():
		return "Cooldown: %d" % state.cooldown
	if not fighter.can_use_ability(state.data):
		return "Not available yet"
	var targets: Array[Fighter] = battle.valid_targets(team_idx, fighter, state)
	if targets.is_empty():
		return "No valid target"
	if needs_pick(state.data) and not targets.has(target):
		return "Invalid target"
	var candidate: Array[Action] = actions.duplicate()
	candidate.append(Action.new(fighter, state, target))
	if not battle.can_afford_queue(team_idx, candidate):
		return "Not enough chakra"
	return ""


func would_afford(fighter: Fighter, state: AbilityState) -> bool:
	var candidate: Array[Action] = actions.duplicate()
	candidate.append(Action.new(fighter, state))
	return battle.can_afford_queue(team_idx, candidate)


func remove_at(index: int) -> bool:
	if index < 0 or index >= actions.size():
		return false
	actions.remove_at(index)
	changed.emit()
	return true


func clear() -> void:
	if actions.is_empty():
		return
	actions.clear()
	changed.emit()


func has_action_for(fighter: Fighter) -> bool:
	for action: Action in actions:
		if action.source == fighter:
			return true
	return false


func reserved_cost() -> Array[ChakraType.Type]:
	var cost: Array[ChakraType.Type] = []
	for action: Action in actions:
		cost.append_array(action.ability.data.cost)
	return cost


func random_payment() -> Array[ChakraType.Type]:
	var left: Array[ChakraType.Type] = battle.teams[team_idx].pool.chakras.duplicate()
	var random_slots: int = 0
	for type: ChakraType.Type in reserved_cost():
		if type == ChakraType.Type.RANDOM:
			random_slots += 1
		elif left.has(type):
			left.remove_at(left.find(type))
	var payment: Array[ChakraType.Type] = []
	for i: int in mini(random_slots, left.size()):
		payment.append(left[i])
	return payment


func to_plan() -> TurnPlan:
	var plan: TurnPlan = TurnPlan.new()
	plan.actions = actions.duplicate()
	plan.random_payment = random_payment()
	return plan


static func needs_pick(ability: AbilityData) -> bool:
	return ability.target_type in [AbilityData.Target.ENEMY, AbilityData.Target.ALLY]
