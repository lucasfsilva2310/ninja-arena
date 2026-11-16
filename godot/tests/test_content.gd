extends "res://tools/test_case.gd"

const Build: GDScript = preload("res://tests/builders.gd")

const N: ChakraType.Type = ChakraType.Type.NINJUTSU
const T: ChakraType.Type = ChakraType.Type.TAIJUTSU
const G: ChakraType.Type = ChakraType.Type.GENJUTSU
const B: ChakraType.Type = ChakraType.Type.BLOODLINE
const R: ChakraType.Type = ChakraType.Type.RANDOM

const ENEMY: AbilityData.Target = AbilityData.Target.ENEMY
const ALLY: AbilityData.Target = AbilityData.Target.ALLY
const SELF: AbilityData.Target = AbilityData.Target.SELF

const ALL_NAMES: Array[String] = [
	"Kage Bunshin", "Naruto Kick", "Rasengan", "Escape Clone",
	"Fireball", "Chidori", "Sharingan", "Kawarimi",
	"Anger Punch", "Heal", "Inner Strength",
	"Konoha Senpu", "Primary Lotus", "Release Weights", "Backflip", "Hidden Lotus",
]


func _ability(ability_name: String) -> AbilityData:
	var found: AbilityData = Content.ability(ability_name)
	assert_true(found != null)
	return found


func _check(ability_name: String, cost: Array, cooldown: int, target: AbilityData.Target, effect_count: int) -> AbilityData:
	var data: AbilityData = _ability(ability_name)
	assert_eq(data.display_name, ability_name)
	assert_eq(data.cost, Build.types(cost))
	assert_eq(data.cooldown, cooldown)
	assert_eq(data.target_type, target)
	assert_eq(data.effects.size(), effect_count)
	assert_true(data.description != "")
	return data


func _effect(data: AbilityData, index: int, kind: EffectData.Kind, value: int, duration: int = 0) -> EffectData:
	var effect: EffectData = data.effects[index]
	assert_eq(effect.kind, kind)
	assert_eq(effect.value, value)
	assert_eq(effect.duration, duration)
	return effect


func _damage_only(ability_name: String, cost: Array, cooldown: int, damage: int) -> AbilityData:
	var data: AbilityData = _check(ability_name, cost, cooldown, ENEMY, 1)
	_effect(data, 0, EffectData.Kind.DAMAGE, damage)
	return data


func _invulnerable(ability_name: String, cooldown: int) -> void:
	var data: AbilityData = _check(ability_name, [R], cooldown, SELF, 1)
	var effect: EffectData = _effect(data, 0, EffectData.Kind.DAMAGE_REDUCTION, 0, 1)
	assert_true(effect.invulnerable)
	assert_false(effect.is_percent)


func test_every_ability_loads_by_name() -> void:
	for ability_name: String in ALL_NAMES:
		assert_true(Content.ability(ability_name) != null)
	assert_null(Content.ability("Nope"))


func test_every_tres_file_loads_as_the_right_type() -> void:
	for directory: String in ["res://content/abilities/", "res://content/characters/"]:
		var files: PackedStringArray = DirAccess.get_files_at(directory)
		assert_true(files.size() > 0)
		for file: String in files:
			if not file.ends_with(".tres"):
				continue
			var loaded: Resource = ResourceLoader.load(directory + file)
			assert_true(loaded != null)
			if directory.ends_with("abilities/"):
				assert_true(loaded is AbilityData)
			else:
				assert_true(loaded is CharacterData)


func test_there_are_exactly_16_ability_files() -> void:
	assert_eq(DirAccess.get_files_at("res://content/abilities/").size() - _count_non_tres("res://content/abilities/"), 16)


func _count_non_tres(directory: String) -> int:
	var count: int = 0
	for file: String in DirAccess.get_files_at(directory):
		if not file.ends_with(".tres"):
			count += 1
	return count


func test_kage_bunshin_matches_the_table() -> void:
	var data: AbilityData = _check("Kage Bunshin", [R], 5, SELF, 3)
	var reduction: EffectData = _effect(data, 0, EffectData.Kind.DAMAGE_REDUCTION, 15, 3)
	assert_true(reduction.is_percent)
	assert_false(reduction.invulnerable)
	var buff: EffectData = _effect(data, 1, EffectData.Kind.BUFF, 10, 3)
	assert_eq(buff.ability_names, Build.names(["Naruto Kick"]))
	var enable: EffectData = _effect(data, 2, EffectData.Kind.ENABLE_ABILITY, 0, 3)
	assert_eq(enable.ability_names, Build.names(["Rasengan"]))


