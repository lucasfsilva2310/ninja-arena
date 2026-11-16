extends "res://tools/test_case.gd"

const Build: GDScript = preload("res://tests/builders.gd")
const PLAN_COUNT: int = 1000


func _battle(abilities_a: Array, abilities_b: Array, seed_value: int = 1) -> Battle:
	var battle: Battle = Build.battle(Build.team(abilities_a), Build.team(abilities_b), seed_value)
	battle.teams[0].pool.chakras.clear()
	battle.teams[1].pool.chakras.clear()
	return battle


func _signature(plan: TurnPlan) -> Array:
	var lines: Array = []
	for action: Action in plan.actions:
		lines.append([action.source.display_name(), action.ability.data.display_name, action.target.display_name() if action.target != null else "-"])
	lines.append(plan.random_payment.duplicate())
	return lines


func _plan(battle: Battle, team_idx: int = 0, seed_value: int = 7) -> TurnPlan:
	return AiPlayer.new().plan_turn(battle, team_idx, Rng.new(seed_value))


func _roster_battle(seed_value: int) -> Battle:
	var team_a: Team = Team.new(Content.ai_roster())
	var team_b: Team = Team.new(Content.ai_roster())
	var battle: Battle = Battle.new(team_a, team_b, Rng.new(seed_value))
	battle.start()
	return battle


func test_empty_plan_when_team_has_no_chakra() -> void:
	var battle: Battle = _battle([Build.hit(10, [Build.N])], [Build.hit(10)])
	var plan: TurnPlan = _plan(battle)
	assert_true(plan.is_empty())
	assert_eq(plan.random_payment.size(), 0)


func test_empty_plan_when_every_fighter_is_dead() -> void:
	var battle: Battle = _battle([Build.hit(10)], [Build.hit(10)])
	for fighter: Fighter in battle.teams[0].fighters:
		fighter.hp = 0
	assert_true(_plan(battle).is_empty())


func test_free_ability_gives_one_action_per_fighter() -> void:
	var battle: Battle = _battle([Build.hit(10)], [Build.hit(10)])
	var plan: TurnPlan = _plan(battle)
	assert_eq(plan.actions.size(), 3)
	var sources: Array[Fighter] = []
	for action: Action in plan.actions:
		assert_false(sources.has(action.source))
		sources.append(action.source)


func test_plan_never_exceeds_team_chakra() -> void:
	var battle: Battle = _battle([Build.hit(10, [Build.N])], [Build.hit(10)])
	Build.give(battle.teams[0].pool, [Build.N, Build.N])
	var plan: TurnPlan = _plan(battle)
	assert_eq(plan.actions.size(), 2)
	assert_true(battle.can_afford_queue(0, plan.actions))


func test_plan_counts_specific_cost_of_earlier_actions() -> void:
	var battle: Battle = _battle([Build.hit(10, [Build.N])], [Build.hit(10)])
	Build.give(battle.teams[0].pool, [Build.N])
	assert_eq(_plan(battle).actions.size(), 1)


func test_random_slots_are_paid_from_leftover_chakra() -> void:
	var battle: Battle = _battle([Build.hit(10, [Build.N, Build.R])], [Build.hit(10)])
	Build.give(battle.teams[0].pool, [Build.N, Build.T, Build.G, Build.B])
	var plan: TurnPlan = _plan(battle)
	assert_eq(plan.actions.size(), 1)
	assert_eq(plan.random_payment.size(), 1)
	assert_ne(plan.random_payment[0], ChakraType.Type.RANDOM)
	assert_true(battle.teams[0].pool.can_pay(Build.types([Build.N, Build.R])))
	var events: Array[BattleEvent] = battle.submit_turn(0, plan.actions, plan.random_payment)
	assert_ne(events[0].type, BattleEvent.Type.REJECTED)
	assert_eq(battle.teams[0].pool.total(), 2)


func test_random_payment_can_use_a_type_the_costs_do_not_name() -> void:
	var battle: Battle = _battle([Build.hit(10, [Build.R, Build.R])], [Build.hit(10)])
	Build.give(battle.teams[0].pool, [Build.B, Build.B])
	var plan: TurnPlan = _plan(battle)
	assert_eq(plan.random_payment, Build.types([Build.B, Build.B]))


func test_plan_is_accepted_by_the_rules() -> void:
	var battle: Battle = _battle([Build.hit(10, [Build.R]), Build.hit(5, [Build.T, Build.R])], [Build.hit(10)])
	Build.give(battle.teams[0].pool, [Build.T, Build.N, Build.G, Build.B, Build.B])
	var plan: TurnPlan = _plan(battle)
	var events: Array[BattleEvent] = battle.submit_turn(0, plan.actions, plan.random_payment)
	for event: BattleEvent in events:
		assert_ne(event.type, BattleEvent.Type.REJECTED)


