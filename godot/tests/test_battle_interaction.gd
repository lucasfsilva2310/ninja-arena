extends "res://tools/test_case.gd"

const Helpers: GDScript = preload("res://tests/ui_helpers.gd")
const Build: GDScript = preload("res://tests/builders.gd")
const ManualPlayer: GDScript = preload("res://tests/manual_turn_player.gd")


func _press(button: Button) -> void:
	if not button.disabled:
		button.pressed.emit()


func _ability_button(view: BattleView, fighter: Fighter, ability_name: String) -> AbilityButton:
	for button: AbilityButton in view.panels[fighter].ability_buttons:
		if button.state.data.display_name == ability_name:
			return button
	return null


func _click_fighter(view: BattleView, fighter: Fighter, button_index: int = MOUSE_BUTTON_LEFT) -> void:
	var event: InputEventMouseButton = InputEventMouseButton.new()
	event.button_index = button_index
	event.pressed = true
	(view.panels[fighter] as FighterPanel).gui_input.emit(event)


func _hit_battle(seed_value: int = 5) -> Battle:
	var strike: AbilityData = Build.hit(20)
	strike.display_name = "Strike"
	var battle: Battle = Build.battle(Build.team([strike]), Build.team([strike]), seed_value)
	return battle


func _queue_strike(view: BattleView, source: Fighter, target: Fighter) -> void:
	_press(_ability_button(view, source, "Strike").button)
	_click_fighter(view, target)


func test_ability_click_selects_and_highlights_valid_targets() -> void:
	var battle: Battle = Helpers.real_battle()
	battle.teams[0].pool.chakras.clear()
	Build.give(battle.teams[0].pool, [Build.N, Build.N])
	var view: BattleView = Helpers.mount_battle(battle)
	var sasuke: Fighter = battle.teams[0].fighters[1]
	var fireball: AbilityButton = _ability_button(view, sasuke, "Fireball")
	_press(fireball.button)
	assert_eq(view.selected_state, fireball.state)
	assert_eq(view.targets.size(), 3)
	for enemy: Fighter in battle.teams[1].fighters:
		assert_true(view.panels[enemy].highlighted)
	for ally: Fighter in battle.teams[0].fighters:
		assert_false(view.panels[ally].highlighted)
	assert_true(fireball.selected)
	assert_eq(view.desc_name.text, "Fireball")
	Helpers.unmount(view)


func test_ability_click_again_deselects() -> void:
	var battle: Battle = Helpers.real_battle()
	battle.teams[0].pool.chakras.clear()
	Build.give(battle.teams[0].pool, [Build.N])
	var view: BattleView = Helpers.mount_battle(battle)
	var sasuke: Fighter = battle.teams[0].fighters[1]
	var fireball: AbilityButton = _ability_button(view, sasuke, "Fireball")
	_press(fireball.button)
	_press(fireball.button)
	assert_null(view.selected_state)
	assert_true(view.targets.is_empty())
	assert_false(fireball.selected)
	for enemy: Fighter in battle.teams[1].fighters:
		assert_false(view.panels[enemy].highlighted)
	Helpers.unmount(view)


func test_selecting_another_ability_moves_the_selection() -> void:
	var battle: Battle = _hit_battle()
	var view: BattleView = Helpers.mount_battle(battle)
	var first: Fighter = battle.teams[0].fighters[0]
	var second: Fighter = battle.teams[0].fighters[1]
	_press(_ability_button(view, first, "Strike").button)
	_press(_ability_button(view, second, "Strike").button)
	assert_eq(view.selected_fighter, second)
	assert_false(_ability_button(view, first, "Strike").selected)
	assert_true(_ability_button(view, second, "Strike").selected)
	Helpers.unmount(view)


func test_target_click_queues_the_action_and_clears_the_selection() -> void:
	var battle: Battle = _hit_battle()
	var view: BattleView = Helpers.mount_battle(battle)
	var source: Fighter = battle.teams[0].fighters[0]
	var target: Fighter = battle.teams[1].fighters[2]
	_queue_strike(view, source, target)
	assert_eq(view.queue.actions.size(), 1)
	assert_eq(view.queue.actions[0].source, source)
	assert_eq(view.queue.actions[0].target, target)
	assert_null(view.selected_state)
	assert_eq(view.queue_list.get_child_count(), 1)
	assert_eq(target.hp, 100)
	Helpers.unmount(view)