func test_naruto_kick_matches_the_table() -> void:
	_damage_only("Naruto Kick", [T, R], 0, 20)


func test_rasengan_matches_the_table() -> void:
	var data: AbilityData = _check("Rasengan", [N, R], 1, ENEMY, 2)
	_effect(data, 0, EffectData.Kind.DAMAGE, 35)
	_effect(data, 1, EffectData.Kind.STUN, 0, 1)
	assert_eq(data.required_enabler, "Kage Bunshin")


func test_escape_clone_matches_the_table() -> void:
	_invulnerable("Escape Clone", 1)


func test_fireball_matches_the_table() -> void:
	_damage_only("Fireball", [N], 1, 25)


func test_chidori_matches_the_table() -> void:
	_damage_only("Chidori", [N, R], 1, 35)


func test_sharingan_matches_the_table() -> void:
	var data: AbilityData = _check("Sharingan", [B, R], 4, SELF, 2)
	var reduction: EffectData = _effect(data, 0, EffectData.Kind.DAMAGE_REDUCTION, 15, 3)
	assert_false(reduction.is_percent)
	assert_false(reduction.invulnerable)
	var buff: EffectData = _effect(data, 1, EffectData.Kind.BUFF, 10, 3)
	assert_eq(buff.ability_names, Build.names(["Chidori"]))


func test_kawarimi_matches_the_table() -> void:
	_invulnerable("Kawarimi", 1)


func test_anger_punch_matches_the_table() -> void:
	_damage_only("Anger Punch", [T], 0, 15)


func test_heal_matches_the_table() -> void:
	var data: AbilityData = _check("Heal", [N], 0, ALLY, 1)
	_effect(data, 0, EffectData.Kind.HEAL, 15)


func test_inner_strength_matches_the_table() -> void:
	var data: AbilityData = _check("Inner Strength", [R], 4, SELF, 2)
	var reduction: EffectData = _effect(data, 0, EffectData.Kind.DAMAGE_REDUCTION, 10, 3)
	assert_false(reduction.is_percent)
	var buff: EffectData = _effect(data, 1, EffectData.Kind.BUFF, 10, 3)
	assert_eq(buff.ability_names, Build.names(["Anger Punch"]))


func test_konoha_senpu_matches_the_table() -> void:
	var data: AbilityData = _damage_only("Konoha Senpu", [T], 1, 20)
	assert_true(data.stacking)


func test_primary_lotus_matches_the_table() -> void:
	var data: AbilityData = _check("Primary Lotus", [T], 1, ENEMY, 1)
	var transform: EffectData = _effect(data, 0, EffectData.Kind.TRANSFORM, 30, 2)
	assert_eq(transform.replacement, Content.ability("Hidden Lotus"))


func test_release_weights_matches_the_table() -> void:
	var data: AbilityData = _check("Release Weights", [T], 1, SELF, 1)
	var reduction: EffectData = _effect(data, 0, EffectData.Kind.DAMAGE_REDUCTION, 10, 2)
	assert_false(reduction.is_percent)
	assert_false(reduction.invulnerable)


func test_backflip_matches_the_table() -> void:
	_invulnerable("Backflip", 1)


func test_hidden_lotus_matches_the_table() -> void:
	_damage_only("Hidden Lotus", [T, R], 0, 40)


func test_stacking_is_only_set_on_konoha_senpu() -> void:
	for ability_name: String in ALL_NAMES:
		assert_eq(Content.ability(ability_name).stacking, ability_name == "Konoha Senpu")


func test_only_rasengan_needs_an_enabler() -> void:
	for ability_name: String in ALL_NAMES:
		var expected: String = "Kage Bunshin" if ability_name == "Rasengan" else ""
		assert_eq(Content.ability(ability_name).required_enabler, expected)


func test_select_screen_order_is_naruto_sasuke_sakura_rock_lee() -> void:
	var names: Array[String] = []
	for character: CharacterData in Content.characters():
		names.append(character.display_name)
	assert_eq(names, Build.names(["Naruto", "Sasuke", "Sakura", "Rock Lee"]))


func test_ai_roster_is_naruto_sasuke_sakura() -> void:
	var names: Array[String] = []
	for character: CharacterData in Content.ai_roster():
		names.append(character.display_name)
	assert_eq(names, Build.names(["Naruto", "Sasuke", "Sakura"]))


