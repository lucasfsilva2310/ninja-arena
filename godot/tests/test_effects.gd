extends "res://tools/test_case.gd"

const Build: GDScript = preload("res://tests/builders.gd")

var _strike: AbilityData = Build.hit(20)


func _act(battle: Battle, team_idx: int, fighter_idx: int, ability_idx: int, target_idx: int = 0) -> Array[BattleEvent]:
	var fighter: Fighter = battle.teams[team_idx].fighters[fighter_idx]
	var target: Fighter = battle.teams[1 - team_idx].fighters[target_idx]
	var action: Action = Action.new(fighter, fighter.abilities[ability_idx], target)
	return battle.submit_turn(team_idx, Build.actions([action]), Build.empty_payment())


func _rejected(events: Array[BattleEvent]) -> bool:
	return events.size() == 1 and events[0].type == BattleEvent.Type.REJECTED


func _pass(battle: Battle, count: int = 1) -> void:
	for i: int in count:
		Build.skip_turn(battle)


func _count(events: Array[BattleEvent], type: BattleEvent.Type) -> int:
	var total: int = 0
	for event: BattleEvent in events:
		if event.type == type:
			total += 1
	return total


func _boost_battle(boost_value: int = 10, duration: int = 3) -> Battle:
	var boost: AbilityData = Build.self_cast("Boost", [Build.buff(boost_value, duration, ["Hit20"])])
	var other: AbilityData = Build.hit(20)
	return Build.battle(Build.team([boost, other]), Build.team([Build.hit(1)]))


func test_buff_lasts_owner_turns_1_3_5_and_expires_turn_7() -> void:
	var battle: Battle = _boost_battle()
	_act(battle, 0, 0, 0)
	var f0: Fighter = battle.teams[0].fighters[0]
	assert_eq(f0.effects[0].remaining, 3)
	_pass(battle)
	assert_eq(f0.effects[0].remaining, 2)
	_act(battle, 0, 0, 1, 0)
	assert_eq(battle.teams[1].fighters[0].hp, 70)
	_pass(battle)
	assert_eq(f0.effects[0].remaining, 1)
	_act(battle, 0, 0, 1, 1)
	assert_eq(battle.teams[1].fighters[1].hp, 70)
	_pass(battle)
	assert_eq(f0.effects.size(), 0)
	_act(battle, 0, 0, 1, 2)
	assert_eq(battle.teams[1].fighters[2].hp, 80)


func test_buff_affects_only_the_named_ability() -> void:
	var boost: AbilityData = Build.self_cast("Boost", [Build.buff(10, 3, ["Hit20"])])
	var named: AbilityData = Build.hit(20)
	var unnamed: AbilityData = Build.ability("Plain", [], 0, AbilityData.Target.ENEMY, [Build.effect(EffectData.Kind.DAMAGE, 20)])
	var battle: Battle = Build.battle(Build.team([boost, named, unnamed]), Build.team([Build.hit(1)]))
	_act(battle, 0, 0, 0)
	_pass(battle)
	_act(battle, 0, 0, 2, 0)
	assert_eq(battle.teams[1].fighters[0].hp, 80)
	_pass(battle)
	_act(battle, 0, 0, 1, 1)
	assert_eq(battle.teams[1].fighters[1].hp, 70)


func test_buff_does_not_affect_other_fighters() -> void:
	var battle: Battle = _boost_battle()
	_act(battle, 0, 0, 0)
	_pass(battle)
	_act(battle, 0, 1, 1, 0)
	assert_eq(battle.teams[1].fighters[0].hp, 80)


func test_two_buffs_on_one_ability_add_up() -> void:
	var boost_a: AbilityData = Build.self_cast("BoostA", [Build.buff(10, 3, ["Hit20"])])
	var boost_b: AbilityData = Build.self_cast("BoostB", [Build.buff(5, 3, ["Hit20"])])
	var battle: Battle = Build.battle(Build.team([boost_a, boost_b, _strike]), Build.team([Build.hit(1)]))
	_act(battle, 0, 0, 0)
	_pass(battle)
	_act(battle, 0, 0, 1)
	_pass(battle)
	_act(battle, 0, 0, 2, 0)
	assert_eq(battle.teams[1].fighters[0].hp, 65)


