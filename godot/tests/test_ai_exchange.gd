extends "res://tools/test_case.gd"

const Build: GDScript = preload("res://tests/builders.gd")
const Helpers: GDScript = preload("res://tests/ui_helpers.gd")


func _stuck_battle() -> Battle:
	var punch: AbilityData = Build.hit(15, [Build.T])
	punch.display_name = "Punch"
	var battle: Battle = Build.battle(Build.team([punch]), Build.team([punch]), 5)
	Build.skip_turn(battle)
	return battle


func test_ai_exchanges_five_unusable_chakras_for_the_type_it_needs() -> void:
	var battle: Battle = _stuck_battle()
	var pool: ChakraPool = battle.teams[1].pool
	pool.chakras.clear()
	Build.give(pool, [Build.G, Build.G, Build.G, Build.B, Build.B, Build.N])
	var ai: AiPlayer = AiPlayer.new()
	assert_true(ai.plan_turn(battle, 1, Rng.new(1)).actions.is_empty())
	assert_true(ai.exchange_if_stuck(battle, 1))
	assert_eq(pool.count(Build.T), 1)
	assert_eq(pool.total(), 2)
	assert_false(ai.plan_turn(battle, 1, Rng.new(1)).actions.is_empty())


func test_ai_does_not_exchange_with_fewer_than_five_chakras() -> void:
	var battle: Battle = _stuck_battle()
	var pool: ChakraPool = battle.teams[1].pool
	pool.chakras.clear()
	Build.give(pool, [Build.G, Build.G, Build.B, Build.B])
	assert_false(AiPlayer.new().exchange_if_stuck(battle, 1))
	assert_eq(pool.total(), 4)


func test_ai_does_not_exchange_when_no_ability_is_usable() -> void:
	var battle: Battle = _stuck_battle()
	var pool: ChakraPool = battle.teams[1].pool
	pool.chakras.clear()
	Build.give(pool, [Build.G, Build.G, Build.G, Build.B, Build.B, Build.N])
	for fighter: Fighter in battle.teams[1].fighters:
		fighter.abilities[0].cooldown = 3
	assert_false(AiPlayer.new().exchange_if_stuck(battle, 1))
	assert_eq(pool.total(), 6)


func test_ai_does_not_exchange_out_of_turn() -> void:
	var battle: Battle = _stuck_battle()
	Build.skip_turn(battle)
	var pool: ChakraPool = battle.teams[1].pool
	pool.chakras.clear()
	Build.give(pool, [Build.G, Build.G, Build.G, Build.B, Build.B, Build.N])
	assert_false(AiPlayer.new().exchange_if_stuck(battle, 1))
	assert_eq(pool.total(), 6)


func test_battle_view_lets_the_ai_exchange_when_its_turn_has_no_action() -> void:
	var punch: AbilityData = Build.hit(15, [Build.T, Build.T, Build.T, Build.T])
	punch.display_name = "Punch"
	var battle: Battle = Build.battle(Build.team([punch]), Build.team([punch]), 5)
	var view: BattleView = Helpers.mount_battle(battle)
	var pool: ChakraPool = battle.teams[1].pool
	pool.chakras.clear()
	Build.give(pool, [Build.G, Build.G, Build.G, Build.G, Build.G])
	view.end_turn()
	assert_true("\n".join(view.history).contains("Player 2 exchanges chakra."))
	assert_true(view.can_act())
	Helpers.unmount(view)
