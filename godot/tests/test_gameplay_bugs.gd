extends "res://tools/test_case.gd"

const Helpers: GDScript = preload("res://tests/ui_helpers.gd")
const Build: GDScript = preload("res://tests/builders.gd")
const ManualPlayer: GDScript = preload("res://tests/manual_turn_player.gd")


class BrokenAi:
	extends AiPlayer

	func plan_turn(battle: Battle, team_idx: int, _rng: Rng) -> TurnPlan:
		var plan: TurnPlan = TurnPlan.new()
		var stranger: Fighter = battle.teams[1 - team_idx].fighters[0]
		plan.actions.append(Action.new(stranger, stranger.abilities[0], stranger))
		return plan


func _roster(names: Array, seed_value: int = 4) -> Battle:
	var battle: Battle = MatchFactory.new_match(Helpers.team_of(names), seed_value)
	return battle


func _find(battle: Battle, team_idx: int, fighter_name: String) -> Fighter:
	for fighter: Fighter in battle.teams[team_idx].fighters:
		if fighter.display_name() == fighter_name:
			return fighter
	return null


func _button(view: BattleView, fighter: Fighter, ability_name: String) -> AbilityButton:
	for button: AbilityButton in view.panels[fighter].ability_buttons:
		if button.state.data.display_name == ability_name:
			return button
	return null


func _click_fighter(view: BattleView, fighter: Fighter) -> void:
	var event: InputEventMouseButton = InputEventMouseButton.new()
	event.button_index = MOUSE_BUTTON_LEFT
	event.pressed = true
	(view.panels[fighter] as FighterPanel).gui_input.emit(event)


func _use(view: BattleView, fighter: Fighter, ability_name: String, target: Fighter = null) -> void:
	var button: AbilityButton = _button(view, fighter, ability_name)
	assert_true(button != null)
	if button == null:
		return
	assert_false(button.button.disabled)
	button.button.pressed.emit()
	if target != null:
		_click_fighter(view, target)


func _fill(battle: Battle, team_idx: int, list: Array) -> void:
	battle.teams[team_idx].pool.chakras.clear()
	Build.give(battle.teams[team_idx].pool, list)


func _end(view: BattleView) -> void:
	view.end_turn()
	if view.modal is PaymentModal:
		var payment: PaymentModal = view.modal as PaymentModal
		payment.confirmed.emit(view.queue.random_candidates().slice(0, payment.slots))


func _chips(view: BattleView, fighter: Fighter) -> Array[String]:
	var result: Array[String] = []
	for chip: Node in (view.panels[fighter] as FighterPanel).effects_box.get_children():
		result.append((chip.get_child(0) as Label).text)
	return result


func _bar_names(view: BattleView, fighter: Fighter) -> Array[String]:
	var result: Array[String] = []
	for button: AbilityButton in view.panels[fighter].ability_buttons:
		result.append(button.state.data.display_name)
	return result


func _plenty() -> Array:
	return [Build.N, Build.N, Build.T, Build.T, Build.T, Build.T, Build.B, Build.B]


func test_lotus_transform_updates_the_bar_and_the_footer_and_goes_back() -> void:
	var battle: Battle = _roster(["Rock Lee", "Naruto", "Sakura"])
	var view: BattleView = Helpers.mount_battle(battle)
	var lee: Fighter = _find(battle, 0, "Rock Lee")
	var enemy: Fighter = _find(battle, 1, "Naruto")
	_fill(battle, 0, _plenty())
	view.refresh_all()
	view.show_ability(_button(view, lee, "Primary Lotus").state)
	assert_eq(view.desc_name.text, "Primary Lotus")
	_use(view, lee, "Primary Lotus", enemy)
	_end(view)
	assert_eq(_bar_names(view, lee)[1], "Hidden Lotus")
	assert_eq(view.desc_name.text, "Hidden Lotus")
	assert_true(view.desc_text.text.contains("40 damage"))
	assert_true(_chips(view, lee).has("Primary Lotus 1"))
	_fill(battle, 0, _plenty())
	view.refresh_all()
	assert_false(_button(view, lee, "Hidden Lotus").button.disabled)
	_use(view, lee, "Hidden Lotus", enemy)
	_end(view)
	_fill(battle, 0, _plenty())
	view.refresh_all()
	assert_eq(_bar_names(view, lee)[1], "Primary Lotus")
	assert_eq(view.desc_name.text, "Primary Lotus")
	assert_false(_chips(view, lee).has("Primary Lotus 1"))
	assert_eq(_chips(view, lee), [] as Array[String])
	Helpers.unmount(view)