func test_buff_does_not_count_as_damage_reduction() -> void:
	var battle: Battle = _boost_battle()
	_act(battle, 0, 0, 0)
	var f0: Fighter = battle.teams[0].fighters[0]
	assert_eq(f0.reduced_damage(40), 40)
	assert_false(f0.is_invulnerable())


func _gated_battle(enabler_name: String, listed: Array) -> Battle:
	var unlock: AbilityData = Build.self_cast("Unlock", [Build.enable(3, listed)])
	var gated: AbilityData = Build.hit(10)
	gated.display_name = "Gated"
	gated.required_enabler = enabler_name
	return Build.battle(Build.team([unlock, gated]), Build.team([Build.hit(1)]))


func test_enable_blocks_gated_ability_before_and_hides_it_from_targets() -> void:
	var battle: Battle = _gated_battle("Unlock", ["Gated"])
	var f0: Fighter = battle.teams[0].fighters[0]
	assert_true(battle.valid_targets(0, f0, f0.abilities[1]).is_empty())
	assert_true(_rejected(_act(battle, 0, 0, 1, 0)))
	assert_eq(battle.teams[1].fighters[0].hp, 100)


func test_enable_allows_gated_ability_during_owner_turns_1_3_5() -> void:
	var battle: Battle = _gated_battle("Unlock", ["Gated"])
	var f0: Fighter = battle.teams[0].fighters[0]
	_act(battle, 0, 0, 0)
	assert_false(battle.valid_targets(0, f0, f0.abilities[1]).is_empty())
	_pass(battle)
	assert_false(_rejected(_act(battle, 0, 0, 1, 0)))
	_pass(battle)
	assert_false(_rejected(_act(battle, 0, 0, 1, 1)))
	assert_eq(battle.teams[1].fighters[0].hp, 90)
	assert_eq(battle.teams[1].fighters[1].hp, 90)


func test_enable_blocks_gated_ability_after_expiry() -> void:
	var battle: Battle = _gated_battle("Unlock", ["Gated"])
	var f0: Fighter = battle.teams[0].fighters[0]
	_act(battle, 0, 0, 0)
	_pass(battle, 5)
	assert_true(battle.valid_targets(0, f0, f0.abilities[1]).is_empty())
	assert_true(_rejected(_act(battle, 0, 0, 1, 0)))


func test_enable_matches_by_effect_name_when_ability_is_not_listed() -> void:
	var battle: Battle = _gated_battle("Unlock", ["Something else"])
	_act(battle, 0, 0, 0)
	_pass(battle)
	assert_false(_rejected(_act(battle, 0, 0, 1, 0)))


func test_enable_matches_by_listed_name_when_enabler_name_differs() -> void:
	var battle: Battle = _gated_battle("Other enabler", ["Gated"])
	_act(battle, 0, 0, 0)
	_pass(battle)
	assert_false(_rejected(_act(battle, 0, 0, 1, 0)))


func test_enable_with_no_match_keeps_ability_blocked() -> void:
	var battle: Battle = _gated_battle("Other enabler", ["Something else"])
	_act(battle, 0, 0, 0)
	_pass(battle)
	assert_true(_rejected(_act(battle, 0, 0, 1, 0)))


func test_enable_applies_only_to_the_caster() -> void:
	var battle: Battle = _gated_battle("Unlock", ["Gated"])
	_act(battle, 0, 0, 0)
	_pass(battle)
	assert_true(_rejected(_act(battle, 0, 1, 1, 0)))


func _transform_battle() -> Battle:
	var alt: AbilityData = Build.hit(40)
	alt.display_name = "Alt"
	var morph: AbilityData = Build.ability("Morph", [], 3, AbilityData.Target.ENEMY, [Build.transform(alt, 2, 5)])
	return Build.battle(Build.team([morph, Build.hit(1)]), Build.team([Build.hit(1)]))


