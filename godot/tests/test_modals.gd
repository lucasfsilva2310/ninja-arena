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


func _click_fighter(view: BattleView, fighter: Fighter) -> void:
	var event: InputEventMouseButton = InputEventMouseButton.new()
	event.button_index = MOUSE_BUTTON_LEFT
	event.pressed = true
	(view.panels[fighter] as FighterPanel).gui_input.emit(event)


func _random_battle(pool_list: Array) -> Battle:
	var strike: AbilityData = Build.hit(20, [Build.R])
	strike.display_name = "Strike"
	var battle: Battle = Build.battle(Build.team([strike]), Build.team([strike]), 5)
	battle.teams[0].pool.chakras.clear()
	Build.give(battle.teams[0].pool, pool_list)
	return battle


func _queue_strike(view: BattleView, battle: Battle, index: int = 0) -> void:
	var source: Fighter = battle.teams[0].fighters[index]
	_press(_ability_button(view, source, "Strike").button)
	_click_fighter(view, battle.teams[1].fighters[0])


func _hold(view: BattleView) -> void:
	view.set_turn_player(ManualPlayer.new())


func _pool_battle(pool_list: Array) -> Battle:
	var battle: Battle = Helpers.real_battle()
	battle.teams[0].pool.chakras.clear()
	Build.give(battle.teams[0].pool, pool_list)
	return battle


func test_exchange_button_opens_the_modal_and_cancel_closes_it_without_changes() -> void:
	var battle: Battle = _pool_battle([Build.N, Build.N, Build.N, Build.N, Build.N])
	var view: BattleView = Helpers.mount_battle(battle)
	_press(view.exchange_button)
	assert_true(view.modal is ExchangeModal)
	(view.modal as ExchangeModal).cancel_button.pressed.emit()
	assert_null(view.modal)
	assert_eq(battle.teams[0].pool.total(), 5)
	Helpers.unmount(view)


func test_exchange_with_four_chakras_keeps_confirm_disabled() -> void:
	var battle: Battle = _pool_battle([Build.N, Build.N, Build.N, Build.N, Build.N])
	var view: BattleView = Helpers.mount_battle(battle)
	_press(view.exchange_button)
	var modal: ExchangeModal = view.modal as ExchangeModal
	for i: int in 4:
		modal.picker.add_chakra(Build.N)
	modal.pick_target(Build.B)
	assert_true(modal.confirm_button.disabled)
	modal.confirm()
	assert_eq(battle.teams[0].pool.total(), 5)
	Helpers.unmount(view)


func test_exchange_with_five_and_no_target_keeps_confirm_disabled() -> void:
	var battle: Battle = _pool_battle([Build.N, Build.N, Build.N, Build.N, Build.N])
	var view: BattleView = Helpers.mount_battle(battle)
	_press(view.exchange_button)
	var modal: ExchangeModal = view.modal as ExchangeModal
	for i: int in 5:
		modal.picker.add_chakra(Build.N)
	assert_true(modal.confirm_button.disabled)
	modal.pick_target(Build.B)
	assert_false(modal.confirm_button.disabled)
	Helpers.unmount(view)


func test_exchange_confirm_removes_five_and_adds_one_and_updates_the_chakra_row() -> void:
	var battle: Battle = _pool_battle([Build.N, Build.N, Build.N, Build.T, Build.T, Build.G])
	var view: BattleView = Helpers.mount_battle(battle)
	_press(view.exchange_button)
	var modal: ExchangeModal = view.modal as ExchangeModal
	for type: ChakraType.Type in [Build.N, Build.N, Build.N, Build.T, Build.T]:
		modal.picker.add_chakra(type)
	modal.pick_target(Build.B)
	_press(modal.confirm_button)
	assert_null(view.modal)
	assert_eq(battle.teams[0].pool.total(), 2)
	assert_eq(battle.teams[0].pool.count(Build.B), 1)
	assert_eq(view.chakra_labels[Build.B].text, "x1")
	assert_eq(view.chakra_total.text, "Total: 2")
	Helpers.unmount(view)