func test_unrelated_footer_text_is_kept_when_an_ability_swaps() -> void:
	var battle: Battle = _roster(["Rock Lee", "Naruto", "Sakura"])
	var view: BattleView = Helpers.mount_battle(battle)
	var lee: Fighter = _find(battle, 0, "Rock Lee")
	var naruto: Fighter = _find(battle, 0, "Naruto")
	_fill(battle, 0, _plenty())
	view.refresh_all()
	_use(view, lee, "Primary Lotus", _find(battle, 1, "Naruto"))
	view.show_ability(_button(view, naruto, "Naruto Kick").state)
	_end(view)
	assert_eq(view.desc_name.text, "Naruto Kick")
	Helpers.unmount(view)


func test_effect_log_lines_have_no_double_punctuation() -> void:
	var battle: Battle = _roster(["Naruto", "Sasuke", "Sakura"])
	var view: BattleView = Helpers.mount_battle(battle)
	var naruto: Fighter = _find(battle, 0, "Naruto")
	_fill(battle, 0, _plenty())
	view.refresh_all()
	_use(view, naruto, "Kage Bunshin")
	_end(view)
	var joined: String = "\n".join(view.history)
	assert_true(joined.contains("Kage Bunshin: Naruto Kick deals 10 more damage (3 turns)"))
	assert_false(joined.contains(". for"))
	assert_false(joined.contains("..") or joined.contains(". ("))
	Helpers.unmount(view)


func test_one_chip_per_ability_with_the_shortest_remaining_turns() -> void:
	var battle: Battle = _roster(["Naruto", "Sasuke", "Sakura"])
	var view: BattleView = Helpers.mount_battle(battle)
	var naruto: Fighter = _find(battle, 0, "Naruto")
	_fill(battle, 0, _plenty())
	view.refresh_all()
	_use(view, naruto, "Kage Bunshin")
	_end(view)
	assert_eq(_chips(view, naruto), ["Kage Bunshin 2"] as Array[String])
	var chip: Control = (view.panels[naruto] as FighterPanel).effects_box.get_child(0) as Control
	assert_true(chip.tooltip_text.contains("15% damage reduction"))
	assert_true(chip.tooltip_text.contains("Naruto Kick deals 10 more damage"))
	assert_true(chip.tooltip_text.contains("can use Rasengan"))
	Helpers.unmount(view)


func test_chips_with_different_remaining_turns_show_the_shortest() -> void:
	var fighter: Fighter = Fighter.new(Helpers.team_of(["Naruto"])[0])
	fighter.add_buff("Mix", 5, 3, ["Naruto Kick"] as Array[String], "a")
	fighter.add_reduction("Mix", 5, 1, false, false, "b")
	var panel: FighterPanel = FighterPanel.new(fighter, false)
	Helpers.tree_root().add_child(panel)
	panel.refresh()
	assert_eq(panel.effect_groups().size(), 1)
	assert_eq(panel.effect_groups()[0]["remaining"], 1)
	Helpers.unmount(panel)


func test_chips_appear_only_when_the_event_plays_and_stay_until_the_expiry_event() -> void:
	var battle: Battle = _roster(["Naruto", "Sasuke", "Sakura"])
	var view: BattleView = Helpers.mount_battle(battle)
	var player: TurnPlayer = ManualPlayer.new()
	view.set_turn_player(player)
	var naruto: Fighter = _find(battle, 0, "Naruto")
	_fill(battle, 0, _plenty())
	view.refresh_all()
	_use(view, naruto, "Kage Bunshin")
	_end(view)
	assert_true(view.resolving)
	assert_eq(_chips(view, naruto), [] as Array[String])
	assert_true(naruto.active_effects().size() > 0)
	player.release()
	assert_eq(_chips(view, naruto), ["Kage Bunshin 3"] as Array[String])
	player.release()
	assert_false(view.resolving)
	assert_eq(_chips(view, naruto), ["Kage Bunshin 2"] as Array[String])
	_fill(battle, 0, _plenty())
	view.refresh_all()
	_end(view)
	player.release()
	player.release()
	assert_eq(_chips(view, naruto), ["Kage Bunshin 1"] as Array[String])
	_fill(battle, 0, _plenty())
	view.refresh_all()
	_end(view)
	player.release()
	assert_eq(_chips(view, naruto), ["Kage Bunshin 1"] as Array[String])
	player.release()
	assert_eq(_chips(view, naruto), [] as Array[String])
	Helpers.unmount(view)