func test_invalid_target_click_clears_the_selection() -> void:
	var battle: Battle = _hit_battle()
	var view: BattleView = Helpers.mount_battle(battle)
	var source: Fighter = battle.teams[0].fighters[0]
	_press(_ability_button(view, source, "Strike").button)
	_click_fighter(view, battle.teams[0].fighters[1])
	assert_null(view.selected_state)
	assert_eq(view.queue.actions.size(), 0)
	Helpers.unmount(view)


func test_target_click_without_selection_does_nothing() -> void:
	var battle: Battle = _hit_battle()
	var view: BattleView = Helpers.mount_battle(battle)
	_click_fighter(view, battle.teams[1].fighters[0])
	assert_eq(view.queue.actions.size(), 0)
	Helpers.unmount(view)


func test_right_click_on_a_panel_is_ignored() -> void:
	var battle: Battle = _hit_battle()
	var view: BattleView = Helpers.mount_battle(battle)
	var source: Fighter = battle.teams[0].fighters[0]
	_press(_ability_button(view, source, "Strike").button)
	_click_fighter(view, battle.teams[1].fighters[0], MOUSE_BUTTON_RIGHT)
	assert_eq(view.queue.actions.size(), 0)
	assert_true(view.selected_state != null)
	Helpers.unmount(view)


func test_queue_panel_lists_two_actions_and_remove_restores_them() -> void:
	var battle: Battle = _hit_battle()
	var view: BattleView = Helpers.mount_battle(battle)
	var fighters: Array[Fighter] = battle.teams[0].fighters
	_queue_strike(view, fighters[0], battle.teams[1].fighters[0])
	_queue_strike(view, fighters[1], battle.teams[1].fighters[1])
	assert_eq(view.queue_list.get_child_count(), 2)
	assert_eq(view.queue_remove_buttons.size(), 2)
	view.queue_remove_buttons[0].pressed.emit()
	assert_eq(view.queue.actions.size(), 1)
	assert_eq(view.queue.actions[0].source, fighters[1])
	assert_eq(view.queue_list.get_child_count(), 1)
	assert_false(_ability_button(view, fighters[0], "Strike").is_locked())
	Helpers.unmount(view)


func test_fighter_with_a_queued_action_cannot_queue_a_second_one() -> void:
	var battle: Battle = _hit_battle()
	var view: BattleView = Helpers.mount_battle(battle)
	var source: Fighter = battle.teams[0].fighters[0]
	_queue_strike(view, source, battle.teams[1].fighters[0])
	assert_eq(_ability_button(view, source, "Strike").lock_reason, "Action queued")
	assert_true(_ability_button(view, source, "Strike").button.disabled)
	view.select_ability(source, source.abilities[0])
	assert_null(view.selected_state)
	var second: Action = Action.new(source, source.abilities[0], battle.teams[1].fighters[1])
	assert_eq(view.queue.try_add(second), "Action already queued")
	assert_eq(view.queue.actions.size(), 1)
	Helpers.unmount(view)


func test_queue_that_costs_more_than_the_pool_locks_the_next_ability() -> void:
	var cheap: AbilityData = Build.hit(10, [Build.N])
	cheap.display_name = "Cheap"
	var battle: Battle = Build.battle(Build.team([cheap]), Build.team([cheap]), 2)
	battle.teams[0].pool.chakras.clear()
	Build.give(battle.teams[0].pool, [Build.N])
	var view: BattleView = Helpers.mount_battle(battle)
	var fighters: Array[Fighter] = battle.teams[0].fighters
	_press(_ability_button(view, fighters[0], "Cheap").button)
	_click_fighter(view, battle.teams[1].fighters[0])
	assert_eq(view.queue.actions.size(), 1)
	var other: AbilityButton = _ability_button(view, fighters[1], "Cheap")
	assert_eq(other.lock_reason, "Not enough chakra")
	assert_true(other.button.disabled)
	var rejected: Action = Action.new(fighters[1], fighters[1].abilities[0], battle.teams[1].fighters[0])
	assert_eq(view.queue.try_add(rejected), "Not enough chakra")
	view.remove_action(0)
	assert_false(other.is_locked())
	Helpers.unmount(view)