func test_transform_swaps_slot_and_deals_damage_on_use() -> void:
	var battle: Battle = _transform_battle()
	var f0: Fighter = battle.teams[0].fighters[0]
	_act(battle, 0, 0, 0, 0)
	assert_eq(f0.abilities[0].data.display_name, "Alt")
	assert_eq(f0.abilities.size(), 2)
	assert_eq(battle.teams[1].fighters[0].hp, 95)


func test_transform_swapped_ability_works() -> void:
	var battle: Battle = _transform_battle()
	_act(battle, 0, 0, 0, 0)
	_pass(battle)
	assert_false(_rejected(_act(battle, 0, 0, 0, 1)))
	assert_eq(battle.teams[1].fighters[1].hp, 60)


func test_transform_reverts_after_duration_and_source_cooldown_still_applies() -> void:
	var battle: Battle = _transform_battle()
	var f0: Fighter = battle.teams[0].fighters[0]
	var original: AbilityState = f0.abilities[0]
	_act(battle, 0, 0, 0, 0)
	_pass(battle)
	assert_eq(f0.abilities[0].data.display_name, "Alt")
	assert_eq(original.cooldown, 3)
	_pass(battle, 2)
	assert_true(f0.abilities[0] == original)
	assert_eq(original.cooldown, 2)
	assert_true(_rejected(_act(battle, 0, 0, 0, 0)))
	assert_eq(f0.effects.size(), 0)


func test_transform_source_is_usable_again_once_its_cooldown_ends() -> void:
	var battle: Battle = _transform_battle()
	_act(battle, 0, 0, 0, 0)
	_pass(battle, 7)
	assert_false(_rejected(_act(battle, 0, 0, 0, 0)))


func test_transform_replacement_starts_with_its_own_fresh_cooldown() -> void:
	var battle: Battle = _transform_battle()
	var f0: Fighter = battle.teams[0].fighters[0]
	_act(battle, 0, 0, 0, 0)
	assert_eq(f0.abilities[0].cooldown, 0)


func _stun_battle(duration: int) -> Battle:
	var zap: AbilityData = Build.ability("Zap", [], 5, AbilityData.Target.ENEMY, [Build.stun(duration)])
	var costly: AbilityData = Build.ability("Costly", [Build.R, Build.R, Build.R, Build.R], 0, AbilityData.Target.ENEMY, [Build.effect(EffectData.Kind.DAMAGE, 1)])
	return Build.battle(Build.team([zap]), Build.team([Build.hit(1), costly]))


func test_stun_of_one_blocks_exactly_one_own_turn() -> void:
	var battle: Battle = _stun_battle(1)
	var e0: Fighter = battle.teams[1].fighters[0]
	_act(battle, 0, 0, 0, 0)
	assert_true(e0.is_stunned())
	assert_true(_rejected(_act(battle, 1, 0, 0, 0)))
	assert_false(_rejected(_act(battle, 1, 1, 0, 0)))
	assert_false(e0.is_stunned())
	_pass(battle)
	assert_false(_rejected(_act(battle, 1, 0, 0, 0)))


func test_stun_of_two_blocks_exactly_two_own_turns() -> void:
	var battle: Battle = _stun_battle(2)
	var e0: Fighter = battle.teams[1].fighters[0]
	_act(battle, 0, 0, 0, 0)
	assert_true(_rejected(_act(battle, 1, 0, 0, 0)))
	_pass(battle)
	_pass(battle)
	assert_true(e0.is_stunned())
	assert_true(_rejected(_act(battle, 1, 0, 0, 0)))
	_pass(battle)
	_pass(battle)
	assert_false(e0.is_stunned())
	assert_false(_rejected(_act(battle, 1, 0, 0, 0)))


