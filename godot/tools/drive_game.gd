extends Control

const MAX_PLAYER_TURNS: int = 400
const TIMEOUT_SECONDS: float = 300.0
const DRIVE_SEED: int = 21

var _shots_dir: String = ""
var _started_at: int = 0
var _taken: Dictionary = {}
var _queued: int = 0
var _player_turns: int = 0
var _payments: int = 0
var _payment_cancels: int = 0


func _ready() -> void:
	var args: PackedStringArray = OS.get_cmdline_user_args()
	var index: int = args.find("--shots")
	if index != -1 and index + 1 < args.size():
		_shots_dir = args[index + 1]
	var seed_arg: int = args.find("--seed")
	SceneRouter.seed_override = int(args[seed_arg + 1]) if seed_arg != -1 and seed_arg + 1 < args.size() else DRIVE_SEED
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child((load("res://ui/app.tscn") as PackedScene).instantiate())
	_started_at = Time.get_ticks_msec()
	_run.call_deferred()


func _process(_delta: float) -> void:
	if _started_at != 0 and _elapsed() > TIMEOUT_SECONDS + 20.0:
		printerr("DRIVE FAIL: watchdog timeout, the driver script stopped early")
		get_tree().quit(2)


func _run() -> void:
	await _frames(3)
	var select: CharacterSelect = SceneRouter.current as CharacterSelect
	_check(select != null, "app starts on the select screen")
	for i: int in 3:
		await _click(select.cards[i])
	_check(select.selected.size() == 3, "three cards picked by real clicks")
	await _shot("select-picked")
	await _click(select.start_button)
	await _frames(3)
	var view: BattleView = SceneRouter.current as BattleView
	_check(view != null, "start button opens the battle")
	_check_footer_inside_window(view)
	await _tour_modals(view)
	var planner: AiPlayer = AiPlayer.new()
	var plan_rng: Rng = Rng.new(8)
	while not view.battle.result.ended:
		_check(_elapsed() < TIMEOUT_SECONDS, "game finishes before the timeout")
		_check(_player_turns < MAX_PLAYER_TURNS, "game finishes within %d player turns" % MAX_PLAYER_TURNS)
		_check(view.can_act(), "player can act at the start of each turn")
		_player_turns += 1
		var plan: TurnPlan = planner.plan_turn(view.battle, 0, plan_rng)
		for action: Action in plan.actions:
			var button: AbilityButton = _find_button(view, action)
			_check(button != null and not button.button.disabled, "planned ability button is enabled")
			await _click(button.button)
			if plan.actions.size() >= 2 and not _taken.has("selected"):
				await _shot("ability-selected")
				_taken["selected"] = true
			var target: Fighter = action.target if action.target != null else view.targets[0]
			var before: int = view.queue.actions.size()
			await _click((view.panels[target] as FighterPanel).name_label)
			_check(view.queue.actions.size() == before + 1, "target click queued the action")
			_queued += 1
		if plan.actions.size() >= 2 and not _taken.has("queue"):
			await _shot("queue-two-actions")
			_taken["queue"] = true
		await _click(view.end_turn_button)
		await _frames(2)
		if view.modal != null:
			await _pay_through_modal(view, plan)
		_check(view.modal == null, "no modal left open after the turn")
		_check_fits(view)
		_check(not view.resolving or view.battle.result.ended, "turn resolved and input unlocked")
	await _frames(2)
	_check(view.game_over_panel != null and view.game_over_panel.visible, "game over panel is visible")
	await _shot("game-over")
	var label: String = view.result_label.text
	var final_turn: int = view.battle.turn
	await _click(view.back_button)
	await _frames(3)
	_check(SceneRouter.current is CharacterSelect, "back button returns to the select screen")
	await _surrender_game()
	print("DRIVE OK result=%s player_turns=%d battle_turn=%d queued=%d payment_modals=%d payment_cancels=%d seconds=%.1f" % [label, _player_turns, final_turn, _queued, _payments, _payment_cancels, _elapsed()])
	get_tree().quit(0)


func _check_footer_inside_window(view: BattleView) -> void:
	var bottom: float = get_viewport_rect().size.y
	for button: Button in [view.surrender_button, view.history_button, view.exchange_button, view.end_turn_button]:
		var rect: Rect2 = button.get_global_rect()
		_check(rect.end.y <= bottom and rect.position.y >= 0.0, "%s is inside the window (bottom %.0f of %.0f)" % [button.text, rect.end.y, bottom])


func _check_fits(view: BattleView) -> void:
	var layout: Control = view.get_node("Margin/Layout") as Control
	var needed: float = view.get_node("Margin").get_combined_minimum_size().y
	if needed > get_viewport_rect().size.y:
		var parts: String = "header=%.0f body=%.0f footer=%.0f" % [layout.get_node("Header").get_combined_minimum_size().y, layout.get_node("Body").get_combined_minimum_size().y, layout.get_node("Footer").get_combined_minimum_size().y]
		_check(false, "battle layout needs %.0f px, window has %.0f (%s)" % [needed, get_viewport_rect().size.y, parts])