func test_each_character_has_exactly_four_base_abilities() -> void:
	for character: CharacterData in Content.characters():
		assert_eq(character.abilities.size(), 4)
	for character: CharacterData in Content.ai_roster():
		assert_eq(character.abilities.size(), 4)


func test_base_ability_lists_match_the_table() -> void:
	var expected: Dictionary = {
		"Naruto": ["Kage Bunshin", "Naruto Kick", "Rasengan", "Escape Clone"],
		"Sasuke": ["Fireball", "Chidori", "Sharingan", "Kawarimi"],
		"Sakura": ["Anger Punch", "Heal", "Inner Strength", "Kawarimi"],
		"Rock Lee": ["Konoha Senpu", "Primary Lotus", "Release Weights", "Backflip"],
	}
	for character: CharacterData in Content.characters():
		var names: Array[String] = []
		for data: AbilityData in character.abilities:
			names.append(data.display_name)
		assert_eq(names, Build.names(expected[character.display_name]))


func test_hidden_lotus_is_not_in_rock_lees_base_list() -> void:
	var rock_lee: CharacterData = Content.characters()[3]
	for data: AbilityData in rock_lee.abilities:
		assert_ne(data.display_name, "Hidden Lotus")


func test_sakura_and_sasuke_share_one_kawarimi_resource() -> void:
	var sasuke: CharacterData = Content.characters()[1]
	var sakura: CharacterData = Content.characters()[2]
	assert_true(sasuke.abilities[3] == sakura.abilities[3])
	assert_true(sasuke.abilities[3] == Content.ability("Kawarimi"))


func test_ai_roster_uses_the_same_ability_resources_as_the_select_list() -> void:
	var roster: Array[CharacterData] = Content.ai_roster()
	var selectable: Array[CharacterData] = Content.characters()
	for i: int in 3:
		assert_eq(roster[i].abilities, selectable[i].abilities)


func test_descriptions_state_the_data_values() -> void:
	assert_true(Content.ability("Release Weights").description.contains("10 damage reduction"))
	assert_true(Content.ability("Release Weights").description.contains("2 turns"))
	assert_true(Content.ability("Inner Strength").description.contains("10"))
	assert_false(Content.ability("Inner Strength").description.contains("5"))
	assert_true(Content.ability("Kage Bunshin").description.contains("15%"))
	assert_true(Content.ability("Sharingan").description.contains("15"))
	assert_true(Content.ability("Naruto Kick").description.contains("20"))
	assert_true(Content.ability("Rasengan").description.contains("35"))
	assert_true(Content.ability("Chidori").description.contains("35"))
	assert_true(Content.ability("Fireball").description.contains("25"))
	assert_true(Content.ability("Konoha Senpu").description.contains("20"))
	assert_true(Content.ability("Primary Lotus").description.contains("30"))
	assert_true(Content.ability("Hidden Lotus").description.contains("40"))
	assert_true(Content.ability("Anger Punch").description.contains("15"))
	assert_true(Content.ability("Heal").description.contains("15"))


func _battle(first: Array[CharacterData], seed_value: int = 1) -> Battle:
	var team_a: Team = Team.new(first)
	var team_b: Team = Team.new(Content.ai_roster())
	return Build.battle(team_a, team_b, seed_value)


func _fund(battle: Battle, team_idx: int, list: Array) -> void:
	battle.teams[team_idx].pool.chakras.clear()
	Build.give(battle.teams[team_idx].pool, list)


func _cast(battle: Battle, fighter_idx: int, ability_idx: int, target_idx: int, payment: Array) -> Array[BattleEvent]:
	var team_idx: int = battle.current_team
	var fighter: Fighter = battle.teams[team_idx].fighters[fighter_idx]
	var target: Fighter = battle.teams[1 - team_idx].fighters[target_idx]
	var action: Action = Action.new(fighter, fighter.abilities[ability_idx], target)
	return battle.submit_turn(team_idx, Build.actions([action]), Build.types(payment))


func _rejected(events: Array[BattleEvent]) -> bool:
	return events.size() == 1 and events[0].type == BattleEvent.Type.REJECTED


func test_rasengan_is_blocked_before_kage_bunshin() -> void:
	var battle: Battle = _battle(Content.characters())
	_fund(battle, 0, [N, N])
	assert_true(_rejected(_cast(battle, 0, 2, 0, [N])))


