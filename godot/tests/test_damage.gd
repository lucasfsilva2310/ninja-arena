extends "res://tools/test_case.gd"

const Build: GDScript = preload("res://tests/builders.gd")


func _fighter() -> Fighter:
	return Fighter.new(Build.character("X", []))


func _reduce(fighter: Fighter, value: int, is_percent: bool = false, invulnerable: bool = false, duration: int = 3) -> void:
	fighter.add_reduction("test", value, duration, is_percent, invulnerable)


func test_damage_lowers_hp() -> void:
	var fighter: Fighter = _fighter()
	assert_eq(fighter.take_damage(30), 30)
	assert_eq(fighter.hp, 70)


func test_damage_floors_at_zero() -> void:
	var fighter: Fighter = _fighter()
	fighter.hp = 10
	assert_eq(fighter.take_damage(50), 10)
	assert_eq(fighter.hp, 0)
	assert_false(fighter.is_alive())


func test_heal_caps_at_max_hp() -> void:
	var fighter: Fighter = _fighter()
	fighter.hp = 95
	assert_eq(fighter.heal(20), 5)
	assert_eq(fighter.hp, 100)


func test_heal_on_full_hp_target_is_not_a_valid_target() -> void:
	var healer: AbilityData = Build.heal(20)
	var battle: Battle = Build.battle(Build.team([healer]), Build.team([]))
	var caster: Fighter = battle.teams[0].fighters[0]
	var state: AbilityState = caster.abilities[0]
	assert_true(battle.valid_targets(0, caster, state).is_empty())
	battle.teams[0].fighters[1].hp = 50
	var targets: Array[Fighter] = battle.valid_targets(0, caster, state)
	assert_eq(targets, [battle.teams[0].fighters[1]])
	var action: Action = Action.new(caster, state, battle.teams[0].fighters[2])
	var events: Array[BattleEvent] = battle.submit_turn(0, Build.actions([action]), Build.empty_payment())
	assert_eq(events[0].type, BattleEvent.Type.REJECTED)


func test_heal_through_battle_caps_and_reports_actual_amount() -> void:
	var battle: Battle = Build.battle(Build.team([Build.heal(30)]), Build.team([]))
	var caster: Fighter = battle.teams[0].fighters[0]
	var patient: Fighter = battle.teams[0].fighters[1]
	patient.hp = 90
	var action: Action = Action.new(caster, caster.abilities[0], patient)
	var events: Array[BattleEvent] = battle.submit_turn(0, Build.actions([action]), Build.empty_payment())
	assert_eq(patient.hp, 100)
	var healed: Array[BattleEvent] = events.filter(func(e: BattleEvent) -> bool: return e.type == BattleEvent.Type.HEAL)
	assert_eq(healed.size(), 1)
	assert_eq(healed[0].amount, 10)


func test_flat_reduction() -> void:
	var fighter: Fighter = _fighter()
	_reduce(fighter, 10)
	assert_eq(fighter.take_damage(30), 20)


func test_flat_reduction_larger_than_damage_gives_zero() -> void:
	var fighter: Fighter = _fighter()
	_reduce(fighter, 50)
	assert_eq(fighter.take_damage(30), 0)
	assert_eq(fighter.hp, 100)


func test_percent_reduction() -> void:
	var fighter: Fighter = _fighter()
	_reduce(fighter, 50, true)
	assert_eq(fighter.take_damage(30), 15)


func test_percent_reduction_rounds_reduction_down() -> void:
	var fighter: Fighter = _fighter()
	_reduce(fighter, 10, true)
	assert_eq(fighter.reduced_damage(15), 14)


func test_flat_plus_percent_reduction() -> void:
	var fighter: Fighter = _fighter()
	_reduce(fighter, 10)
	_reduce(fighter, 50, true)
	assert_eq(fighter.reduced_damage(30), 5)


func test_two_flat_reductions_add_up() -> void:
	var fighter: Fighter = _fighter()
	_reduce(fighter, 10)
	_reduce(fighter, 5)
	assert_eq(fighter.reduced_damage(30), 15)


func test_two_percent_reductions_add_up() -> void:
	var fighter: Fighter = _fighter()
	_reduce(fighter, 50, true)
	_reduce(fighter, 30, true)
	assert_eq(fighter.reduced_damage(30), 6)


func test_percent_sum_caps_at_one_hundred() -> void:
	var fighter: Fighter = _fighter()
	_reduce(fighter, 80, true)
	_reduce(fighter, 80, true)
	assert_eq(fighter.reduced_damage(30), 0)


func test_invulnerable_beats_everything() -> void:
	var fighter: Fighter = _fighter()
	_reduce(fighter, 10)
	_reduce(fighter, 0, false, true)
	assert_true(fighter.is_invulnerable())
	assert_eq(fighter.take_damage(80), 0)
	assert_eq(fighter.hp, 100)