func test_chakra_display_shows_reserved_chakra() -> void:
	var cost: AbilityData = Build.hit(10, [Build.N, Build.R])
	cost.display_name = "Costly"
	var battle: Battle = Build.battle(Build.team([cost]), Build.team([cost]), 2)
	battle.teams[0].pool.chakras.clear()
	Build.give(battle.teams[0].pool, [Build.N, Build.N, Build.T])
	var view: BattleView = Helpers.mount_battle(battle)
	assert_eq(view.chakra_labels[ChakraType.Type.NINJUTSU].text, "x2")
	assert_eq(view.chakra_total.text, "Total: 3")
	_press(_ability_button(view, battle.teams[0].fighters[0], "Costly").button)
	_click_fighter(view, battle.teams[1].fighters[0])
	assert_eq(view.chakra_labels[ChakraType.Type.NINJUTSU].text, "x2 (-1)")
	assert_eq(view.chakra_labels[ChakraType.Type.TAIJUTSU].text, "x1")
	assert_eq(view.chakra_total.text, "Total: 3 (reserved 2)")
	view.remove_action(0)
	assert_eq(view.chakra_total.text, "Total: 3")
	Helpers.unmount(view)


func test_heal_is_locked_when_everyone_is_at_full_hp() -> void:
	var heal: AbilityData = Build.heal(10)
	heal.display_name = "Mend"
	var battle: Battle = Build.battle(Build.team([heal]), Build.team([heal]), 3)
	var view: BattleView = Helpers.mount_battle(battle)
	var healer: Fighter = battle.teams[0].fighters[0]
	var button: AbilityButton = _ability_button(view, healer, "Mend")
	assert_eq(button.lock_reason, "No valid target")
	assert_true(button.button.disabled)
	battle.teams[0].fighters[1].hp = 50
	view.refresh_all()
	assert_false(button.is_locked())
	_press(button.button)
	assert_eq(view.targets, [battle.teams[0].fighters[1]] as Array[Fighter])
	Helpers.unmount(view)


func test_heal_on_a_full_hp_ally_is_rejected_by_the_queue() -> void:
	var heal: AbilityData = Build.heal(10)
	var battle: Battle = Build.battle(Build.team([heal]), Build.team([heal]), 3)
	battle.teams[0].fighters[1].hp = 50
	var queue: ActionQueue = ActionQueue.new(battle, 0)
	var healer: Fighter = battle.teams[0].fighters[0]
	assert_eq(queue.try_add(Action.new(healer, healer.abilities[0], battle.teams[0].fighters[2])), "Invalid target")
	assert_eq(queue.try_add(Action.new(healer, healer.abilities[0], battle.teams[0].fighters[1])), "")


func test_end_turn_with_an_empty_queue_runs_the_enemy_turn_and_returns() -> void:
	var battle: Battle = Helpers.real_battle(4)
	var view: BattleView = Helpers.mount_battle(battle)
	var pool: ChakraPool = battle.teams[0].pool
	assert_eq(pool.total(), 1)
	_press(view.end_turn_button)
	assert_eq(battle.turn, 3)
	assert_eq(battle.current_team, 0)
	assert_eq(pool.total(), 4)
	assert_false(view.resolving)
	assert_false(view.end_turn_button.disabled)
	assert_eq(view.turn_label.text, "Turn 3")
	Helpers.unmount(view)


func test_turn_flow_gives_chakra_income_each_turn_to_each_team() -> void:
	var battle: Battle = Helpers.real_battle(4)
	var view: BattleView = Helpers.mount_battle(battle)
	var enemy_before: int = battle.teams[1].pool.total()
	assert_eq(enemy_before, 0)
	_press(view.end_turn_button)
	var enemy_after_first: int = battle.teams[1].pool.total()
	assert_true(enemy_after_first <= 3)
	_press(view.end_turn_button)
	assert_eq(battle.turn, 5)
	assert_eq(battle.teams[0].pool.total(), 7)
	var enemy_spent_or_kept: int = battle.teams[1].pool.total()
	assert_true(enemy_spent_or_kept <= 6)
	Helpers.unmount(view)