func test_stun_does_not_block_other_fighters_or_the_stunner_team() -> void:
	var battle: Battle = _stun_battle(1)
	_act(battle, 0, 0, 0, 0)
	assert_false(_rejected(_act(battle, 1, 2, 0, 0)))
	assert_false(_rejected(_act(battle, 0, 1, 0, 1)))


func test_stunned_fighter_has_no_valid_targets() -> void:
	var battle: Battle = _stun_battle(1)
	_act(battle, 0, 0, 0, 0)
	var e0: Fighter = battle.teams[1].fighters[0]
	assert_true(battle.valid_targets(1, e0, e0.abilities[0]).is_empty())


func test_stunned_fighter_is_skipped_by_can_afford_queue() -> void:
	var battle: Battle = _stun_battle(1)
	_act(battle, 0, 0, 0, 0)
	var e0: Fighter = battle.teams[1].fighters[0]
	var e1: Fighter = battle.teams[1].fighters[1]
	var target: Fighter = battle.teams[0].fighters[0]
	var stunned_costly: Action = Action.new(e0, e0.abilities[1], target)
	var free_costly: Action = Action.new(e1, e1.abilities[1], target)
	assert_true(battle.can_afford_queue(1, Build.actions([stunned_costly])))
	assert_false(battle.can_afford_queue(1, Build.actions([free_costly])))


func test_stun_expiry_emits_an_event_when_the_stunned_turn_ends() -> void:
	var battle: Battle = _stun_battle(1)
	var applied: Array[BattleEvent] = _act(battle, 0, 0, 0, 0)
	assert_eq(_count(applied, BattleEvent.Type.EFFECT_ADDED), 1)
	assert_eq(_count(applied, BattleEvent.Type.EFFECT_EXPIRED), 0)
	var ended: Array[BattleEvent] = _act(battle, 1, 1, 0, 0)
	assert_eq(_count(ended, BattleEvent.Type.EFFECT_EXPIRED), 1)


func test_stun_lists_in_active_effects_until_the_stunned_turn_ends() -> void:
	var battle: Battle = _stun_battle(1)
	var e0: Fighter = battle.teams[1].fighters[0]
	_act(battle, 0, 0, 0, 0)
	assert_eq(e0.active_effects().size(), 1)
	assert_eq(e0.active_effects()[0].remaining, 1)
	_act(battle, 1, 1, 0, 0)
	assert_eq(e0.active_effects().size(), 0)


func _stack_battle() -> Battle:
	var senpu: AbilityData = Build.hit(20)
	senpu.display_name = "Senpu"
	senpu.stacking = true
	return Build.battle(Build.team([senpu]), Build.team([Build.hit(1)]))


func test_stacking_ability_deals_20_then_25_then_30() -> void:
	var battle: Battle = _stack_battle()
	_act(battle, 0, 0, 0, 0)
	_pass(battle)
	_act(battle, 0, 0, 0, 1)
	_pass(battle)
	_act(battle, 0, 0, 0, 2)
	assert_eq(battle.teams[1].fighters[0].hp, 80)
	assert_eq(battle.teams[1].fighters[1].hp, 75)
	assert_eq(battle.teams[1].fighters[2].hp, 70)


func test_stacking_is_tracked_per_fighter() -> void:
	var battle: Battle = _stack_battle()
	_act(battle, 0, 0, 0, 0)
	_pass(battle)
	_act(battle, 0, 1, 0, 1)
	assert_eq(battle.teams[1].fighters[1].hp, 80)


func test_non_stacking_ability_keeps_flat_damage() -> void:
	var battle: Battle = Build.battle(Build.team([_strike]), Build.team([Build.hit(1)]))
	_act(battle, 0, 0, 0, 0)
	_pass(battle)
	_act(battle, 0, 0, 0, 1)
	assert_eq(battle.teams[1].fighters[1].hp, 80)


func test_stacking_resets_when_the_fighter_dies() -> void:
	var senpu: AbilityData = Build.hit(20)
	senpu.stacking = true
	var fighter: Fighter = Fighter.new(Build.character("Lee", [senpu]))
	fighter.stack_counts[senpu] = 2
	assert_eq(fighter.stack_count(senpu), 2)
	fighter.take_damage(100)
	assert_false(fighter.is_alive())
	assert_eq(fighter.stack_count(senpu), 0)