func test_expired_chip_stays_until_its_expiry_event_plays() -> void:
	var battle: Battle = _roster(["Naruto", "Sasuke", "Sakura"])
	var view: BattleView = Helpers.mount_battle(battle)
	var naruto: Fighter = _find(battle, 0, "Naruto")
	naruto.add_buff("Test Buff", 5, 1, ["Naruto Kick"] as Array[String], "buff")
	view.refresh_all()
	assert_eq(_chips(view, naruto), ["Test Buff 1"] as Array[String])
	var player: TurnPlayer = ManualPlayer.new()
	view.set_turn_player(player)
	_end(view)
	player.release()
	assert_eq(_chips(view, naruto), ["Test Buff 1"] as Array[String])
	player.release()
	assert_eq(_chips(view, naruto), [] as Array[String])
	Helpers.unmount(view)


func test_self_ability_queues_on_the_ability_click() -> void:
	var battle: Battle = _roster(["Naruto", "Sasuke", "Sakura"])
	var view: BattleView = Helpers.mount_battle(battle)
	var sasuke: Fighter = _find(battle, 0, "Sasuke")
	_fill(battle, 0, _plenty())
	view.refresh_all()
	_use(view, sasuke, "Kawarimi")
	assert_eq(view.queue.actions.size(), 1)
	assert_eq(view.queue.actions[0].target, sasuke)
	assert_null(view.selected_state)
	assert_eq(_button(view, sasuke, "Kawarimi").lock_reason, "Action queued")
	assert_eq(view.queue_list.get_child_count(), 1)
	_end(view)
	assert_true(sasuke.is_invulnerable() or battle.turn >= 3)
	Helpers.unmount(view)


func test_area_ability_queues_on_the_ability_click() -> void:
	var area: AbilityData = Build.ability("Wave", [], 0, AbilityData.Target.ALL_ENEMIES, [Build.effect(EffectData.Kind.DAMAGE, 10)])
	var battle: Battle = Build.battle(Build.team([area]), Build.team([area]), 3)
	var view: BattleView = Helpers.mount_battle(battle)
	var source: Fighter = battle.teams[0].fighters[0]
	_use(view, source, "Wave")
	assert_eq(view.queue.actions.size(), 1)
	_end(view)
	for enemy: Fighter in battle.teams[1].fighters:
		assert_eq(enemy.hp, 90)
	Helpers.unmount(view)


func test_rasengan_lock_reasons_follow_the_enabler_and_the_stun() -> void:
	var battle: Battle = _roster(["Naruto", "Sasuke", "Sakura"], 9)
	var view: BattleView = Helpers.mount_battle(battle)
	var naruto: Fighter = _find(battle, 0, "Naruto")
	assert_eq(_button(view, naruto, "Rasengan").lock_reason, "Not available yet")
	_fill(battle, 0, _plenty())
	view.refresh_all()
	_use(view, naruto, "Kage Bunshin")
	_end(view)
	_fill(battle, 0, _plenty())
	view.refresh_all()
	assert_true(naruto.can_use_ability(_button(view, naruto, "Rasengan").state.data))
	assert_false(_button(view, naruto, "Rasengan").button.disabled)
	naruto.effects.clear()
	view.refresh_all()
	assert_eq(_button(view, naruto, "Rasengan").lock_reason, "Not available yet")
	assert_true(_button(view, naruto, "Rasengan").button.disabled)
	naruto.add_stun("Test", 1)
	view.refresh_all()
	assert_eq(_button(view, naruto, "Rasengan").lock_reason, "Stunned")
	assert_eq(_button(view, naruto, "Naruto Kick").lock_reason, "Stunned")
	Helpers.unmount(view)