func _tour_modals(view: BattleView) -> void:
	await _click(view.history_button)
	_check(view.modal is HistoryModal, "history button opens the history modal")
	await _click((view.modal as HistoryModal).close_button)
	_check(view.modal == null, "history close button closes the modal")

	await _click(view.surrender_button)
	_check(view.modal is SurrenderModal, "surrender button opens the confirmation")
	await _click((view.modal as SurrenderModal).no_button)
	_check(view.modal == null and not view.battle.result.ended, "No keeps the battle going")

	await _click(view.exchange_button)
	_check(view.modal is ExchangeModal, "exchange button opens the exchange modal")
	await _click((view.modal as ExchangeModal).cancel_button)
	_check(view.modal == null, "exchange cancel closes the modal")

	var pool: ChakraPool = view.battle.teams[0].pool
	for i: int in 5:
		pool.add(ChakraType.Type.NINJUTSU)
	view.battle.chakra_changed.emit(0)
	var before_total: int = pool.total()
	var before_blood: int = pool.count(ChakraType.Type.BLOODLINE)
	await _click(view.exchange_button)
	var exchange: ExchangeModal = view.modal as ExchangeModal
	_check(exchange != null, "exchange modal opens with chakra in the pool")
	for i: int in 4:
		await _click(exchange.picker.add_buttons[ChakraType.Type.NINJUTSU])
	await _click(exchange.target_buttons[ChakraType.Type.BLOODLINE])
	await _shot("real-exchange-modal")
	_check(exchange.confirm_button.disabled, "four chakras keep Transform disabled")
	await _click(exchange.picker.add_buttons[ChakraType.Type.NINJUTSU])
	_check(not exchange.confirm_button.disabled, "five chakras and a target enable Transform")
	await _click(exchange.confirm_button)
	_check(view.modal == null, "Transform closes the modal")
	_check(pool.total() == before_total - 4, "exchange removed 5 and added 1 (total %d to %d)" % [before_total, pool.total()])
	_check(pool.count(ChakraType.Type.BLOODLINE) == before_blood + 1, "exchange added one Bloodline")


func _pay_through_modal(view: BattleView, plan: TurnPlan) -> void:
	var payment: PaymentModal = view.modal as PaymentModal
	_check(payment != null, "the only modal after End Turn is the payment modal")
	_payments += 1
	_check(payment.confirm_button.disabled, "payment Confirm is disabled before any pick")
	if _payment_cancels == 0:
		await _click(payment.cancel_button)
		_payment_cancels += 1
		_check(view.modal == null and view.queue.actions.size() == plan.actions.size(), "payment Cancel keeps the queue")
		await _click(view.end_turn_button)
		await _frames(2)
		payment = view.modal as PaymentModal
		_check(payment != null, "End Turn opens the payment modal again")
	if not _taken.has("payment"):
		await _shot("real-payment-modal")
		_taken["payment"] = true
	var wanted: Array[ChakraType.Type] = view.queue.random_candidates().slice(0, payment.slots)
	for type: ChakraType.Type in wanted:
		await _click(payment.picker.add_buttons[type])
	_check(payment.picker.selected.size() == payment.slots, "picked the right number of chakras")
	await _click(payment.confirm_button)
	await _frames(2)


func _surrender_game() -> void:
	var select: CharacterSelect = SceneRouter.current as CharacterSelect
	for i: int in 3:
		await _click(select.cards[i])
	await _click(select.start_button)
	await _frames(3)
	var view: BattleView = SceneRouter.current as BattleView
	_check(view != null, "second battle opens")
	await _click(view.surrender_button)
	await _click((view.modal as SurrenderModal).yes_button)
	await _frames(2)
	_check(view.battle.result.ended and view.battle.result.winner == 1, "Yes ends the battle as a loss")
	_check(view.game_over_panel != null and view.game_over_panel.visible and view.result_label.text == "Defeat", "surrender shows Defeat")
	await _shot("surrender-defeat")
	await _click(view.back_button)
	await _frames(3)
	_check(SceneRouter.current is CharacterSelect, "back to select after surrender")


func _find_button(view: BattleView, action: Action) -> AbilityButton:
	for button: AbilityButton in (view.panels[action.source] as FighterPanel).ability_buttons:
		if button.state == action.ability:
			return button
	return null


func _click(control: Control) -> void:
	var point: Vector2 = control.get_global_rect().get_center()
	var motion: InputEventMouseMotion = InputEventMouseMotion.new()
	motion.position = point
	motion.global_position = point
	get_viewport().push_input(motion, true)
	await _frames(1)
	for pressed: bool in [true, false]:
		var event: InputEventMouseButton = InputEventMouseButton.new()
		event.button_index = MOUSE_BUTTON_LEFT
		event.pressed = pressed
		event.position = point
		event.global_position = point
		event.button_mask = MOUSE_BUTTON_MASK_LEFT if pressed else 0
		get_viewport().push_input(event, true)
		await _frames(1)


func _frames(count: int) -> void:
	for i: int in count:
		await get_tree().process_frame


func _shot(shot_name: String) -> void:
	if _shots_dir == "":
		return
	await _frames(2)
	await RenderingServer.frame_post_draw
	var image: Image = get_viewport().get_texture().get_image()
	var path: String = "%s/%s.png" % [_shots_dir, shot_name]
	var error: Error = image.save_png(path)
	_check(error == OK, "screenshot saved to %s" % path)


func _elapsed() -> float:
	return (Time.get_ticks_msec() - _started_at) / 1000.0


func _check(condition: bool, message: String) -> void:
	if condition:
		return
	printerr("DRIVE FAIL: %s (player_turn=%d)" % [message, _player_turns])
	get_tree().quit(1)
