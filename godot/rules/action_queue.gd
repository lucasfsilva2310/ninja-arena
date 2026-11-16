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
	return plan_with_payment(random_payment())


func plan_with_payment(payment: Array[ChakraType.Type]) -> TurnPlan:
	var plan: TurnPlan = TurnPlan.new()
	plan.actions = actions.duplicate()
	plan.random_payment = payment.duplicate()
	return plan


func random_slots() -> int:
	return reserved_cost().count(ChakraType.Type.RANDOM)


func random_candidates() -> Array[ChakraType.Type]:
	var left: Array[ChakraType.Type] = battle.teams[team_idx].pool.chakras.duplicate()
	for type: ChakraType.Type in reserved_cost():
		if type != ChakraType.Type.RANDOM and left.has(type):
			left.remove_at(left.find(type))
	return left


func needs_random_choice() -> bool:
	var slots: int = random_slots()
	if slots == 0:
		return false
	var left: Array[ChakraType.Type] = random_candidates()
	if left.size() <= slots:
		return false
	for type: ChakraType.Type in left:
		if type != left[0]:
			return true
	return false


func is_valid_random_payment(payment: Array[ChakraType.Type]) -> bool:
	if payment.size() != random_slots():
		return false
	var left: Array[ChakraType.Type] = random_candidates()
	for type: ChakraType.Type in payment:
		var index: int = left.find(type)
		if type == ChakraType.Type.RANDOM or index == -1:
			return false
		left.remove_at(index)
	return true


func exchange_error(five_chakras: Array[ChakraType.Type], target: ChakraType.Type) -> String:
	var scratch: ChakraPool = ChakraPool.new()
	scratch.chakras = battle.teams[team_idx].pool.chakras.duplicate()
	if not scratch.exchange(five_chakras, target):
		return "Pick 5 chakras you own and a target type"
	if not scratch.can_pay(reserved_cost()):
		return "The queued actions need those chakras"
	return ""


static func needs_pick(ability: AbilityData) -> bool:
	return ability.target_type in [AbilityData.Target.ENEMY, AbilityData.Target.ALLY]