func test_stun_chip_shows_on_the_enemy_while_it_acts_and_ends_after_its_turn() -> void:
	var battle: Battle = _roster(["Naruto", "Sasuke", "Sakura"], 9)
	var view: BattleView = Helpers.mount_battle(battle)
	var player: TurnPlayer = ManualPlayer.new()
	view.set_turn_player(player)
	var naruto: Fighter = _find(battle, 0, "Naruto")
	var enemy: Fighter = _find(battle, 1, "Sakura")
	naruto.add_enable("Kage Bunshin", 3, ["Rasengan"] as Array[String])
	_fill(battle, 0, _plenty())
	view.refresh_all()
	_use(view, naruto, "Rasengan", enemy)
	_end(view)
	player.release()
	assert_eq(_chips(view, enemy), ["Rasengan 1"] as Array[String])
	assert_false(enemy.is_stunned())
	player.release()
	assert_false(enemy.is_stunned())
	assert_eq(_chips(view, enemy), [] as Array[String])
	assert_true(view.can_act())
	var enemy_turn_text: String = "\n".join(view.history)
	assert_true(enemy_turn_text.contains("Rasengan ended"))
	Helpers.unmount(view)


func test_heal_works_on_a_wounded_ally_and_is_locked_when_everyone_is_healthy() -> void:
	var battle: Battle = _roster(["Naruto", "Sasuke", "Sakura"])
	var view: BattleView = Helpers.mount_battle(battle)
	var sakura: Fighter = _find(battle, 0, "Sakura")
	var naruto: Fighter = _find(battle, 0, "Naruto")
	_fill(battle, 0, _plenty())
	view.refresh_all()
	assert_eq(_button(view, sakura, "Heal").lock_reason, "No valid target")
	naruto.hp = 60
	view.refresh_all()
	assert_false(_button(view, sakura, "Heal").button.disabled)
	_use(view, sakura, "Heal")
	assert_eq(view.targets.size(), 1)
	assert_true(view.targets.has(naruto))
	assert_true(view.panels[naruto].highlighted)
	assert_false(view.panels[sakura].highlighted)
	_click_fighter(view, naruto)
	assert_eq(view.queue.actions.size(), 1)
	_end(view)
	assert_eq(naruto.hp, 75)
	Helpers.unmount(view)


func test_invulnerable_enemy_cannot_be_targeted_or_highlighted() -> void:
	var battle: Battle = _roster(["Naruto", "Sasuke", "Sakura"])
	var view: BattleView = Helpers.mount_battle(battle)
	var sasuke: Fighter = _find(battle, 0, "Sasuke")
	var shielded: Fighter = _find(battle, 1, "Sakura")
	shielded.add_reduction("Kawarimi", 0, 1, false, true)
	_fill(battle, 0, _plenty())
	view.refresh_all()
	_use(view, sasuke, "Fireball")
	assert_false(view.targets.has(shielded))
	assert_false(view.panels[shielded].highlighted)
	_click_fighter(view, shielded)
	assert_eq(view.queue.actions.size(), 0)
	assert_null(view.selected_state)
	Helpers.unmount(view)


func test_targeting_after_a_death_skips_the_dead_and_locks_with_none_left() -> void:
	var battle: Battle = _roster(["Naruto", "Sasuke", "Sakura"])
	var view: BattleView = Helpers.mount_battle(battle)
	var sasuke: Fighter = _find(battle, 0, "Sasuke")
	var first: Fighter = battle.teams[1].fighters[0]
	first.hp = 0
	_fill(battle, 0, _plenty())
	view.refresh_all()
	_use(view, sasuke, "Fireball")
	assert_false(view.targets.has(first))
	assert_eq(view.targets.size(), 2)
	_click_fighter(view, first)
	assert_eq(view.queue.actions.size(), 0)
	for enemy: Fighter in battle.teams[1].fighters:
		enemy.hp = 0
	view.refresh_all()
	assert_eq(_button(view, sasuke, "Fireball").lock_reason, "No valid target")
	Helpers.unmount(view)