func test_events_play_into_the_log_through_the_turn_player() -> void:
	var battle: Battle = _hit_battle()
	var view: BattleView = Helpers.mount_battle(battle)
	_queue_strike(view, battle.teams[0].fighters[0], battle.teams[1].fighters[0])
	_press(view.end_turn_button)
	assert_eq(battle.teams[1].fighters[0].hp, 80)
	var joined: String = "\n".join(view.log_lines)
	assert_true(joined.contains("F0 uses Strike on F0."))
	assert_true(joined.contains("takes 20 damage from Strike."))
	assert_true(joined.contains("--- Turn 2 ---"))
	assert_eq(view.log_text.text, joined)
	assert_eq(view.queue.actions.size(), 0)
	Helpers.unmount(view)


func test_random_slot_is_paid_by_the_first_matching_leftover_chakra() -> void:
	var cost: AbilityData = Build.hit(10, [Build.T, Build.R])
	var battle: Battle = Build.battle(Build.team([cost]), Build.team([cost]), 2)
	var pool: ChakraPool = battle.teams[0].pool
	pool.chakras.clear()
	Build.give(pool, [Build.N, Build.T, Build.G])
	var queue: ActionQueue = ActionQueue.new(battle, 0)
	var source: Fighter = battle.teams[0].fighters[0]
	assert_eq(queue.try_add(Action.new(source, source.abilities[0], battle.teams[1].fighters[0])), "")
	assert_eq(queue.random_payment(), Build.types([Build.N]))
	var plan: TurnPlan = queue.to_plan()
	assert_eq(plan.actions.size(), 1)
	var events: Array[BattleEvent] = battle.submit_turn(0, plan.actions, plan.random_payment)
	assert_ne(events[0].type, BattleEvent.Type.REJECTED)
	assert_eq(pool.chakras.size(), 1)
	assert_true(pool.chakras.has(Build.G))
	assert_false(pool.chakras.has(Build.T))


func test_timer_ends_the_turn_with_the_queue_as_it_is() -> void:
	var battle: Battle = _hit_battle()
	var view: BattleView = Helpers.mount_battle(battle)
	view.set_turn_length(0.5)
	assert_eq(view.timer_label.text, "01")
	var target: Fighter = battle.teams[1].fighters[0]
	_queue_strike(view, battle.teams[0].fighters[0], target)
	view.advance_timer(0.3)
	assert_eq(battle.turn, 1)
	assert_eq(target.hp, 100)
	view.advance_timer(0.3)
	assert_eq(battle.turn, 3)
	assert_eq(target.hp, 80)
	assert_eq(view.timer_label.text, "01")
	assert_eq(view.time_left, 0.5)
	Helpers.unmount(view)


func test_timer_with_an_empty_queue_still_ends_the_turn() -> void:
	var battle: Battle = _hit_battle()
	var view: BattleView = Helpers.mount_battle(battle)
	view.set_turn_length(1.0)
	view.advance_timer(1.5)
	assert_eq(battle.turn, 3)
	Helpers.unmount(view)


func test_timer_label_counts_down() -> void:
	var battle: Battle = _hit_battle()
	var view: BattleView = Helpers.mount_battle(battle)
	assert_eq(view.timer_label.text, "60")
	view.advance_timer(10.0)
	assert_eq(view.timer_label.text, "50")
	view.advance_timer(0.5)
	assert_eq(view.timer_label.text, "50")
	Helpers.unmount(view)


func test_timer_pauses_while_the_turn_resolves_and_resets_after() -> void:
	var battle: Battle = _hit_battle()
	var view: BattleView = Helpers.mount_battle(battle)
	var player: TurnPlayer = ManualPlayer.new()
	view.set_turn_player(player)
	view.set_turn_length(5.0)
	view.advance_timer(2.0)
	_press(view.end_turn_button)
	assert_true(view.resolving)
	var frozen: float = view.time_left
	view.advance_timer(100.0)
	assert_eq(view.time_left, frozen)
	assert_eq(battle.turn, 2)
	player.release()
	player.release()
	assert_false(view.resolving)
	assert_eq(view.time_left, 5.0)
	Helpers.unmount(view)