func test_reduction_applies_in_battle_damage() -> void:
	var battle: Battle = Build.battle(Build.team([Build.hit(30)]), Build.team([]))
	var target: Fighter = battle.teams[1].fighters[0]
	target.add_reduction("shield", 10, 2, false, false)
	var attacker: Fighter = battle.teams[0].fighters[0]
	var action: Action = Action.new(attacker, attacker.abilities[0], target)
	battle.submit_turn(0, Build.actions([action]), Build.empty_payment())
	assert_eq(target.hp, 80)


func test_reduction_expires_after_duration_not_earlier_and_not_later() -> void:
	var fighter: Fighter = _fighter()
	_reduce(fighter, 10, false, false, 2)
	assert_eq(fighter.tick_effects().size(), 0)
	assert_eq(fighter.effects.size(), 1)
	assert_eq(fighter.tick_effects().size(), 1)
	assert_eq(fighter.effects.size(), 0)


func test_reduction_duration_one_covers_exactly_one_enemy_turn() -> void:
	var shield: AbilityData = Build.ability("Shield", [], 5, AbilityData.Target.SELF, [Build.effect(EffectData.Kind.DAMAGE_REDUCTION, 10, 1)])
	var battle: Battle = Build.battle(Build.team([shield]), Build.team([]))
	var caster: Fighter = battle.teams[0].fighters[0]
	battle.submit_turn(0, Build.actions([Action.new(caster, caster.abilities[0], caster)]), Build.empty_payment())
	assert_eq(battle.current_team, 1)
	assert_eq(caster.effects.size(), 1)
	Build.skip_turn(battle)
	assert_eq(battle.current_team, 0)
	assert_eq(caster.effects.size(), 0)


func test_reduction_duration_three_covers_three_enemy_turns() -> void:
	var shield: AbilityData = Build.ability("Shield", [], 5, AbilityData.Target.SELF, [Build.effect(EffectData.Kind.DAMAGE_REDUCTION, 10, 3)])
	var battle: Battle = Build.battle(Build.team([shield]), Build.team([]))
	var caster: Fighter = battle.teams[0].fighters[0]
	battle.submit_turn(0, Build.actions([Action.new(caster, caster.abilities[0], caster)]), Build.empty_payment())
	var enemy_turns_covered: int = 0
	for i: int in 5:
		if battle.current_team == 1 and caster.effects.size() == 1:
			enemy_turns_covered += 1
		Build.skip_turn(battle)
	assert_eq(enemy_turns_covered, 3)
	assert_eq(caster.effects.size(), 0)


func test_reduction_ticks_only_on_owner_team_turn_start() -> void:
	var battle: Battle = Build.battle(Build.team([]), Build.team([]))
	var enemy: Fighter = battle.teams[1].fighters[0]
	enemy.add_reduction("shield", 10, 1, false, false)
	assert_eq(battle.current_team, 0)
	assert_eq(enemy.effects.size(), 1)
	Build.skip_turn(battle)
	assert_eq(battle.current_team, 1)
	assert_eq(enemy.effects.size(), 0)


func test_death_fires_fighter_died_once_and_hp_floors_at_zero() -> void:
	var blast: AbilityData = Build.ability("Blast", [], 0, AbilityData.Target.ALL_ENEMIES, [Build.effect(EffectData.Kind.DAMAGE, 60)])
	var battle: Battle = Build.battle(Build.team([blast]), Build.team([]))
	var deaths: Array[Fighter] = []
	battle.fighter_died.connect(func(f: Fighter) -> void: deaths.append(f))
	var actions: Array[Action] = []
	for fighter: Fighter in battle.teams[0].fighters:
		actions.append(Action.new(fighter, fighter.abilities[0]))
	var events: Array[BattleEvent] = battle.submit_turn(0, actions, Build.empty_payment())
	assert_eq(deaths.size(), 3)
	for enemy: Fighter in battle.teams[1].fighters:
		assert_eq(enemy.hp, 0)
	var death_events: Array[BattleEvent] = events.filter(func(e: BattleEvent) -> bool: return e.type == BattleEvent.Type.FIGHTER_DIED)
	assert_eq(death_events.size(), 3)


func test_hp_changed_signal_reports_old_and_new_hp() -> void:
	var battle: Battle = Build.battle(Build.team([Build.hit(25)]), Build.team([]))
	var seen: Array[Vector2i] = []
	battle.hp_changed.connect(func(_f: Fighter, old_hp: int, new_hp: int) -> void: seen.append(Vector2i(old_hp, new_hp)))
	var attacker: Fighter = battle.teams[0].fighters[0]
	battle.submit_turn(0, Build.actions([Action.new(attacker, attacker.abilities[0], battle.teams[1].fighters[0])]), Build.empty_payment())
	assert_eq(seen, [Vector2i(100, 75)])