func test_kage_bunshin_then_rasengan_deals_35_and_stuns() -> void:
	var battle: Battle = _battle(Content.characters())
	_fund(battle, 0, [N])
	assert_false(_rejected(_cast(battle, 0, 0, 0, [N])))
	Build.skip_turn(battle)
	_fund(battle, 0, [N, N])
	var enemy: Fighter = battle.teams[1].fighters[0]
	assert_false(_rejected(_cast(battle, 0, 2, 0, [N])))
	assert_eq(enemy.hp, 65)
	assert_true(enemy.is_stunned())
	var naruto: Fighter = battle.teams[0].fighters[0]
	assert_false(naruto.abilities[2].is_ready())


func test_stun_from_rasengan_blocks_exactly_the_next_enemy_turn() -> void:
	var battle: Battle = _battle(Content.characters())
	_fund(battle, 0, [N])
	_cast(battle, 0, 0, 0, [N])
	Build.skip_turn(battle)
	_fund(battle, 0, [N, N])
	_cast(battle, 0, 2, 0, [N])
	var enemy: Fighter = battle.teams[1].fighters[0]
	_fund(battle, 1, [T, N])
	var blocked: Action = Action.new(enemy, enemy.abilities[1], battle.teams[0].fighters[0])
	assert_true(_rejected(battle.submit_turn(1, Build.actions([blocked]), Build.empty_payment())))
	Build.skip_turn(battle)
	Build.skip_turn(battle)
	assert_false(enemy.is_stunned())
	var allowed: Action = Action.new(enemy, enemy.abilities[1], battle.teams[0].fighters[0])
	_fund(battle, 1, [T, N])
	assert_false(_rejected(battle.submit_turn(1, Build.actions([allowed]), Build.types([N]))))


func test_kage_bunshin_then_naruto_kick_deals_30_on_the_next_own_turn() -> void:
	var battle: Battle = _battle(Content.characters())
	_fund(battle, 0, [N])
	_cast(battle, 0, 0, 0, [N])
	Build.skip_turn(battle)
	_fund(battle, 0, [T, N])
	_cast(battle, 0, 1, 0, [N])
	assert_eq(battle.teams[1].fighters[0].hp, 70)


func test_naruto_kick_deals_20_without_kage_bunshin() -> void:
	var battle: Battle = _battle(Content.characters())
	_fund(battle, 0, [T, N])
	_cast(battle, 0, 1, 0, [N])
	assert_eq(battle.teams[1].fighters[0].hp, 80)


func test_kage_bunshin_reduces_damage_by_15_percent() -> void:
	var battle: Battle = _battle(Content.characters())
	_fund(battle, 0, [N])
	_cast(battle, 0, 0, 0, [N])
	var naruto: Fighter = battle.teams[0].fighters[0]
	assert_eq(naruto.reduced_damage(20), 17)
	assert_eq(naruto.reduced_damage(100), 85)


func test_sharingan_then_chidori_deals_45_on_the_next_own_turn() -> void:
	var team: Array[CharacterData] = [Content.characters()[1], Content.characters()[0], Content.characters()[2]]
	var battle: Battle = _battle(team)
	_fund(battle, 0, [B, N])
	_cast(battle, 0, 2, 0, [N])
	Build.skip_turn(battle)
	_fund(battle, 0, [N, N])
	_cast(battle, 0, 1, 0, [N])
	assert_eq(battle.teams[1].fighters[0].hp, 55)


func test_chidori_deals_35_without_sharingan() -> void:
	var battle: Battle = _battle(Content.characters())
	var sasuke: Fighter = battle.teams[0].fighters[1]
	_fund(battle, 0, [N, N])
	var action: Action = Action.new(sasuke, sasuke.abilities[1], battle.teams[1].fighters[0])
	battle.submit_turn(0, Build.actions([action]), Build.types([N]))
	assert_eq(battle.teams[1].fighters[0].hp, 65)


func test_sharingan_gives_15_flat_reduction() -> void:
	var team: Array[CharacterData] = [Content.characters()[1], Content.characters()[0], Content.characters()[2]]
	var battle: Battle = _battle(team)
	_fund(battle, 0, [B, N])
	_cast(battle, 0, 2, 0, [N])
	var sasuke: Fighter = battle.teams[0].fighters[0]
	assert_eq(sasuke.reduced_damage(25), 10)
	assert_eq(sasuke.reduced_damage(10), 0)