func test_exchange_picker_shows_counts_per_type_and_caps_at_what_the_pool_holds() -> void:
	var battle: Battle = _pool_battle([Build.N, Build.N, Build.T])
	var view: BattleView = Helpers.mount_battle(battle)
	_press(view.exchange_button)
	var picker: ChakraPicker = (view.modal as ExchangeModal).picker
	assert_eq(picker.count_labels[Build.N].text, "2")
	assert_eq(picker.count_labels[Build.T].text, "1")
	assert_eq(picker.count_labels[Build.G].text, "0")
	assert_true(picker.add_chakra(Build.N))
	assert_eq(picker.count_labels[Build.N].text, "1")
	assert_false(picker.add_chakra(Build.G))
	assert_true(picker.remove_chakra(Build.N))
	assert_false(picker.remove_chakra(Build.N))
	assert_eq(picker.count_labels[Build.N].text, "2")
	Helpers.unmount(view)


func test_exchange_cannot_spend_chakra_the_queue_reserved() -> void:
	var strike: AbilityData = Build.hit(20, [Build.N])
	strike.display_name = "Strike"
	var battle: Battle = Build.battle(Build.team([strike]), Build.team([strike]), 5)
	battle.teams[0].pool.chakras.clear()
	Build.give(battle.teams[0].pool, [Build.N, Build.T, Build.T, Build.T, Build.T, Build.T])
	var view: BattleView = Helpers.mount_battle(battle)
	_press(_ability_button(view, battle.teams[0].fighters[0], "Strike").button)
	_click_fighter(view, battle.teams[1].fighters[0])
	_press(view.exchange_button)
	var modal: ExchangeModal = view.modal as ExchangeModal
	for type: ChakraType.Type in [Build.N, Build.T, Build.T, Build.T, Build.T]:
		modal.picker.add_chakra(type)
	modal.pick_target(Build.B)
	assert_true(modal.confirm_button.disabled)
	assert_ne(modal.message_label.text, "")
	Helpers.unmount(view)


func test_exchange_is_unavailable_while_events_play() -> void:
	var battle: Battle = _pool_battle([Build.N, Build.N, Build.N, Build.N, Build.N])
	var view: BattleView = Helpers.mount_battle(battle)
	var player: TurnPlayer = ManualPlayer.new()
	view.set_turn_player(player)
	view.end_turn()
	assert_true(view.resolving)
	assert_true(view.exchange_button.disabled)
	assert_true(view.surrender_button.disabled)
	view.open_exchange()
	view.open_surrender()
	assert_null(view.modal)
	Helpers.unmount(view)


func test_payment_modal_opens_when_the_pool_has_a_choice() -> void:
	var battle: Battle = _random_battle([Build.N, Build.T, Build.G])
	var view: BattleView = Helpers.mount_battle(battle)
	_queue_strike(view, battle)
	view.end_turn()
	assert_true(view.modal is PaymentModal)
	assert_eq(battle.turn, 1)
	assert_eq(view.queue.actions.size(), 1)
	Helpers.unmount(view)


func test_payment_with_the_wrong_count_is_blocked() -> void:
	var battle: Battle = _random_battle([Build.N, Build.T, Build.G])
	var view: BattleView = Helpers.mount_battle(battle)
	_queue_strike(view, battle)
	view.end_turn()
	var modal: PaymentModal = view.modal as PaymentModal
	assert_true(modal.confirm_button.disabled)
	modal.confirm()
	assert_true(view.modal == modal)
	assert_eq(battle.turn, 1)
	assert_false(modal.picker.add_chakra(Build.N) and modal.picker.add_chakra(Build.T))
	assert_eq(modal.picker.selected.size(), 1)
	Helpers.unmount(view)


func test_payment_with_the_right_count_pays_that_chakra_and_ends_the_turn() -> void:
	var battle: Battle = _random_battle([Build.N, Build.T, Build.G])
	var view: BattleView = Helpers.mount_battle(battle)
	_hold(view)
	_queue_strike(view, battle)
	view.end_turn()
	var modal: PaymentModal = view.modal as PaymentModal
	modal.picker.add_chakra(Build.G)
	assert_false(modal.confirm_button.disabled)
	_press(modal.confirm_button)
	assert_null(view.modal)
	assert_eq(battle.teams[0].pool.count(Build.G), 0)
	assert_eq(battle.teams[0].pool.count(Build.N), 1)
	assert_eq(battle.teams[0].pool.count(Build.T), 1)
	assert_eq(battle.teams[1].fighters[0].hp, 80)
	assert_true(view.resolving)
	Helpers.unmount(view)