func test_stacking_survives_damage_that_does_not_kill() -> void:
	var senpu: AbilityData = Build.hit(20)
	var fighter: Fighter = Fighter.new(Build.character("Lee", [senpu]))
	fighter.stack_counts[senpu] = 2
	fighter.take_damage(30)
	assert_eq(fighter.stack_count(senpu), 2)


func test_stacking_adds_to_buff_damage() -> void:
	var senpu: AbilityData = Build.hit(20)
	senpu.stacking = true
	var boost: AbilityData = Build.self_cast("Boost", [Build.buff(10, 5, ["Hit20"])])
	var battle: Battle = Build.battle(Build.team([boost, senpu]), Build.team([Build.hit(1)]))
	_act(battle, 0, 0, 0)
	_pass(battle)
	_act(battle, 0, 0, 1, 0)
	_pass(battle)
	_act(battle, 0, 0, 1, 1)
	assert_eq(battle.teams[1].fighters[0].hp, 70)
	assert_eq(battle.teams[1].fighters[1].hp, 65)


func _naruto_battle() -> Battle:
	var kick: AbilityData = Build.hit(20)
	kick.display_name = "Kick"
	var rasengan: AbilityData = Build.ability("Rasengan", [], 1, AbilityData.Target.ENEMY, [Build.effect(EffectData.Kind.DAMAGE, 35), Build.stun(1)])
	rasengan.required_enabler = "Kage Bunshin"
	var kage: AbilityData = Build.self_cast("Kage Bunshin", [
		Build.effect(EffectData.Kind.DAMAGE_REDUCTION, 15, 3, true),
		Build.buff(10, 3, ["Kick"]),
		Build.enable(3, ["Rasengan"]),
	], 5)
	return Build.battle(Build.team([kage, kick, rasengan]), Build.team([Build.hit(1)]))


func test_combined_kage_bunshin_kick_rasengan_and_stun() -> void:
	var battle: Battle = _naruto_battle()
	assert_true(_rejected(_act(battle, 0, 0, 2, 0)))
	_act(battle, 0, 0, 0)
	var f0: Fighter = battle.teams[0].fighters[0]
	assert_eq(f0.active_effects().size(), 3)
	assert_eq(f0.reduced_damage(100), 85)
	_pass(battle)
	_act(battle, 0, 0, 1, 0)
	assert_eq(battle.teams[1].fighters[0].hp, 70)
	_pass(battle)
	_act(battle, 0, 0, 2, 1)
	assert_eq(battle.teams[1].fighters[1].hp, 65)
	assert_true(battle.teams[1].fighters[1].is_stunned())
	assert_true(_rejected(_act(battle, 1, 1, 0, 0)))
	assert_false(_rejected(_act(battle, 1, 0, 0, 0)))
	_pass(battle)
	assert_true(f0.active_effects().is_empty())
	assert_false(battle.teams[1].fighters[1].is_stunned())


func test_dead_fighter_effects_stop_ticking_and_emit_no_events() -> void:
	var boost: AbilityData = Build.self_cast("Boost", [Build.buff(10, 3, ["Hit20"])])
	var battle: Battle = Build.battle(Build.team([boost]), Build.team([Build.hit(100)]))
	_act(battle, 0, 0, 0)
	var f0: Fighter = battle.teams[0].fighters[0]
	_act(battle, 1, 0, 0, 0)
	assert_false(f0.is_alive())
	var expired: int = 0
	for i: int in 4:
		var events: Array[BattleEvent] = battle.submit_turn(battle.current_team, Build.actions([]), Build.empty_payment())
		expired += _count(events, BattleEvent.Type.EFFECT_EXPIRED)
	assert_eq(expired, 0)
	assert_eq(f0.effects[0].remaining, 3)


