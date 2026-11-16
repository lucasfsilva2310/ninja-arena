extends "res://tools/test_case.gd"

const Build: GDScript = preload("res://tests/builders.gd")


func _battle_with(target_type: AbilityData.Target, effect_kind: EffectData.Kind = EffectData.Kind.DAMAGE) -> Battle:
	var ability: AbilityData = Build.ability("A", [], 0, target_type, [Build.effect(effect_kind, 10)])
	return Build.battle(Build.team([ability]), Build.team([ability]))


func _targets(battle: Battle) -> Array[Fighter]:
	var caster: Fighter = battle.teams[0].fighters[0]
	return battle.valid_targets(0, caster, caster.abilities[0])


func test_enemy_targets_living_enemies_only() -> void:
	var battle: Battle = _battle_with(AbilityData.Target.ENEMY)
	battle.teams[1].fighters[1].hp = 0
	assert_eq(_targets(battle), [battle.teams[1].fighters[0], battle.teams[1].fighters[2]])


func test_enemy_excludes_invulnerable() -> void:
	var battle: Battle = _battle_with(AbilityData.Target.ENEMY)
	battle.teams[1].fighters[0].add_reduction("k", 0, 1, false, true)
	assert_eq(_targets(battle), [battle.teams[1].fighters[1], battle.teams[1].fighters[2]])


func test_all_enemies_excludes_dead_and_invulnerable() -> void:
	var battle: Battle = _battle_with(AbilityData.Target.ALL_ENEMIES)
	battle.teams[1].fighters[0].hp = 0
	battle.teams[1].fighters[1].add_reduction("k", 0, 1, false, true)
	assert_eq(_targets(battle), [battle.teams[1].fighters[2]])


func test_ally_includes_self_and_excludes_dead() -> void:
	var battle: Battle = _battle_with(AbilityData.Target.ALLY)
	battle.teams[0].fighters[2].hp = 0
	assert_eq(_targets(battle), [battle.teams[0].fighters[0], battle.teams[0].fighters[1]])


func test_ally_includes_invulnerable_ally() -> void:
	var battle: Battle = _battle_with(AbilityData.Target.ALLY)
	battle.teams[0].fighters[1].add_reduction("k", 0, 1, false, true)
	assert_eq(_targets(battle).size(), 3)


func test_all_allies_excludes_dead() -> void:
	var battle: Battle = _battle_with(AbilityData.Target.ALL_ALLIES)
	battle.teams[0].fighters[1].hp = 0
	assert_eq(_targets(battle), [battle.teams[0].fighters[0], battle.teams[0].fighters[2]])


func test_self_targets_only_the_caster() -> void:
	var battle: Battle = _battle_with(AbilityData.Target.SELF)
	assert_eq(_targets(battle), [battle.teams[0].fighters[0]])


func test_dead_caster_has_no_targets() -> void:
	var battle: Battle = _battle_with(AbilityData.Target.SELF)
	battle.teams[0].fighters[0].hp = 0
	assert_true(_targets(battle).is_empty())


func test_heal_self_excluded_at_full_hp() -> void:
	var battle: Battle = _battle_with(AbilityData.Target.SELF, EffectData.Kind.HEAL)
	assert_true(_targets(battle).is_empty())
	battle.teams[0].fighters[0].hp = 40
	assert_eq(_targets(battle).size(), 1)


func test_heal_all_allies_skips_full_hp_allies() -> void:
	var battle: Battle = _battle_with(AbilityData.Target.ALL_ALLIES, EffectData.Kind.HEAL)
	battle.teams[0].fighters[1].hp = 40
	assert_eq(_targets(battle), [battle.teams[0].fighters[1]])


func test_enemy_team_targets_back_at_first_team() -> void:
	var battle: Battle = _battle_with(AbilityData.Target.ENEMY)
	var caster: Fighter = battle.teams[1].fighters[0]
	assert_eq(battle.valid_targets(1, caster, caster.abilities[0]).size(), 3)


func test_all_enemies_hits_every_valid_enemy_through_submit() -> void:
	var battle: Battle = _battle_with(AbilityData.Target.ALL_ENEMIES)
	battle.teams[1].fighters[1].add_reduction("k", 0, 1, false, true)
	var caster: Fighter = battle.teams[0].fighters[0]
	battle.submit_turn(0, Build.actions([Action.new(caster, caster.abilities[0])]), Build.empty_payment())
	assert_eq(battle.teams[1].fighters[0].hp, 90)
	assert_eq(battle.teams[1].fighters[1].hp, 100)
	assert_eq(battle.teams[1].fighters[2].hp, 90)
