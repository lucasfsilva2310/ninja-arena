extends "res://tools/test_case.gd"

const Build: GDScript = preload("res://tests/builders.gd")


func _pool(list: Array) -> ChakraPool:
	var pool: ChakraPool = ChakraPool.new()
	Build.give(pool, list)
	return pool


func test_chakra_type_names_round_trip() -> void:
	for type: ChakraType.Type in ChakraType.Type.values():
		assert_eq(ChakraType.parse(ChakraType.type_name(type)), type)
	assert_eq(ChakraType.parse("  taijutsu "), ChakraType.Type.TAIJUTSU)
	assert_eq(ChakraType.parse("nothing"), -1)


func test_real_types_exclude_random() -> void:
	var real: Array[ChakraType.Type] = ChakraType.real_types()
	assert_eq(real.size(), 4)
	assert_false(real.has(ChakraType.Type.RANDOM))


func test_pool_add_rejects_random() -> void:
	var pool: ChakraPool = _pool([])
	assert_false(pool.add(Build.R))
	assert_eq(pool.total(), 0)


func test_pool_add_remove_count() -> void:
	var pool: ChakraPool = _pool([Build.N, Build.N, Build.T])
	assert_eq(pool.count(Build.N), 2)
	assert_true(pool.remove(Build.N))
	assert_eq(pool.count(Build.N), 1)
	assert_false(pool.remove(Build.G))
	assert_eq(pool.total(), 2)


func test_income_turn_one_gives_first_team_one_chakra() -> void:
	var battle: Battle = Build.battle(Build.team([]), Build.team([]))
	assert_eq(battle.teams[0].pool.total(), 1)
	assert_eq(battle.teams[1].pool.total(), 0)
	assert_eq(battle.turn, 1)
	assert_eq(battle.current_team, 0)


func test_income_later_turn_gives_one_per_living_fighter_with_three_alive() -> void:
	var battle: Battle = Build.battle(Build.team([]), Build.team([]))
	Build.skip_turn(battle)
	assert_eq(battle.teams[1].pool.total(), 3)
	Build.skip_turn(battle)
	assert_eq(battle.teams[0].pool.total(), 1 + 3)


func test_income_with_two_living_fighters() -> void:
	var enemy: Team = Build.team([])
	enemy.fighters[2].hp = 0
	var battle: Battle = Build.battle(Build.team([]), enemy)
	Build.skip_turn(battle)
	assert_eq(battle.teams[1].pool.total(), 2)


func test_income_with_one_living_fighter() -> void:
	var enemy: Team = Build.team([])
	enemy.fighters[1].hp = 0
	enemy.fighters[2].hp = 0
	var battle: Battle = Build.battle(Build.team([]), enemy)
	Build.skip_turn(battle)
	assert_eq(battle.teams[1].pool.total(), 1)


func test_income_is_never_random_type() -> void:
	var battle: Battle = Build.battle(Build.team([]), Build.team([]), 7)
	for i: int in 20:
		Build.skip_turn(battle)
	for team: Team in battle.teams:
		assert_eq(team.pool.count(Build.R), 0)
		assert_true(team.pool.total() > 0)


func test_can_pay_specific_only() -> void:
	var pool: ChakraPool = _pool([Build.N, Build.T])
	assert_true(pool.can_pay(Build.types([Build.N, Build.T])))
	assert_false(pool.can_pay(Build.types([Build.N, Build.N])))
	assert_false(pool.can_pay(Build.types([Build.G])))


func test_can_pay_random_only() -> void:
	var pool: ChakraPool = _pool([Build.N, Build.T])
	assert_true(pool.can_pay(Build.types([Build.R, Build.R])))
	assert_false(pool.can_pay(Build.types([Build.R, Build.R, Build.R])))


func test_can_pay_mixed() -> void:
	var pool: ChakraPool = _pool([Build.N, Build.T])
	assert_true(pool.can_pay(Build.types([Build.N, Build.R])))
	assert_false(pool.can_pay(Build.types([Build.N, Build.R, Build.R])))
	assert_false(pool.can_pay(Build.types([Build.G, Build.R])))


func test_can_pay_empty_cost_is_free() -> void:
	assert_true(_pool([]).can_pay(Build.types([])))


func test_pay_removes_specific_and_random_payment() -> void:
	var pool: ChakraPool = _pool([Build.N, Build.T, Build.T, Build.G])
	assert_true(pool.pay(Build.types([Build.N, Build.R]), Build.types([Build.T])))
	assert_eq(pool.count(Build.N), 0)
	assert_eq(pool.count(Build.T), 1)
	assert_eq(pool.count(Build.G), 1)


func test_pay_rejects_wrong_random_payment_and_changes_nothing() -> void:
	var pool: ChakraPool = _pool([Build.N, Build.T])
	assert_false(pool.pay(Build.types([Build.N, Build.R]), Build.types([])))
	assert_false(pool.pay(Build.types([Build.N, Build.R]), Build.types([Build.T, Build.T])))
	assert_false(pool.pay(Build.types([Build.N, Build.R]), Build.types([Build.G])))
	assert_false(pool.pay(Build.types([Build.N, Build.R]), Build.types([Build.N])))
	assert_false(pool.pay(Build.types([Build.N, Build.R]), Build.types([Build.R])))
	assert_eq(pool.total(), 2)


func test_pay_rejects_missing_specific_chakra() -> void:
	var pool: ChakraPool = _pool([Build.T, Build.T])
	assert_false(pool.pay(Build.types([Build.N]), Build.types([])))
	assert_eq(pool.total(), 2)


func test_exchange_accepts_exactly_five() -> void:
	var pool: ChakraPool = _pool([Build.N, Build.N, Build.T, Build.T, Build.G, Build.B])
	var five: Array[ChakraType.Type] = Build.types([Build.N, Build.N, Build.T, Build.T, Build.G])
	assert_true(pool.exchange(five, Build.B))
	assert_eq(pool.total(), 2)
	assert_eq(pool.count(Build.B), 2)


func test_exchange_rejects_four_and_six() -> void:
	var pool: ChakraPool = _pool([Build.N, Build.N, Build.N, Build.N, Build.N, Build.N])
	assert_false(pool.exchange(Build.types([Build.N, Build.N, Build.N, Build.N]), Build.T))
	assert_false(pool.exchange(Build.types([Build.N, Build.N, Build.N, Build.N, Build.N, Build.N]), Build.T))
	assert_eq(pool.total(), 6)


func test_exchange_rejects_chakras_not_in_pool_and_random_target() -> void:
	var pool: ChakraPool = _pool([Build.N, Build.N, Build.N, Build.N, Build.T])
	assert_false(pool.exchange(Build.types([Build.N, Build.N, Build.N, Build.N, Build.N]), Build.T))
	assert_false(pool.exchange(Build.types([Build.N, Build.N, Build.N, Build.N, Build.T]), Build.R))
	assert_eq(pool.total(), 5)
