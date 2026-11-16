extends "res://tools/test_case.gd"

const Build: GDScript = preload("res://tests/builders.gd")


func test_same_seed_gives_same_int_sequence() -> void:
	var first: Rng = Rng.new(42)
	var second: Rng = Rng.new(42)
	for i: int in 30:
		assert_eq(first.int_range(0, 1000), second.int_range(0, 1000))


func test_int_range_stays_inside_bounds() -> void:
	var rng: Rng = Rng.new(3)
	for i: int in 200:
		var value: int = rng.int_range(2, 5)
		assert_true(value >= 2 and value <= 5)


func test_pick_returns_member_and_null_on_empty() -> void:
	var rng: Rng = Rng.new(5)
	var items: Array = [1, 2, 3]
	assert_true(items.has(rng.pick(items)))
	assert_null(rng.pick([]))


func test_shuffle_keeps_items_and_is_seeded() -> void:
	var a: Array = [1, 2, 3, 4, 5, 6, 7, 8]
	var b: Array = [1, 2, 3, 4, 5, 6, 7, 8]
	Rng.new(9).shuffle(a)
	Rng.new(9).shuffle(b)
	assert_eq(a, b)
	var sorted_copy: Array = a.duplicate()
	sorted_copy.sort()
	assert_eq(sorted_copy, [1, 2, 3, 4, 5, 6, 7, 8])


func _income_sequence(seed_value: int) -> Array[int]:
	var battle: Battle = Build.battle(Build.team([]), Build.team([]), seed_value)
	for i: int in 6:
		Build.skip_turn(battle)
	var sequence: Array[int] = []
	for team: Team in battle.teams:
		for type: ChakraType.Type in team.pool.chakras:
			sequence.append(type)
	return sequence


func test_same_seed_gives_same_chakra_income_sequence() -> void:
	assert_eq(_income_sequence(11), _income_sequence(11))


func test_different_seed_changes_chakra_income_sequence() -> void:
	assert_ne(_income_sequence(11), _income_sequence(12))