func test_a_dead_player_fighter_stays_locked_and_the_turn_can_still_end() -> void:
	var battle: Battle = _roster(["Naruto", "Sasuke", "Sakura"])
	var view: BattleView = Helpers.mount_battle(battle)
	var sasuke: Fighter = _find(battle, 0, "Sasuke")
	sasuke.hp = 0
	_fill(battle, 0, _plenty())
	view.refresh_all()
	for button: AbilityButton in view.panels[sasuke].ability_buttons:
		assert_eq(button.lock_reason, "Down")
	var turn_before: int = battle.turn
	_end(view)
	assert_true(battle.turn > turn_before)
	assert_true(view.can_act())
	Helpers.unmount(view)


func test_a_whole_team_stunned_can_still_end_the_turn() -> void:
	var battle: Battle = _roster(["Naruto", "Sasuke", "Sakura"])
	var view: BattleView = Helpers.mount_battle(battle)
	for fighter: Fighter in battle.teams[0].fighters:
		fighter.add_stun("Test", 1)
	view.refresh_all()
	var turn_before: int = battle.turn
	_end(view)
	assert_true(battle.turn > turn_before)
	assert_true(view.can_act())
	Helpers.unmount(view)


func test_timer_at_zero_ends_the_turn_even_with_a_stunned_team_and_no_queue() -> void:
	var battle: Battle = _roster(["Naruto", "Sasuke", "Sakura"])
	var view: BattleView = Helpers.mount_battle(battle)
	var turn_before: int = battle.turn
	view.advance_timer(view.turn_length + 1.0)
	assert_true(battle.turn > turn_before)
	assert_eq(view.timer_label.text, "60")
	assert_true(view.can_act())
	Helpers.unmount(view)


func test_ai_plan_that_the_rules_reject_does_not_freeze_the_game() -> void:
	var battle: Battle = _roster(["Naruto", "Sasuke", "Sakura"])
	var view: BattleView = Helpers.mount_battle(battle)
	view.ai = BrokenAi.new()
	_end(view)
	assert_eq(battle.current_team, 0)
	assert_true(view.can_act())
	Helpers.unmount(view)


func test_escape_closes_an_open_modal_and_keeps_the_turn() -> void:
	var battle: Battle = _roster(["Naruto", "Sasuke", "Sakura"])
	var view: BattleView = Helpers.mount_battle(battle)
	var escape: InputEventKey = InputEventKey.new()
	escape.keycode = KEY_ESCAPE
	escape.pressed = true
	for opener: Callable in [view.open_exchange, view.open_surrender, view.open_history]:
		opener.call()
		assert_true(view.modal != null)
		view._unhandled_key_input(escape)
		assert_null(view.modal)
		assert_false(battle.result.ended)
		assert_true(view.can_act())
	view._unhandled_key_input(escape)
	assert_true(view.can_act())
	Helpers.unmount(view)


func test_battle_log_accepts_the_mouse_wheel() -> void:
	var view: BattleView = Helpers.mount_battle(_roster(["Naruto", "Sasuke", "Sakura"]))
	assert_true(view.log_text.mouse_filter != Control.MOUSE_FILTER_IGNORE)
	assert_true(view.log_text.scroll_active)
	Helpers.unmount(view)


func test_speed_button_toggles_normal_and_fast() -> void:
	var view: BattleView = Helpers.mount_battle(_roster(["Naruto", "Sasuke", "Sakura"]))
	AnimConfig.speed = AnimConfig.NORMAL_SPEED
	assert_eq(view.speed_button.text, "Speed: Normal")
	view.speed_button.pressed.emit()
	assert_eq(view.speed_button.text, "Speed: Fast")
	assert_true(AnimConfig.is_fast_speed())
	assert_true(AnimConfig.speed > AnimConfig.NORMAL_SPEED)
	view.speed_button.pressed.emit()
	assert_eq(view.speed_button.text, "Speed: Normal")
	assert_false(AnimConfig.is_fast_speed())
	Helpers.unmount(view)


func test_fast_speed_shortens_waits_and_normal_keeps_the_react_timing() -> void:
	var was_fast: bool = AnimConfig.fast
	AnimConfig.fast = false
	AnimConfig.speed = AnimConfig.NORMAL_SPEED
	assert_eq(AnimConfig.seconds(1500.0), 1.5)
	AnimConfig.speed = AnimConfig.FAST_SPEED
	assert_eq(AnimConfig.seconds(1500.0), 0.5)
	AnimConfig.speed = AnimConfig.NORMAL_SPEED
	AnimConfig.fast = was_fast


