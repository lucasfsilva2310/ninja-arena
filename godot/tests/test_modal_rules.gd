extends "res://tools/test_case.gd"

const Build: GDScript = preload("res://tests/builders.gd")


func _battle_with_pool(abilities: Array, pool_list: Array) -> Battle:
	var battle: Battle = Build.battle(Build.team(abilities), Build.team(abilities), 4)
	battle.teams[0].pool.chakras.clear()
	Build.give(battle.teams[0].pool, pool_list)
	return battle


func _queue_one(battle: Battle, ability_cost: Array, fighter_index: int = 0) -> ActionQueue:
	var queue: ActionQueue = ActionQueue.new(battle, 0)
	var source: Fighter = battle.teams[0].fighters[fighter_index]
	var error: String = queue.try_add(Action.new(source, source.abilities[0], battle.teams[1].fighters[0]))
	assert_eq(error, "")
	return queue


func test_surrender_ends_the_battle_as_a_loss_for_the_surrendering_team() -> void:
	var battle: Battle = _battle_with_pool([Build.hit(10)], [])
	var events: Array[BattleEvent] = battle.surrender(0)
	assert_true(battle.result.ended)
	assert_eq(battle.result.winner, 1)
	assert_false(battle.result.draw)
	assert_eq(events[0].type, BattleEvent.Type.BATTLE_ENDED)


func test_surrender_emits_battle_ended_once() -> void:
	var battle: Battle = _battle_with_pool([Build.hit(10)], [])
	var seen: Array[int] = []
	battle.battle_ended.connect(func(_r: BattleResult) -> void: seen.append(1))
	battle.surrender(0)
	var second: Array[BattleEvent] = battle.surrender(0)
	assert_eq(seen.size(), 1)
	assert_eq(second[0].type, BattleEvent.Type.REJECTED)


func test_surrender_is_refused_out_of_turn() -> void:
	var battle: Battle = _battle_with_pool([Build.hit(10)], [])
	var events: Array[BattleEvent] = battle.surrender(1)
	assert_false(battle.result.ended)
	assert_eq(events[0].type, BattleEvent.Type.REJECTED)


func test_exchange_removes_five_and_adds_one_of_the_target_type() -> void:
	var battle: Battle = _battle_with_pool([Build.hit(10)], [Build.N, Build.N, Build.N, Build.T, Build.T, Build.G])
	var changed: Array[int] = []
	battle.chakra_changed.connect(func(team_idx: int) -> void: changed.append(team_idx))
	var ok: bool = battle.exchange_chakra(0, Build.types([Build.N, Build.N, Build.N, Build.T, Build.T]), Build.B)
	assert_true(ok)
	var pool: ChakraPool = battle.teams[0].pool
	assert_eq(pool.total(), 2)
	assert_eq(pool.count(Build.B), 1)
	assert_eq(pool.count(Build.G), 1)
	assert_eq(changed, [0] as Array[int])


func test_exchange_with_four_chakras_is_refused() -> void:
	var battle: Battle = _battle_with_pool([Build.hit(10)], [Build.N, Build.N, Build.N, Build.N, Build.N])
	assert_false(battle.exchange_chakra(0, Build.types([Build.N, Build.N, Build.N, Build.N]), Build.B))
	assert_eq(battle.teams[0].pool.total(), 5)


func test_exchange_is_refused_out_of_turn_and_after_the_end() -> void:
	var battle: Battle = _battle_with_pool([Build.hit(10)], [Build.N, Build.N, Build.N, Build.N, Build.N])
	battle.teams[1].pool.chakras.clear()
	Build.give(battle.teams[1].pool, [Build.N, Build.N, Build.N, Build.N, Build.N])
	assert_false(battle.exchange_chakra(1, Build.types([Build.N, Build.N, Build.N, Build.N, Build.N]), Build.B))
	battle.surrender(0)
	assert_false(battle.exchange_chakra(0, Build.types([Build.N, Build.N, Build.N, Build.N, Build.N]), Build.B))