func test_events_one_added_and_one_expired_with_readable_text() -> void:
	var battle: Battle = _boost_battle(10, 1)
	var added: Array[BattleEvent] = _act(battle, 0, 0, 0)
	assert_eq(_count(added, BattleEvent.Type.EFFECT_ADDED), 1)
	for event: BattleEvent in added:
		if event.type == BattleEvent.Type.EFFECT_ADDED:
			assert_true(event.text.contains("Boost"))
			assert_true(event.text.contains("10"))
			assert_eq(event.target, battle.teams[0].fighters[0])
	var expired: Array[BattleEvent] = battle.submit_turn(1, Build.actions([]), Build.empty_payment())
	assert_eq(_count(expired, BattleEvent.Type.EFFECT_EXPIRED), 1)
	for event: BattleEvent in expired:
		if event.type == BattleEvent.Type.EFFECT_EXPIRED:
			assert_true(event.text.contains("Boost"))


func test_events_for_enable_transform_and_stun_have_text() -> void:
	var battle: Battle = _gated_battle("Unlock", ["Gated"])
	var enable_events: Array[BattleEvent] = _act(battle, 0, 0, 0)
	assert_eq(_count(enable_events, BattleEvent.Type.EFFECT_ADDED), 1)
	for event: BattleEvent in enable_events:
		if event.type == BattleEvent.Type.EFFECT_ADDED:
			assert_true(event.text.contains("Gated"))
	var transform_battle: Battle = _transform_battle()
	var transform_events: Array[BattleEvent] = _act(transform_battle, 0, 0, 0, 0)
	assert_eq(_count(transform_events, BattleEvent.Type.EFFECT_ADDED), 1)
	for event: BattleEvent in transform_events:
		if event.type == BattleEvent.Type.EFFECT_ADDED:
			assert_true(event.text.contains("Alt"))
	_pass(transform_battle, 2)
	var revert_events: Array[BattleEvent] = _pass_events(transform_battle)
	assert_eq(_count(revert_events, BattleEvent.Type.EFFECT_EXPIRED), 1)


func _pass_events(battle: Battle) -> Array[BattleEvent]:
	return battle.submit_turn(battle.current_team, Build.actions([]), Build.empty_payment())


func test_active_effects_api_lists_name_description_and_remaining() -> void:
	var battle: Battle = _boost_battle()
	_act(battle, 0, 0, 0)
	var f0: Fighter = battle.teams[0].fighters[0]
	var listed: Array[ActiveEffect] = f0.active_effects()
	assert_eq(listed.size(), 1)
	assert_eq(listed[0].source_name, "Boost")
	assert_ne(listed[0].description, "")
	assert_eq(listed[0].remaining, 3)
	listed.clear()
	assert_eq(f0.active_effects().size(), 1)
	_pass(battle)
	assert_eq(f0.active_effects()[0].remaining, 2)


func test_active_effects_lists_reductions_too() -> void:
	var guard: AbilityData = Build.self_cast("Guard", [Build.effect(EffectData.Kind.DAMAGE_REDUCTION, 10, 2)])
	var battle: Battle = Build.battle(Build.team([guard]), Build.team([Build.hit(1)]))
	_act(battle, 0, 0, 0)
	var listed: Array[ActiveEffect] = battle.teams[0].fighters[0].active_effects()
	assert_eq(listed.size(), 1)
	assert_eq(listed[0].source_name, "Guard")
	assert_ne(listed[0].description, "")


func test_effect_with_all_enemies_target_applies_self_effects_once() -> void:
	var sweep: AbilityData = Build.ability("Sweep", [], 0, AbilityData.Target.ALL_ENEMIES, [Build.effect(EffectData.Kind.DAMAGE, 5), Build.buff(5, 3, ["Sweep"])])
	var battle: Battle = Build.battle(Build.team([sweep]), Build.team([Build.hit(1)]))
	_act(battle, 0, 0, 0, 0)
	assert_eq(battle.teams[0].fighters[0].effects.size(), 1)
	assert_eq(battle.teams[1].fighters[2].hp, 95)