func test_inner_strength_boosts_anger_punch_and_reduces_10() -> void:
	var team: Array[CharacterData] = [Content.characters()[2], Content.characters()[0], Content.characters()[1]]
	var battle: Battle = _battle(team)
	_fund(battle, 0, [N])
	_cast(battle, 0, 2, 0, [N])
	var sakura: Fighter = battle.teams[0].fighters[0]
	assert_eq(sakura.reduced_damage(25), 15)
	Build.skip_turn(battle)
	_fund(battle, 0, [T])
	_cast(battle, 0, 0, 0, [])
	assert_eq(battle.teams[1].fighters[0].hp, 75)


func test_heal_restores_15_and_is_blocked_at_full_hp() -> void:
	var team: Array[CharacterData] = [Content.characters()[2], Content.characters()[0], Content.characters()[1]]
	var battle: Battle = _battle(team)
	_fund(battle, 0, [N])
	var sakura: Fighter = battle.teams[0].fighters[0]
	var heal: Action = Action.new(sakura, sakura.abilities[1], sakura)
	assert_true(_rejected(battle.submit_turn(0, Build.actions([heal]), Build.empty_payment())))
	sakura.hp = 60
	assert_false(_rejected(battle.submit_turn(0, Build.actions([heal]), Build.empty_payment())))
	assert_eq(sakura.hp, 75)


func test_release_weights_reduces_10_for_exactly_two_enemy_turns() -> void:
	var battle: Battle = _lee_battle()
	var lee: Fighter = battle.teams[0].fighters[0]
	_fund(battle, 0, [T])
	_cast(battle, 0, 2, 0, [])
	assert_eq(lee.reduced_damage(25), 15)
	Build.skip_turn(battle)
	assert_eq(lee.reduced_damage(25), 15)
	Build.skip_turn(battle)
	assert_eq(lee.reduced_damage(25), 15)
	Build.skip_turn(battle)
	Build.skip_turn(battle)
	assert_eq(lee.reduced_damage(25), 25)


func test_kawarimi_makes_the_caster_untargetable_for_one_enemy_turn() -> void:
	var battle: Battle = _battle(Content.characters())
	var sasuke: Fighter = battle.teams[0].fighters[1]
	_fund(battle, 0, [N])
	var action: Action = Action.new(sasuke, sasuke.abilities[3], sasuke)
	battle.submit_turn(0, Build.actions([action]), Build.types([N]))
	var enemy: Fighter = battle.teams[1].fighters[0]
	assert_true(sasuke.is_invulnerable())
	assert_false(battle.valid_targets(1, enemy, enemy.abilities[0]).has(sasuke))
	Build.skip_turn(battle)
	assert_false(sasuke.is_invulnerable())


func _lee_battle() -> Battle:
	var rock_lee: Array[CharacterData] = [Content.characters()[3], Content.characters()[0], Content.characters()[1]]
	return _battle(rock_lee)


func test_primary_lotus_deals_30_and_swaps_the_slot_to_hidden_lotus() -> void:
	var battle: Battle = _lee_battle()
	var lee: Fighter = battle.teams[0].fighters[0]
	_fund(battle, 0, [T])
	_cast(battle, 0, 1, 0, [])
	assert_eq(battle.teams[1].fighters[0].hp, 70)
	assert_eq(lee.abilities[1].data.display_name, "Hidden Lotus")


func test_hidden_lotus_is_usable_on_the_next_own_turn_for_40() -> void:
	var battle: Battle = _lee_battle()
	var lee: Fighter = battle.teams[0].fighters[0]
	_fund(battle, 0, [T])
	_cast(battle, 0, 1, 0, [])
	Build.skip_turn(battle)
	assert_eq(lee.abilities[1].data.display_name, "Hidden Lotus")
	_fund(battle, 0, [T, N])
	assert_false(_rejected(_cast(battle, 0, 1, 1, [N])))
	assert_eq(battle.teams[1].fighters[1].hp, 60)


func test_hidden_lotus_reverts_to_primary_lotus_on_the_second_own_turn_after_the_cast() -> void:
	var battle: Battle = _lee_battle()
	var lee: Fighter = battle.teams[0].fighters[0]
	_fund(battle, 0, [T])
	_cast(battle, 0, 1, 0, [])
	assert_eq(battle.turn, 2)
	Build.skip_turn(battle)
	assert_eq(battle.turn, 3)
	assert_eq(lee.abilities[1].data.display_name, "Hidden Lotus")
	Build.skip_turn(battle)
	Build.skip_turn(battle)
	assert_eq(battle.turn, 5)
	assert_eq(lee.abilities[1].data.display_name, "Primary Lotus")
	assert_true(lee.abilities[1].is_ready())