func test_input_is_locked_while_events_play() -> void:
	var battle: Battle = _hit_battle()
	var view: BattleView = Helpers.mount_battle(battle)
	var player: TurnPlayer = ManualPlayer.new()
	view.set_turn_player(player)
	var source: Fighter = battle.teams[0].fighters[0]
	_press(view.end_turn_button)
	assert_true(view.resolving)
	assert_true(view.end_turn_button.disabled)
	assert_eq(_ability_button(view, source, "Strike").lock_reason, "Turn resolving")
	view.select_ability(source, source.abilities[0])
	assert_null(view.selected_state)
	view.click_target(battle.teams[1].fighters[0])
	assert_eq(view.queue.actions.size(), 0)
	view.end_turn()
	assert_eq(battle.turn, 2)
	player.release()
	assert_true(view.resolving)
	assert_eq(battle.turn, 3)
	view.end_turn()
	assert_eq(battle.turn, 3)
	player.release()
	assert_false(view.resolving)
	assert_eq(battle.turn, 3)
	assert_false(view.end_turn_button.disabled)
	Helpers.unmount(view)


func test_player_wins_when_the_last_enemy_dies_and_the_result_panel_shows() -> void:
	var battle: Battle = _hit_battle()
	for enemy: Fighter in battle.teams[1].fighters:
		enemy.hp = 20
	var view: BattleView = Helpers.mount_battle(battle)
	var seen: Array[BattleResult] = []
	view.game_over.connect(func(result: BattleResult) -> void: seen.append(result))
	for i: int in 3:
		_queue_strike(view, battle.teams[0].fighters[i], battle.teams[1].fighters[i])
	_press(view.end_turn_button)
	assert_true(battle.result.ended)
	assert_eq(battle.result.winner, 0)
	assert_eq(seen.size(), 1)
	assert_true(view.game_over_panel.visible)
	assert_eq(view.result_label.text, "Victory")
	assert_true(view.end_turn_button.disabled)
	var exits: Array[int] = []
	view.exit_requested.connect(func() -> void: exits.append(1))
	view.back_button.pressed.emit()
	assert_eq(exits.size(), 1)
	Helpers.unmount(view)


func test_last_enemy_dies_in_the_middle_of_the_queue() -> void:
	var battle: Battle = _hit_battle()
	var last: Fighter = battle.teams[1].fighters[0]
	battle.teams[1].fighters[1].hp = 0
	battle.teams[1].fighters[2].hp = 0
	last.hp = 20
	var view: BattleView = Helpers.mount_battle(battle)
	_queue_strike(view, battle.teams[0].fighters[0], last)
	_queue_strike(view, battle.teams[0].fighters[1], last)
	assert_eq(view.queue.actions.size(), 2)
	_press(view.end_turn_button)
	assert_eq(last.hp, 0)
	assert_true(battle.result.ended)
	assert_eq(battle.result.winner, 0)
	assert_eq(view.result_label.text, "Victory")
	var joined: String = "\n".join(view.log_lines)
	assert_false(joined.contains("rejected"))
	Helpers.unmount(view)


func test_player_loses_when_the_enemy_team_kills_everyone() -> void:
	var battle: Battle = _hit_battle()
	for ally: Fighter in battle.teams[0].fighters:
		ally.hp = 1
	var view: BattleView = Helpers.mount_battle(battle)
	var guard: int = 0
	while not battle.result.ended and guard < 20:
		_press(view.end_turn_button)
		guard += 1
	assert_true(battle.result.ended)
	assert_eq(battle.result.winner, 1)
	assert_true(view.game_over_panel.visible)
	assert_eq(view.result_label.text, "Defeat")
	Helpers.unmount(view)


func test_draw_result_text() -> void:
	var battle: Battle = _hit_battle()
	var view: BattleView = Helpers.mount_battle(battle)
	var result: BattleResult = BattleResult.new()
	result.ended = true
	result.draw = true
	view.show_game_over(result)
	assert_eq(view.result_label.text, "Draw")
	assert_true(view.game_over_panel.visible)
	Helpers.unmount(view)