func _many_effects(fighter: Fighter) -> void:
	for index: int in 12:
		fighter.add_buff("Buff %d" % index, 5, 3, ["Naruto Kick"] as Array[String], "buff description number %d is a fairly long text" % index)


func test_fighter_card_height_is_capped_with_many_effects() -> void:
	var battle: Battle = _roster(["Naruto", "Sasuke", "Sakura"])
	var view: BattleView = Helpers.mount_battle(battle)
	for team_idx: int in 2:
		var fighter: Fighter = battle.teams[team_idx].fighters[0]
		var panel: FighterPanel = view.panels[fighter]
		var before: float = panel.get_combined_minimum_size().y
		_many_effects(fighter)
		view.refresh_all()
		assert_eq(panel.get_combined_minimum_size().y, before)
		assert_eq(panel.effect_groups().size(), 12)
	Helpers.unmount(view)


func test_second_battle_after_game_over_starts_clean() -> void:
	var host: Control = Control.new()
	Helpers.tree_root().add_child(host)
	var router: Node = preload("res://ui/scene_router.gd").new()
	router.attach(host)
	router.seed_override = 5
	var team: Array[CharacterData] = Helpers.team_of(["Naruto", "Sasuke", "Sakura"])
	router.go_to_battle(team)
	var first: BattleView = router.current as BattleView
	_fill(first.battle, 0, _plenty())
	first.refresh_all()
	_use(first, _find(first.battle, 0, "Sasuke"), "Fireball", first.battle.teams[1].fighters[0])
	_end(first)
	assert_true(first.history.size() > 3)
	first.battle.surrender(0)
	first._finish_if_over()
	assert_true(first.game_over_panel.visible)
	first.exit_requested.emit()
	assert_true(router.current is CharacterSelect)
	router.go_to_battle(team)
	var second: BattleView = router.current as BattleView
	assert_true(second != first)
	assert_false(second.battle.result.ended)
	assert_eq(second.battle.turn, 1)
	assert_eq(second.history, ["--- Turn 1 ---"])
	assert_true(second.can_act())
	for fighter: Fighter in second.battle.teams[0].fighters:
		assert_eq(fighter.hp, 100)
	router.free()
	Helpers.unmount(host)


func test_cooldown_label_shows_the_ability_cooldown_right_after_the_cast() -> void:
	var battle: Battle = _roster(["Naruto", "Sasuke", "Sakura"])
	var view: BattleView = Helpers.mount_battle(battle)
	var player: TurnPlayer = ManualPlayer.new()
	view.set_turn_player(player)
	var sasuke: Fighter = _find(battle, 0, "Sasuke")
	_fill(battle, 0, _plenty())
	view.refresh_all()
	_use(view, sasuke, "Sharingan")
	_end(view)
	var button: AbilityButton = _button(view, sasuke, "Sharingan")
	assert_eq(button.cooldown_label.text, "4")
	assert_eq(button.lock_reason, "Cooldown: 4")
	player.release()
	assert_eq(button.cooldown_label.text, "4")
	player.release()
	assert_true(view.can_act())
	assert_eq(button.cooldown_label.text, "4")
	assert_eq(_button(view, sasuke, "Sharingan").lock_reason, "Cooldown: 4")
	Helpers.unmount(view)


func test_a_defeated_fighter_shows_no_effect_chips() -> void:
	var battle: Battle = _roster(["Naruto", "Sasuke", "Sakura"])
	var view: BattleView = Helpers.mount_battle(battle)
	var sasuke: Fighter = _find(battle, 0, "Sasuke")
	sasuke.add_buff("Sharingan", 10, 3, ["Chidori"] as Array[String], "buff")
	view.refresh_all()
	assert_eq(_chips(view, sasuke), ["Sharingan 3"] as Array[String])
	sasuke.hp = 0
	view.refresh_all()
	assert_eq(_chips(view, sasuke), [] as Array[String])
	Helpers.unmount(view)