func test_payment_cancel_keeps_the_queue_and_the_turn() -> void:
	var battle: Battle = _random_battle([Build.N, Build.T, Build.G])
	var view: BattleView = Helpers.mount_battle(battle)
	_queue_strike(view, battle)
	view.end_turn()
	(view.modal as PaymentModal).cancel_button.pressed.emit()
	assert_null(view.modal)
	assert_eq(view.queue.actions.size(), 1)
	assert_eq(battle.turn, 1)
	assert_eq(battle.teams[0].pool.total(), 3)
	Helpers.unmount(view)


func test_payment_modal_is_skipped_when_the_chakra_is_forced() -> void:
	var battle: Battle = _random_battle([Build.N])
	var view: BattleView = Helpers.mount_battle(battle)
	_hold(view)
	_queue_strike(view, battle)
	view.end_turn()
	assert_null(view.modal)
	assert_eq(battle.teams[1].fighters[0].hp, 80)
	assert_eq(battle.teams[0].pool.count(Build.N), 0)
	Helpers.unmount(view)


func test_payment_modal_is_skipped_when_all_leftover_chakra_is_one_type() -> void:
	var battle: Battle = _random_battle([Build.N, Build.N, Build.N])
	var view: BattleView = Helpers.mount_battle(battle)
	_hold(view)
	_queue_strike(view, battle)
	view.end_turn()
	assert_null(view.modal)
	assert_eq(battle.teams[0].pool.count(Build.N), 2)
	Helpers.unmount(view)


func test_two_random_slots_need_two_picks() -> void:
	var battle: Battle = _random_battle([Build.N, Build.T, Build.G, Build.B])
	var view: BattleView = Helpers.mount_battle(battle)
	_hold(view)
	_queue_strike(view, battle, 0)
	_queue_strike(view, battle, 1)
	view.end_turn()
	var modal: PaymentModal = view.modal as PaymentModal
	assert_eq(modal.slots, 2)
	modal.picker.add_chakra(Build.N)
	assert_true(modal.confirm_button.disabled)
	modal.picker.add_chakra(Build.B)
	_press(modal.confirm_button)
	assert_eq(battle.teams[0].pool.count(Build.N), 0)
	assert_eq(battle.teams[0].pool.count(Build.B), 0)
	assert_eq(battle.teams[0].pool.total(), 2)
	Helpers.unmount(view)


func test_timer_expiry_with_the_payment_modal_open_closes_it_and_auto_pays_keeping_the_queue() -> void:
	var battle: Battle = _random_battle([Build.N, Build.T, Build.G])
	var view: BattleView = Helpers.mount_battle(battle)
	_hold(view)
	view.set_turn_length(10.0)
	_queue_strike(view, battle, 0)
	_queue_strike(view, battle, 1)
	view.end_turn()
	assert_true(view.modal is PaymentModal)
	view.advance_timer(10.5)
	assert_null(view.modal)
	assert_eq(battle.teams[1].fighters[0].hp, 60)
	assert_eq(battle.teams[0].pool.count(Build.N), 0)
	assert_eq(battle.teams[0].pool.count(Build.T), 0)
	assert_eq(battle.teams[0].pool.count(Build.G), 1)
	Helpers.unmount(view)


func test_timer_expiry_with_a_random_action_and_no_modal_still_auto_pays() -> void:
	var battle: Battle = _random_battle([Build.N, Build.T, Build.G])
	var view: BattleView = Helpers.mount_battle(battle)
	_hold(view)
	view.set_turn_length(5.0)
	_queue_strike(view, battle)
	view.advance_timer(5.5)
	assert_eq(battle.teams[1].fighters[0].hp, 80)
	assert_eq(battle.teams[0].pool.total(), 2)
	Helpers.unmount(view)


func test_timer_expiry_closes_the_exchange_modal_and_ends_the_turn() -> void:
	var battle: Battle = _pool_battle([Build.N, Build.N, Build.N, Build.N, Build.N])
	var view: BattleView = Helpers.mount_battle(battle)
	view.set_turn_length(3.0)
	_press(view.exchange_button)
	assert_true(view.modal is ExchangeModal)
	view.advance_timer(3.5)
	assert_null(view.modal)
	assert_eq(battle.turn, 3)
	Helpers.unmount(view)