func test_dead_enemy_cannot_be_targeted_and_dead_ally_cannot_act() -> void:
	var battle: Battle = _hit_battle()
	var dead_enemy: Fighter = battle.teams[1].fighters[0]
	var dead_ally: Fighter = battle.teams[0].fighters[2]
	dead_enemy.hp = 0
	dead_ally.hp = 0
	var view: BattleView = Helpers.mount_battle(battle)
	var source: Fighter = battle.teams[0].fighters[0]
	assert_eq(_ability_button(view, dead_ally, "Strike").lock_reason, "Down")
	assert_true(_ability_button(view, dead_ally, "Strike").button.disabled)
	_press(_ability_button(view, source, "Strike").button)
	assert_false(view.targets.has(dead_enemy))
	assert_false(view.panels[dead_enemy].highlighted)
	_click_fighter(view, dead_enemy)
	assert_eq(view.queue.actions.size(), 0)
	assert_null(view.selected_state)
	Helpers.unmount(view)


func test_stunned_fighter_cannot_select_an_ability() -> void:
	var battle: Battle = _hit_battle()
	var stunned: Fighter = battle.teams[0].fighters[0]
	stunned.add_stun("Test", 2, "Cannot act.")
	var view: BattleView = Helpers.mount_battle(battle)
	view.refresh_all()
	view.select_ability(stunned, stunned.abilities[0])
	assert_null(view.selected_state)
	assert_eq(_ability_button(view, stunned, "Strike").lock_reason, "Stunned")
	Helpers.unmount(view)


func test_invulnerable_enemy_is_not_highlighted() -> void:
	var battle: Battle = _hit_battle()
	var shielded: Fighter = battle.teams[1].fighters[1]
	shielded.add_reduction("Guard", 0, 2, false, true, "Invulnerable.")
	var view: BattleView = Helpers.mount_battle(battle)
	_press(_ability_button(view, battle.teams[0].fighters[0], "Strike").button)
	assert_false(view.panels[shielded].highlighted)
	assert_true(view.panels[battle.teams[1].fighters[0]].highlighted)
	Helpers.unmount(view)


func test_selection_is_cleared_when_the_turn_is_submitted() -> void:
	var battle: Battle = _hit_battle()
	var view: BattleView = Helpers.mount_battle(battle)
	_press(_ability_button(view, battle.teams[0].fighters[0], "Strike").button)
	_press(view.end_turn_button)
	assert_null(view.selected_state)
	for panel: FighterPanel in view.panels.values():
		assert_false(panel.highlighted)
	Helpers.unmount(view)


func test_full_game_through_the_ui_with_a_scripted_player() -> void:
	var battle: Battle = Helpers.real_battle(21)
	var view: BattleView = Helpers.mount_battle(battle)
	view.ai_rng = Rng.new(77)
	var planner: AiPlayer = AiPlayer.new()
	var plan_rng: Rng = Rng.new(8)
	var guard: int = 0
	var queued: int = 0
	var refused: int = 0
	var payment_modals: int = 0
	while not battle.result.ended and guard < 400:
		guard += 1
		assert_eq(battle.current_team, 0)
		var plan: TurnPlan = planner.plan_turn(battle, 0, plan_rng)
		for action: Action in plan.actions:
			var before: int = view.queue.actions.size()
			var button: AbilityButton = _ability_button(view, action.source, action.ability.data.display_name)
			_press(button.button)
			var target: Fighter = action.target if action.target != null else view.targets[0]
			_click_fighter(view, target)
			if view.queue.actions.size() == before + 1:
				queued += 1
			else:
				refused += 1
		_press(view.end_turn_button)
		if view.modal is PaymentModal:
			payment_modals += 1
			var modal: PaymentModal = view.modal as PaymentModal
			for type: ChakraType.Type in plan.random_payment:
				modal.picker.add_chakra(type)
			_press(modal.confirm_button)
		assert_null(view.modal)
		if not battle.result.ended:
			assert_false(view.resolving)
	assert_true(battle.result.ended)
	assert_true(view.game_over_panel.visible)
	assert_ne(view.result_label.text, "")
	assert_eq(refused, 0)
	assert_true(queued > 0)
	assert_true(payment_modals > 0)
	var joined: String = "\n".join(view.log_lines)
	assert_false(joined.contains("Turn rejected"))
	assert_false(joined.contains("Cannot queue"))
	Helpers.unmount(view)
