extends "res://tools/test_case.gd"

const Build: GDScript = preload("res://tests/builders.gd")
const Helpers: GDScript = preload("res://tests/ui_helpers.gd")


func _setup(cost: Array = [], pool: Array = []) -> Array:
	var strike: AbilityData = Build.hit(10, cost)
	var battle: Battle = Build.battle(Build.team([strike]), Build.team([strike]), 2)
	battle.teams[0].pool.chakras.clear()
	Build.give(battle.teams[0].pool, pool)
	return [battle, ActionQueue.new(battle, 0)]


func test_queue_accepts_one_action_per_fighter() -> void:
	var pair: Array = _setup()
	var battle: Battle = pair[0]
	var queue: ActionQueue = pair[1]
	var source: Fighter = battle.teams[0].fighters[0]
	var target: Fighter = battle.teams[1].fighters[0]
	assert_eq(queue.try_add(Action.new(source, source.abilities[0], target)), "")
	assert_eq(queue.try_add(Action.new(source, source.abilities[0], target)), "Action already queued")
	assert_eq(queue.actions.size(), 1)


func test_queue_emits_changed_on_add_remove_and_clear() -> void:
	var pair: Array = _setup()
	var battle: Battle = pair[0]
	var queue: ActionQueue = pair[1]
	var count: Array[int] = [0]
	queue.changed.connect(func() -> void: count[0] += 1)
	var source: Fighter = battle.teams[0].fighters[0]
	queue.try_add(Action.new(source, source.abilities[0], battle.teams[1].fighters[0]))
	queue.remove_at(0)
	queue.clear()
	queue.try_add(Action.new(source, source.abilities[0], battle.teams[1].fighters[0]))
	queue.clear()
	assert_eq(count[0], 4)


func test_remove_out_of_range_is_ignored() -> void:
	var pair: Array = _setup()
	var queue: ActionQueue = pair[1]
	assert_false(queue.remove_at(0))
	assert_false(queue.remove_at(-1))


func test_queue_rejects_a_target_on_the_wrong_side_and_a_dead_target() -> void:
	var pair: Array = _setup()
	var battle: Battle = pair[0]
	var queue: ActionQueue = pair[1]
	var source: Fighter = battle.teams[0].fighters[0]
	assert_eq(queue.try_add(Action.new(source, source.abilities[0], battle.teams[0].fighters[1])), "Invalid target")
	battle.teams[1].fighters[0].hp = 0
	assert_eq(queue.try_add(Action.new(source, source.abilities[0], battle.teams[1].fighters[0])), "Invalid target")


func test_queue_rejects_an_ability_on_cooldown() -> void:
	var slow: AbilityData = Build.hit(10, [], 3)
	var battle: Battle = Build.battle(Build.team([slow]), Build.team([slow]), 2)
	var queue: ActionQueue = ActionQueue.new(battle, 0)
	var source: Fighter = battle.teams[0].fighters[0]
	source.abilities[0].start_cooldown()
	assert_eq(queue.try_add(Action.new(source, source.abilities[0], battle.teams[1].fighters[0])), "Cooldown: %d" % source.abilities[0].cooldown)


func test_reserved_cost_sums_every_queued_action() -> void:
	var pair: Array = _setup([Build.N, Build.R], [Build.N, Build.N, Build.T, Build.G])
	var battle: Battle = pair[0]
	var queue: ActionQueue = pair[1]
	for i: int in 2:
		var source: Fighter = battle.teams[0].fighters[i]
		assert_eq(queue.try_add(Action.new(source, source.abilities[0], battle.teams[1].fighters[0])), "")
	assert_eq(queue.reserved_cost().size(), 4)
	assert_eq(queue.reserved_cost().count(Build.N), 2)
	assert_eq(queue.reserved_cost().count(Build.R), 2)
	var third: Fighter = battle.teams[0].fighters[2]
	assert_eq(queue.try_add(Action.new(third, third.abilities[0], battle.teams[1].fighters[0])), "Not enough chakra")


func test_random_payment_skips_chakra_reserved_for_specific_slots() -> void:
	var pair: Array = _setup([Build.N, Build.R], [Build.N, Build.T, Build.G])
	var battle: Battle = pair[0]
	var queue: ActionQueue = pair[1]
	var source: Fighter = battle.teams[0].fighters[0]
	queue.try_add(Action.new(source, source.abilities[0], battle.teams[1].fighters[0]))
	assert_eq(queue.random_payment(), Build.types([Build.T]))


func test_to_plan_copies_the_actions_and_payment() -> void:
	var pair: Array = _setup([Build.R], [Build.G, Build.N])
	var battle: Battle = pair[0]
	var queue: ActionQueue = pair[1]
	var source: Fighter = battle.teams[0].fighters[0]
	queue.try_add(Action.new(source, source.abilities[0], battle.teams[1].fighters[0]))
	var plan: TurnPlan = queue.to_plan()
	queue.clear()
	assert_eq(plan.actions.size(), 1)
	assert_eq(plan.random_payment, Build.types([Build.G]))


func test_empty_queue_has_an_empty_plan() -> void:
	var pair: Array = _setup()
	var queue: ActionQueue = pair[1]
	var plan: TurnPlan = queue.to_plan()
	assert_true(plan.is_empty())
	assert_true(plan.random_payment.is_empty())


func test_turn_player_plays_events_in_order_and_then_finishes() -> void:
	var player: TurnPlayer = TurnPlayer.new()
	var seen: Array[int] = []
	var done: Array[bool] = [false]
	player.event_played.connect(func(event: BattleEvent) -> void: seen.append(event.amount))
	player.finished.connect(func() -> void: done[0] = true)
	var events: Array[BattleEvent] = []
	for i: int in 3:
		events.append(BattleEvent.new(BattleEvent.Type.DAMAGE, null, null, i))
	player.play(events)
	assert_eq(seen, [0, 1, 2] as Array[int])
	assert_true(done[0])
	assert_false(player.playing)


func test_turn_player_with_no_events_still_finishes() -> void:
	var player: TurnPlayer = TurnPlayer.new()
	var done: Array[bool] = [false]
	player.finished.connect(func() -> void: done[0] = true)
	player.play([] as Array[BattleEvent])
	assert_true(done[0])


func test_event_text_names_actor_target_and_amount() -> void:
	var battle: Battle = Helpers.real_battle()
	var source: Fighter = battle.teams[0].fighters[0]
	var target: Fighter = battle.teams[1].fighters[1]
	assert_eq(EventText.describe(BattleEvent.new(BattleEvent.Type.ABILITY_USED, source, target, 0, "Rasengan")), "Naruto uses Rasengan on Sasuke.")
	assert_eq(EventText.describe(BattleEvent.new(BattleEvent.Type.ABILITY_USED, source, source, 0, "Kage Bunshin")), "Naruto uses Kage Bunshin.")
	assert_eq(EventText.describe(BattleEvent.new(BattleEvent.Type.DAMAGE, source, target, 30, "Rasengan")), "Sasuke takes 30 damage from Rasengan.")
	assert_eq(EventText.describe(BattleEvent.new(BattleEvent.Type.FIGHTER_DIED, null, target)), "Sasuke is defeated.")
	assert_eq(EventText.describe(BattleEvent.new(BattleEvent.Type.TURN_STARTED, null, null, 4)), "--- Turn 4 ---")
	assert_eq(EventText.describe(BattleEvent.new(BattleEvent.Type.CHAKRA_GAINED, null, null, 3)), "")
