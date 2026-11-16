extends "res://tools/test_case.gd"

const Build: GDScript = preload("res://tests/builders.gd")


func _free_battle(cooldown: int) -> Battle:
	var ability: AbilityData = Build.hit(10, [], cooldown)
	return Build.battle(Build.team([ability]), Build.team([ability]))


func _use(battle: Battle, team_idx: int, fighter_idx: int) -> Array[BattleEvent]:
	var fighter: Fighter = battle.teams[team_idx].fighters[fighter_idx]
	var target: Fighter = battle.teams[1 - team_idx].fighters[0]
	var action: Action = Action.new(fighter, fighter.abilities[0], target)
	return battle.submit_turn(team_idx, Build.actions([action]), Build.empty_payment())


func _rejected(events: Array[BattleEvent]) -> bool:
	return events.size() == 1 and events[0].type == BattleEvent.Type.REJECTED


func test_cooldown_zero_is_usable_on_next_own_turn() -> void:
	var battle: Battle = _free_battle(0)
	var state: AbilityState = battle.teams[0].fighters[0].abilities[0]
	assert_false(_rejected(_use(battle, 0, 0)))
	assert_false(state.is_ready())
	Build.skip_turn(battle)
	assert_true(state.is_ready())
	assert_eq(battle.current_team, 0)
	assert_false(_rejected(_use(battle, 0, 0)))


func test_cooldown_one_blocks_next_own_turn_and_frees_the_one_after() -> void:
	var battle: Battle = _free_battle(1)
	var state: AbilityState = battle.teams[0].fighters[0].abilities[0]
	_use(battle, 0, 0)
	Build.skip_turn(battle)
	assert_eq(battle.current_team, 0)
	assert_false(state.is_ready())
	assert_true(_rejected(_use(battle, 0, 0)))
	Build.skip_turn(battle)
	Build.skip_turn(battle)
	assert_true(state.is_ready())
	assert_false(_rejected(_use(battle, 0, 0)))


func test_cooldown_ticks_once_per_own_turn_start() -> void:
	var battle: Battle = _free_battle(1)
	var state: AbilityState = battle.teams[0].fighters[0].abilities[0]
	_use(battle, 0, 0)
	assert_eq(state.cooldown, 2)
	Build.skip_turn(battle)
	assert_eq(state.cooldown, 1)


func test_one_action_per_fighter_is_enforced() -> void:
	var battle: Battle = _free_battle(0)
	var fighter: Fighter = battle.teams[0].fighters[0]
	var target: Fighter = battle.teams[1].fighters[0]
	var first: Action = Action.new(fighter, fighter.abilities[0], target)
	var second: Action = Action.new(fighter, fighter.abilities[0], target)
	var events: Array[BattleEvent] = battle.submit_turn(0, Build.actions([first, second]), Build.empty_payment())
	assert_true(_rejected(events))
	assert_eq(target.hp, 100)
	assert_eq(battle.current_team, 0)


func test_dead_fighter_action_is_rejected() -> void:
	var battle: Battle = _free_battle(0)
	battle.teams[0].fighters[0].hp = 0
	assert_true(_rejected(_use(battle, 0, 0)))
	assert_eq(battle.teams[1].fighters[0].hp, 100)


func test_wrong_team_cannot_submit() -> void:
	var battle: Battle = _free_battle(0)
	assert_true(_rejected(_use(battle, 1, 0)))


func test_cost_is_paid_on_submit() -> void:
	var ability: AbilityData = Build.hit(10, [Build.N])
	var battle: Battle = Build.battle(Build.team([ability]), Build.team([ability]))
	battle.teams[0].pool.chakras = Build.types([Build.N, Build.T])
	_use(battle, 0, 0)
	assert_eq(battle.teams[0].pool.count(Build.N), 0)
	assert_eq(battle.teams[0].pool.count(Build.T), 1)


func test_rejected_turn_pays_nothing() -> void:
	var ability: AbilityData = Build.hit(10, [Build.N])
	var battle: Battle = Build.battle(Build.team([ability]), Build.team([ability]))
	battle.teams[0].pool.chakras = Build.types([Build.N, Build.N])
	battle.teams[0].fighters[2].hp = 0
	var valid: Action = Action.new(battle.teams[0].fighters[0], battle.teams[0].fighters[0].abilities[0], battle.teams[1].fighters[0])
	var dead: Action = Action.new(battle.teams[0].fighters[2], battle.teams[0].fighters[2].abilities[0], battle.teams[1].fighters[0])
	var events: Array[BattleEvent] = battle.submit_turn(0, Build.actions([valid, dead]), Build.empty_payment())
	assert_true(_rejected(events))
	assert_eq(battle.teams[0].pool.total(), 2)
	assert_eq(battle.teams[1].fighters[0].hp, 100)