func test_surrender_cancel_keeps_playing() -> void:
	var battle: Battle = Helpers.real_battle()
	var view: BattleView = Helpers.mount_battle(battle)
	_press(view.surrender_button)
	assert_true(view.modal is SurrenderModal)
	(view.modal as SurrenderModal).no_button.pressed.emit()
	assert_null(view.modal)
	assert_false(battle.result.ended)
	assert_true(view.can_act())
	Helpers.unmount(view)


func test_surrender_confirm_ends_the_game_as_a_defeat() -> void:
	var battle: Battle = Helpers.real_battle()
	var view: BattleView = Helpers.mount_battle(battle)
	var finished: Array[BattleResult] = []
	view.game_over.connect(func(result: BattleResult) -> void: finished.append(result))
	_press(view.surrender_button)
	_press((view.modal as SurrenderModal).yes_button)
	assert_null(view.modal)
	assert_true(battle.result.ended)
	assert_eq(battle.result.winner, 1)
	assert_true(view.game_over_panel.visible)
	assert_eq(view.result_label.text, "Defeat")
	assert_eq(finished.size(), 1)
	assert_false(view.can_act())
	assert_true(view.surrender_button.disabled)
	Helpers.unmount(view)


func test_surrender_is_not_allowed_while_events_play() -> void:
	var battle: Battle = Helpers.real_battle()
	var view: BattleView = Helpers.mount_battle(battle)
	view.set_turn_player(ManualPlayer.new())
	view.end_turn()
	_press(view.surrender_button)
	assert_null(view.modal)
	assert_false(battle.result.ended)
	Helpers.unmount(view)


func test_history_lists_events_in_order_and_keeps_them_across_turns() -> void:
	var battle: Battle = _random_battle([Build.N])
	var view: BattleView = Helpers.mount_battle(battle)
	_queue_strike(view, battle)
	view.end_turn()
	var after_first: int = view.history.size()
	assert_true(after_first > 0)
	view.end_turn()
	assert_true(view.history.size() > after_first)
	_press(view.history_button)
	var modal: HistoryModal = view.modal as HistoryModal
	assert_eq(modal.entries.get_child_count(), view.history.size())
	var texts: Array[String] = []
	for child: Node in modal.entries.get_children():
		texts.append((child as Label).text)
	assert_eq(texts, view.history)
	var uses: int = texts.find("F0 uses Strike on F0.")
	var damage: int = texts.find("F0 takes 20 damage from Strike.")
	assert_true(uses != -1 and damage > uses)
	assert_true(texts.find("--- Turn 2 ---") > damage)
	assert_true(texts.find("--- Turn 3 ---") > texts.find("--- Turn 2 ---"))
	Helpers.unmount(view)


func test_history_with_no_events_says_so_and_closes() -> void:
	var battle: Battle = Helpers.real_battle()
	var view: BattleView = Helpers.mount_battle(battle)
	_press(view.history_button)
	var modal: HistoryModal = view.modal as HistoryModal
	assert_eq(modal.entries.get_child_count(), 1)
	assert_eq((modal.entries.get_child(0) as Label).text, "No battle history yet.")
	_press(modal.close_button)
	assert_null(view.modal)
	Helpers.unmount(view)


func test_history_opens_while_events_play_and_is_scrollable() -> void:
	var battle: Battle = Helpers.real_battle()
	var view: BattleView = Helpers.mount_battle(battle)
	for i: int in 40:
		view.history.append("line %d" % i)
	view.set_turn_player(ManualPlayer.new())
	view.end_turn()
	_press(view.history_button)
	assert_true(view.modal is HistoryModal)
	assert_true((view.modal as HistoryModal).scroll is ScrollContainer)
	Helpers.unmount(view)


func test_only_one_modal_at_a_time() -> void:
	var battle: Battle = Helpers.real_battle()
	var view: BattleView = Helpers.mount_battle(battle)
	view.open_surrender()
	var first: ModalBase = view.modal
	view.open_exchange()
	view.open_history()
	assert_true(view.modal == first)
	Helpers.unmount(view)


func test_rebinding_the_view_closes_an_open_modal() -> void:
	var view: BattleView = Helpers.mount_battle(Helpers.real_battle())
	view.open_surrender()
	view.bind(Helpers.real_battle(4))
	assert_null(view.modal)
	Helpers.unmount(view)