func test_stunned_fighter_is_skipped() -> void:
	var battle: Battle = _battle([Build.hit(10)], [Build.hit(10)])
	var stunned: Fighter = battle.teams[0].fighters[0]
	stunned.add_stun("Test", 1)
	var plan: TurnPlan = _plan(battle)
	assert_eq(plan.actions.size(), 2)
	for action: Action in plan.actions:
		assert_ne(action.source, stunned)


func test_dead_fighter_is_skipped() -> void:
	var battle: Battle = _battle([Build.hit(10)], [Build.hit(10)])
	var dead: Fighter = battle.teams[0].fighters[1]
	dead.hp = 0
	var plan: TurnPlan = _plan(battle)
	assert_eq(plan.actions.size(), 2)
	for action: Action in plan.actions:
		assert_ne(action.source, dead)


func test_dead_enemy_is_never_targeted() -> void:
	var battle: Battle = _battle([Build.hit(10)], [Build.hit(10)])
	battle.teams[1].fighters[0].hp = 0
	battle.teams[1].fighters[1].hp = 0
	for seed_value: int in range(1, 20):
		for action: Action in _plan(battle, 0, seed_value).actions:
			assert_eq(action.target, battle.teams[1].fighters[2])


func test_ability_on_cooldown_is_not_chosen() -> void:
	var battle: Battle = _battle([Build.hit(10, [], 2)], [Build.hit(10)])
	for fighter: Fighter in battle.teams[0].fighters:
		fighter.abilities[0].cooldown = 2
	assert_true(_plan(battle).is_empty())


func test_ready_ability_is_chosen_when_the_other_is_on_cooldown() -> void:
	var slow: AbilityData = Build.hit(10, [], 2)
	slow.display_name = "Slow"
	var quick: AbilityData = Build.hit(5)
	quick.display_name = "Quick"
	var battle: Battle = _battle([slow, quick], [Build.hit(10)])
	for fighter: Fighter in battle.teams[0].fighters:
		fighter.abilities[0].cooldown = 2
	var plan: TurnPlan = _plan(battle)
	assert_eq(plan.actions.size(), 3)
	for action: Action in plan.actions:
		assert_eq(action.ability.data.display_name, "Quick")


func test_gated_ability_is_not_chosen_while_locked() -> void:
	var gated: AbilityData = Build.hit(30)
	gated.display_name = "Finisher"
	gated.required_enabler = "Boost"
	var battle: Battle = _battle([gated], [Build.hit(10)])
	assert_true(_plan(battle).is_empty())


func test_gated_ability_is_chosen_when_unlocked() -> void:
	var gated: AbilityData = Build.hit(30)
	gated.display_name = "Finisher"
	gated.required_enabler = "Boost"
	var battle: Battle = _battle([gated], [Build.hit(10)])
	for fighter: Fighter in battle.teams[0].fighters:
		fighter.add_enable("Boost", 3, Build.names(["Finisher"]))
	assert_eq(_plan(battle).actions.size(), 3)


func test_heal_is_not_planned_when_everyone_is_at_full_hp() -> void:
	var battle: Battle = _battle([Build.heal(20)], [Build.hit(10)])
	assert_true(_plan(battle).is_empty())


func test_heal_targets_only_wounded_allies() -> void:
	var battle: Battle = _battle([Build.heal(20)], [Build.hit(10)])
	var wounded: Fighter = battle.teams[0].fighters[1]
	wounded.hp = 40
	for seed_value: int in range(1, 20):
		var plan: TurnPlan = _plan(battle, 0, seed_value)
		assert_eq(plan.actions.size(), 3)
		for action: Action in plan.actions:
			assert_eq(action.target, wounded)


func test_self_heal_is_skipped_at_full_hp() -> void:
	var self_heal: AbilityData = Build.ability("SelfHeal", [], 0, AbilityData.Target.SELF, [Build.effect(EffectData.Kind.HEAL, 20)])
	var battle: Battle = _battle([self_heal], [Build.hit(10)])
	battle.teams[0].fighters[2].hp = 50
	var plan: TurnPlan = _plan(battle)
	assert_eq(plan.actions.size(), 1)
	assert_eq(plan.actions[0].source, battle.teams[0].fighters[2])


func test_invulnerability_ability_is_skipped_by_design_constant() -> void:
	assert_true(AiPlayer.AVOID_INVULNERABLE_ABILITIES)
	var guard: AbilityData = Build.self_cast("Guard", [Build.effect(EffectData.Kind.DAMAGE_REDUCTION, 0, 1, false, true)])
	var battle: Battle = _battle([guard], [Build.hit(10)])
	assert_true(_plan(battle).is_empty())


func test_invulnerability_ability_is_skipped_even_with_other_options() -> void:
	var guard: AbilityData = Build.self_cast("Guard", [Build.effect(EffectData.Kind.DAMAGE_REDUCTION, 0, 1, false, true)])
	var battle: Battle = _battle([guard, Build.hit(10)], [Build.hit(10)])
	for seed_value: int in range(1, 15):
		for action: Action in _plan(battle, 0, seed_value).actions:
			assert_ne(action.ability.data.display_name, "Guard")