func test_queue_without_random_slots_needs_no_choice() -> void:
	var battle: Battle = _battle_with_pool([Build.hit(10, [Build.N])], [Build.N, Build.T])
	var queue: ActionQueue = _queue_one(battle, [Build.N])
	assert_eq(queue.random_slots(), 0)
	assert_false(queue.needs_random_choice())


func test_random_slot_with_mixed_leftover_needs_a_choice() -> void:
	var battle: Battle = _battle_with_pool([Build.hit(10, [Build.R])], [Build.N, Build.T])
	var queue: ActionQueue = _queue_one(battle, [Build.R])
	assert_eq(queue.random_slots(), 1)
	assert_true(queue.needs_random_choice())


func test_random_slot_is_forced_when_the_pool_has_exactly_enough() -> void:
	var battle: Battle = _battle_with_pool([Build.hit(10, [Build.R])], [Build.N])
	var queue: ActionQueue = _queue_one(battle, [Build.R])
	assert_false(queue.needs_random_choice())


func test_random_slot_is_forced_when_every_leftover_chakra_has_one_type() -> void:
	var battle: Battle = _battle_with_pool([Build.hit(10, [Build.R])], [Build.N, Build.N, Build.N])
	var queue: ActionQueue = _queue_one(battle, [Build.R])
	assert_false(queue.needs_random_choice())


func test_specific_cost_is_removed_before_counting_the_random_choice() -> void:
	var battle: Battle = _battle_with_pool([Build.hit(10, [Build.T, Build.R])], [Build.T, Build.N])
	var queue: ActionQueue = _queue_one(battle, [Build.T, Build.R])
	assert_eq(queue.random_candidates(), [Build.N] as Array[ChakraType.Type])
	assert_false(queue.needs_random_choice())


func test_payment_with_the_wrong_count_is_invalid() -> void:
	var battle: Battle = _battle_with_pool([Build.hit(10, [Build.R])], [Build.N, Build.T])
	var queue: ActionQueue = _queue_one(battle, [Build.R])
	assert_false(queue.is_valid_random_payment(Build.types([])))
	assert_false(queue.is_valid_random_payment(Build.types([Build.N, Build.T])))
	assert_true(queue.is_valid_random_payment(Build.types([Build.T])))


func test_payment_with_a_chakra_the_pool_lacks_is_invalid() -> void:
	var battle: Battle = _battle_with_pool([Build.hit(10, [Build.R])], [Build.N, Build.T])
	var queue: ActionQueue = _queue_one(battle, [Build.R])
	assert_false(queue.is_valid_random_payment(Build.types([Build.G])))
	assert_false(queue.is_valid_random_payment(Build.types([Build.R])))


func test_chosen_payment_goes_into_the_plan_and_submits() -> void:
	var battle: Battle = _battle_with_pool([Build.hit(10, [Build.R])], [Build.N, Build.T])
	var queue: ActionQueue = _queue_one(battle, [Build.R])
	var plan: TurnPlan = queue.plan_with_payment(Build.types([Build.T]))
	battle.submit_turn(0, plan.actions, plan.random_payment)
	assert_eq(battle.teams[0].pool.count(Build.T), 0)
	assert_eq(battle.teams[0].pool.count(Build.N), 1)


func test_exchange_error_blocks_taking_chakra_the_queue_needs() -> void:
	var battle: Battle = _battle_with_pool([Build.hit(10, [Build.N])], [Build.N, Build.T, Build.T, Build.T, Build.T, Build.T])
	var queue: ActionQueue = _queue_one(battle, [Build.N])
	var spend_reserved: Array[ChakraType.Type] = Build.types([Build.N, Build.T, Build.T, Build.T, Build.T])
	assert_ne(queue.exchange_error(spend_reserved, Build.B), "")
	var spend_free: Array[ChakraType.Type] = Build.types([Build.T, Build.T, Build.T, Build.T, Build.T])
	assert_eq(queue.exchange_error(spend_free, Build.N), "")