func test_konoha_senpu_three_uses_deal_20_25_30() -> void:
	var battle: Battle = _lee_battle()
	var target: Fighter = battle.teams[1].fighters[0]
	var expected_hp: Array[int] = [80, 55, 25]
	for i: int in 3:
		_fund(battle, 0, [T])
		assert_false(_rejected(_cast(battle, 0, 0, 0, [])))
		assert_eq(target.hp, expected_hp[i])
		Build.skip_turn(battle)
		Build.skip_turn(battle)
		Build.skip_turn(battle)


func test_konoha_senpu_cooldown_blocks_the_next_own_turn() -> void:
	var battle: Battle = _lee_battle()
	_fund(battle, 0, [T, T])
	_cast(battle, 0, 0, 0, [])
	Build.skip_turn(battle)
	_fund(battle, 0, [T])
	assert_true(_rejected(_cast(battle, 0, 0, 0, [])))


func _bot_actions(battle: Battle, team_idx: int, rng: Rng) -> Array[Action]:
	var actions: Array[Action] = []
	for fighter: Fighter in battle.teams[team_idx].living_fighters():
		var options: Array[AbilityState] = fighter.abilities.duplicate()
		rng.shuffle(options)
		for state: AbilityState in options:
			if not state.is_ready():
				continue
			var targets: Array[Fighter] = battle.valid_targets(team_idx, fighter, state)
			if targets.is_empty():
				continue
			var candidate: Array[Action] = actions.duplicate()
			candidate.append(Action.new(fighter, state, rng.pick(targets)))
			if battle.can_afford_queue(team_idx, candidate):
				actions = candidate
				break
	return actions


func _payment(battle: Battle, team_idx: int, actions: Array[Action], rng: Rng) -> Array[ChakraType.Type]:
	var work: Array[ChakraType.Type] = battle.teams[team_idx].pool.chakras.duplicate()
	var random_slots: int = 0
	for action: Action in actions:
		for type: ChakraType.Type in action.ability.data.cost:
			if type == R:
				random_slots += 1
			else:
				work.remove_at(work.find(type))
	rng.shuffle(work)
	var payment: Array[ChakraType.Type] = []
	for i: int in random_slots:
		payment.append(work[i])
	return payment


func _play(seed_value: int) -> Battle:
	var battle: Battle = Battle.new(Team.new(Content.characters().slice(0, 3)), Team.new(Content.ai_roster()), Rng.new(seed_value))
	var bot_rng: Rng = Rng.new(seed_value + 500)
	battle.start()
	var played: int = 0
	while not battle.result.ended and played < 200:
		played += 1
		var idx: int = battle.current_team
		var actions: Array[Action] = _bot_actions(battle, idx, bot_rng)
		var events: Array[BattleEvent] = battle.submit_turn(idx, actions, _payment(battle, idx, actions, bot_rng))
		assert_false(_rejected(events))
	return battle


func test_seeded_full_match_with_real_teams_ends_with_a_winner() -> void:
	for seed_value: int in [1, 2, 3, 4, 5]:
		var battle: Battle = _play(seed_value)
		assert_true(battle.result.ended)
		assert_false(battle.result.draw)
		assert_true(battle.result.winner == 0 or battle.result.winner == 1)


func test_seeded_full_match_is_repeatable() -> void:
	var first: Battle = _play(7)
	var second: Battle = _play(7)
	assert_eq(first.turn, second.turn)
	assert_eq(first.result.winner, second.result.winner)


func test_full_match_with_rock_lee_ends_with_a_winner() -> void:
	var team: Array[CharacterData] = [Content.characters()[3], Content.characters()[1], Content.characters()[2]]
	var battle: Battle = Battle.new(Team.new(team), Team.new(Content.ai_roster()), Rng.new(11))
	var bot_rng: Rng = Rng.new(12)
	battle.start()
	var played: int = 0
	while not battle.result.ended and played < 200:
		played += 1
		var idx: int = battle.current_team
		var actions: Array[Action] = _bot_actions(battle, idx, bot_rng)
		battle.submit_turn(idx, actions, _payment(battle, idx, actions, bot_rng))
	assert_true(battle.result.ended)
	assert_false(battle.result.draw)