func test_queue_that_exceeds_pool_fails_even_if_each_fits() -> void:
	var ability: AbilityData = Build.hit(10, [Build.N])
	var battle: Battle = Build.battle(Build.team([ability]), Build.team([ability]))
	battle.teams[0].pool.chakras = Build.types([Build.N])
	var target: Fighter = battle.teams[1].fighters[0]
	var first: Action = Action.new(battle.teams[0].fighters[0], battle.teams[0].fighters[0].abilities[0], target)
	var second: Action = Action.new(battle.teams[0].fighters[1], battle.teams[0].fighters[1].abilities[0], target)
	assert_true(battle.can_afford_queue(0, Build.actions([first])))
	assert_true(battle.can_afford_queue(0, Build.actions([second])))
	assert_false(battle.can_afford_queue(0, Build.actions([first, second])))
	var events: Array[BattleEvent] = battle.submit_turn(0, Build.actions([first, second]), Build.empty_payment())
	assert_true(_rejected(events))
	assert_eq(battle.teams[0].pool.total(), 1)


func test_queue_with_random_slots_counts_all_slots() -> void:
	var ability_a: AbilityData = Build.hit(10, [Build.N, Build.R])
	var ability_b: AbilityData = Build.hit(10, [Build.T, Build.R])
	var members: Array[CharacterData] = [Build.character("A", [ability_a]), Build.character("B", [ability_b]), Build.character("C", [])]
	var battle: Battle = Build.battle(Team.new(members), Build.team([]))
	battle.teams[0].pool.chakras = Build.types([Build.N, Build.T, Build.G])
	var target: Fighter = battle.teams[1].fighters[0]
	var first: Action = Action.new(battle.teams[0].fighters[0], battle.teams[0].fighters[0].abilities[0], target)
	var second: Action = Action.new(battle.teams[0].fighters[1], battle.teams[0].fighters[1].abilities[0], target)
	assert_true(battle.can_afford_queue(0, Build.actions([first])))
	assert_false(battle.can_afford_queue(0, Build.actions([first, second])))


func test_random_payment_must_match_and_exist_in_pool() -> void:
	var ability: AbilityData = Build.hit(10, [Build.N, Build.R])
	var battle: Battle = Build.battle(Build.team([ability]), Build.team([]))
	battle.teams[0].pool.chakras = Build.types([Build.N, Build.T, Build.T])
	var target: Fighter = battle.teams[1].fighters[0]
	var action: Action = Action.new(battle.teams[0].fighters[0], battle.teams[0].fighters[0].abilities[0], target)
	assert_true(_rejected(battle.submit_turn(0, Build.actions([action]), Build.empty_payment())))
	assert_true(_rejected(battle.submit_turn(0, Build.actions([action]), Build.types([Build.B]))))
	assert_true(_rejected(battle.submit_turn(0, Build.actions([action]), Build.types([Build.N]))))
	assert_eq(battle.teams[0].pool.total(), 3)
	var events: Array[BattleEvent] = battle.submit_turn(0, Build.actions([action]), Build.types([Build.T]))
	assert_false(_rejected(events))
	assert_eq(battle.teams[0].pool.chakras, Build.types([Build.T]))


func test_target_must_be_valid_for_single_target_ability() -> void:
	var battle: Battle = _free_battle(0)
	var fighter: Fighter = battle.teams[0].fighters[0]
	var own_ally: Fighter = battle.teams[0].fighters[1]
	var action: Action = Action.new(fighter, fighter.abilities[0], own_ally)
	assert_true(_rejected(battle.submit_turn(0, Build.actions([action]), Build.empty_payment())))


func test_turn_advances_and_signal_fires() -> void:
	var battle: Battle = _free_battle(0)
	var seen: Array[int] = []
	battle.turn_started.connect(func(team_idx: int, turn: int) -> void: seen.append(team_idx * 100 + turn))
	Build.skip_turn(battle)
	Build.skip_turn(battle)
	assert_eq(seen, [102, 3])