func test_non_invulnerable_reduction_is_allowed() -> void:
	var weights: AbilityData = Build.self_cast("Weights", [Build.effect(EffectData.Kind.DAMAGE_REDUCTION, 10, 2)])
	var battle: Battle = _battle([weights], [Build.hit(10)])
	assert_eq(_plan(battle).actions.size(), 3)


func test_invulnerable_enemy_is_not_targeted() -> void:
	var battle: Battle = _battle([Build.hit(10)], [Build.hit(10)])
	battle.teams[1].fighters[0].add_reduction("Guard", 0, 1, false, true)
	battle.teams[1].fighters[1].add_reduction("Guard", 0, 1, false, true)
	for seed_value: int in range(1, 15):
		for action: Action in _plan(battle, 0, seed_value).actions:
			assert_eq(action.target, battle.teams[1].fighters[2])


func test_no_plan_when_all_enemies_are_invulnerable() -> void:
	var battle: Battle = _battle([Build.hit(10)], [Build.hit(10)])
	for fighter: Fighter in battle.teams[1].fighters:
		fighter.add_reduction("Guard", 0, 1, false, true)
	assert_true(_plan(battle).is_empty())


func test_same_seed_gives_same_plan() -> void:
	for seed_value: int in range(1, 30):
		var first: Battle = _roster_battle(seed_value)
		var second: Battle = _roster_battle(seed_value)
		assert_eq(_signature(_plan(first, 0, seed_value)), _signature(_plan(second, 0, seed_value)))


func test_different_seeds_give_different_plans() -> void:
	var battle: Battle = _battle([Build.hit(10), Build.hit(20), Build.hit(30)], [Build.hit(10)])
	var seen: Array = []
	for seed_value: int in range(1, 20):
		var signature: Array = _signature(_plan(battle, 0, seed_value))
		if not seen.has(signature):
			seen.append(signature)
	assert_true(seen.size() > 1)


func test_plan_does_not_change_battle_state() -> void:
	var battle: Battle = _roster_battle(3)
	var before: Array[ChakraType.Type] = battle.teams[0].pool.chakras.duplicate()
	var turn_before: int = battle.turn
	_plan(battle)
	assert_eq(battle.teams[0].pool.chakras, before)
	assert_eq(battle.turn, turn_before)
	for fighter: Fighter in battle.teams[0].fighters:
		assert_eq(fighter.abilities[0].cooldown, 0)


func test_second_team_can_plan() -> void:
	var battle: Battle = _battle([Build.hit(10)], [Build.hit(10)])
	Build.skip_turn(battle)
	battle.teams[1].pool.chakras.clear()
	var plan: TurnPlan = _plan(battle, 1)
	assert_eq(plan.actions.size(), 3)
	for action: Action in plan.actions:
		assert_true(battle.teams[1].owns(action.source))
		assert_true(battle.teams[0].owns(action.target))
	var events: Array[BattleEvent] = battle.submit_turn(1, plan.actions, plan.random_payment)
	for event: BattleEvent in events:
		assert_ne(event.type, BattleEvent.Type.REJECTED)


func test_all_enemy_ability_takes_no_picked_target() -> void:
	var blast: AbilityData = Build.ability("Blast", [], 0, AbilityData.Target.ALL_ENEMIES, [Build.effect(EffectData.Kind.DAMAGE, 5)])
	var battle: Battle = _battle([blast], [Build.hit(10)])
	var plan: TurnPlan = _plan(battle)
	assert_eq(plan.actions.size(), 3)
	var events: Array[BattleEvent] = battle.submit_turn(0, plan.actions, plan.random_payment)
	assert_ne(events[0].type, BattleEvent.Type.REJECTED)


func test_thousand_seeded_plans_on_random_states_are_accepted_by_the_rules() -> void:
	var rejected: int = 0
	var unaffordable: int = 0
	var non_empty: int = 0
	for seed_value: int in PLAN_COUNT:
		var battle: Battle = _roster_battle(seed_value)
		var warmup: int = seed_value % 14
		var warm_rng: Rng = Rng.new(seed_value + 5000)
		var ai: AiPlayer = AiPlayer.new()
		for i: int in warmup:
			if battle.result.ended:
				break
			var warm_plan: TurnPlan = ai.plan_turn(battle, battle.current_team, warm_rng)
			battle.submit_turn(battle.current_team, warm_plan.actions, warm_plan.random_payment)
		if battle.result.ended:
			continue
		var team_idx: int = battle.current_team
		var plan: TurnPlan = ai.plan_turn(battle, team_idx, Rng.new(seed_value))
		if not battle.can_afford_queue(team_idx, plan.actions):
			unaffordable += 1
		if not plan.is_empty():
			non_empty += 1
		var events: Array[BattleEvent] = battle.submit_turn(team_idx, plan.actions, plan.random_payment)
		for event: BattleEvent in events:
			if event.type == BattleEvent.Type.REJECTED:
				rejected += 1
	assert_eq(unaffordable, 0)
	assert_eq(rejected, 0)
	assert_true(non_empty > PLAN_COUNT / 2)
