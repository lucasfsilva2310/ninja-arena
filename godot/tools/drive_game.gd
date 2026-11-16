extends Control

const MAX_PLAYER_TURNS: int = 400
const FAST_TIMEOUT_SECONDS: float = 300.0
const ANIMATED_TIMEOUT_SECONDS: float = 1500.0
const RESOLVE_TIMEOUT_SECONDS: float = 120.0
const DRIVE_SEED: int = 21
const COVER_TEAMS: Array = [["Naruto", "Sasuke", "Sakura"], ["Rock Lee", "Naruto", "Sakura"]]
const COVER_ATTEMPTS: int = 5
const COVER_SHOT_DELAY: float = 0.9
const ALL_ABILITIES: Array[String] = [
	"Kage Bunshin", "Naruto Kick", "Rasengan", "Escape Clone", "Fireball", "Chidori", "Sharingan", "Kawarimi",
	"Anger Punch", "Heal", "Inner Strength", "Konoha Senpu", "Primary Lotus", "Release Weights", "Backflip", "Hidden Lotus",
]

var _shots_dir: String = ""
var _timeout: float = FAST_TIMEOUT_SECONDS
var _lock_checks: int = 0
var _animated_shots: int = 0
var _started_at: int = 0
var _taken: Dictionary = {}
var _queued: int = 0
var _player_turns: int = 0
var _payments: int = 0
var _payment_cancels: int = 0
var _cover: bool = false
var _covered: Dictionary = {}
var _cover_games: int = 0


func _ready() -> void:
	var args: PackedStringArray = OS.get_cmdline_user_args()
	var index: int = args.find("--shots")
	if index != -1 and index + 1 < args.size():
		_shots_dir = args[index + 1]
	AnimConfig.fast = args.has("--fast")
	_timeout = FAST_TIMEOUT_SECONDS if AnimConfig.fast else ANIMATED_TIMEOUT_SECONDS
	var seed_arg: int = args.find("--seed")
	SceneRouter.seed_override = int(args[seed_arg + 1]) if seed_arg != -1 and seed_arg + 1 < args.size() else DRIVE_SEED
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child((load("res://ui/app.tscn") as PackedScene).instantiate())
	_cover = args.has("--cover")
	_started_at = Time.get_ticks_msec()
	if _cover:
		_timeout = ANIMATED_TIMEOUT_SECONDS * 2.0
		_run_cover.call_deferred()
	else:
		_run.call_deferred()


func _process(_delta: float) -> void:
	if _started_at != 0 and _elapsed() > _timeout + 20.0:
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
		_check(_elapsed() < _timeout, "game finishes before the timeout")
		_check(_player_turns < MAX_PLAYER_TURNS, "game finishes within %d player turns" % MAX_PLAYER_TURNS)
		_check(view.can_act(), "player can act at the start of each turn")
		_player_turns += 1
		var plan: TurnPlan = planner.plan_turn(view.battle, 0, plan_rng)
		for action: Action in plan.actions:
			var button: AbilityButton = _find_button(view, action)
			_check(button != null and not button.button.disabled, "planned ability button is enabled")
			var queued_before: int = view.queue.actions.size()
			await _click(button.button)
			if not ActionQueue.needs_pick(action.ability.data):
				_check(view.queue.actions.size() == queued_before + 1, "a self or area ability queues on the ability click")
			if plan.actions.size() >= 2 and not _taken.has("selected"):
				await _shot("ability-selected")
				_taken["selected"] = true
			if ActionQueue.needs_pick(action.ability.data):
				var before: int = view.queue.actions.size()
				await _click((view.panels[action.target] as FighterPanel).name_label)
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
		await _wait_for_resolution(view)
		_check_fits(view)
		_check(not view.resolving or view.battle.result.ended, "turn resolved and input unlocked")
		_check_sprites_match_state(view)
	await _frames(2)
	_check(view.game_over_panel != null and view.game_over_panel.visible, "game over panel is visible")
	await _shot("game-over")
	var label: String = view.result_label.text
	var final_turn: int = view.battle.turn
	await _click(view.back_button)
	await _frames(3)
	_check(SceneRouter.current is CharacterSelect, "back button returns to the select screen")
	await _surrender_game()
	print("DRIVE OK fast=%s lock_checks=%d result=%s player_turns=%d battle_turn=%d queued=%d payment_modals=%d payment_cancels=%d seconds=%.1f" % [str(AnimConfig.fast), _lock_checks, label, _player_turns, final_turn, _queued, _payments, _payment_cancels, _elapsed()])
	get_tree().quit(0)


func _run_cover() -> void:
	await _frames(3)
	var base_seed: int = SceneRouter.seed_override
	for team_names: Array in COVER_TEAMS:
		var attempts: int = 0
		while attempts < COVER_ATTEMPTS and not _team_covered(team_names):
			attempts += 1
			SceneRouter.seed_override = base_seed + _cover_games * 7
			_cover_games += 1
			await _cover_battle(team_names)
	for ability_name: String in ALL_ABILITIES:
		_check(_covered.has(ability_name), "ability %s was played and resolved in a real battle" % ability_name)
	print("COVER OK fast=%s abilities=%d games=%d seconds=%.1f" % [str(AnimConfig.fast), _covered.size(), _cover_games, _elapsed()])
	get_tree().quit(0)


func _team_covered(team_names: Array) -> bool:
	for character: CharacterData in Content.characters():
		if not team_names.has(character.display_name):
			continue
		for ability: AbilityData in character.abilities:
			if not _covered.has(ability.display_name):
				return false
	return not (team_names.has("Rock Lee") and not _covered.has("Hidden Lotus"))


func _cover_battle(team_names: Array) -> void:
	var select: CharacterSelect = SceneRouter.current as CharacterSelect
	_check(select != null, "cover battle starts from the select screen")
	for card: CharacterCard in select.cards:
		if team_names.has(card.character.display_name):
			await _click(card)
	_check(select.selected.size() == 3, "cover team picked")
	await _click(select.start_button)
	await _frames(3)
	var view: BattleView = SceneRouter.current as BattleView
	_check(view != null, "cover battle opens")
	var planner: AiPlayer = AiPlayer.new()
	var plan_rng: Rng = Rng.new(_cover_games)
	var turns: int = 0
	_payment_cancels = 1
	while not view.battle.result.ended:
		turns += 1
		_check(turns < MAX_PLAYER_TURNS, "cover battle finishes")
		_check(_elapsed() < _timeout, "cover run finishes before the timeout")
		_check(view.can_act(), "player can act at the start of each cover turn")
		_top_up_chakra(view)
		var fresh: Action = _first_uncovered_action(view)
		var plan: Array[Action] = []
		if fresh != null:
			plan.append(fresh)
		else:
			plan.assign(planner.plan_turn(view.battle, 0, plan_rng).actions)
		for action: Action in plan:
			var button: AbilityButton = _find_button(view, action)
			_check(button != null and not button.button.disabled, "cover ability button %s is enabled" % action.ability.data.display_name)
			var queued_before: int = view.queue.actions.size()
			await _click(button.button)
			if ActionQueue.needs_pick(action.ability.data):
				await _click((view.panels[action.target] as FighterPanel).name_label)
			_check(view.queue.actions.size() == queued_before + 1, "%s was queued" % action.ability.data.display_name)
		var log_mark: int = view.history.size()
		await _click(view.end_turn_button)
		await _frames(2)
		if view.modal != null:
			await _pay_through_modal(view, TurnPlan.new())
		_check(view.modal == null, "no modal left open after the cover turn")
		if fresh != null and not AnimConfig.fast and _shots_dir != "":
			await get_tree().create_timer(COVER_SHOT_DELAY).timeout
			await _shot("cover-%s" % fresh.ability.data.display_name.to_lower().replace(" ", "-"))
		await _wait_for_resolution(view)
		_check_fits(view)
		_check_sprites_match_state(view)
		var text: String = "\n".join(view.history.slice(log_mark))
		_check(not text.contains("rejected") and not text.contains("Cannot queue"), "no rejected turn in the log: %s" % text)
		for action: Action in plan:
			var used: String = action.ability.data.display_name
			_check(text.contains("%s uses %s" % [action.source.display_name(), used]), "%s resolved (log has the use line)" % used)
			_covered[used] = int(_covered.get(used, 0)) + 1
		_check_lotus_display(view)
	_check(view.game_over_panel != null and view.game_over_panel.visible, "game over panel is visible after a cover battle")
	await _click(view.back_button)
	await _frames(3)
	_check(SceneRouter.current is CharacterSelect, "back to select after a cover battle")


func _check_lotus_display(view: BattleView) -> void:
	for fighter: Fighter in view.battle.teams[0].fighters:
		var panel: FighterPanel = view.panels[fighter]
		var names: Array[String] = []
		for button: AbilityButton in panel.ability_buttons:
			names.append(button.state.data.display_name)
		var expected: Array[String] = []
		for state: AbilityState in fighter.abilities:
			expected.append(state.data.display_name)
		_check(names == expected, "%s ability bar matches its abilities %s vs %s" % [fighter.display_name(), str(names), str(expected)])
		var has_transform: bool = false
		for effect: ActiveEffect in fighter.active_effects():
			if effect.kind == EffectData.Kind.TRANSFORM:
				has_transform = true
		_check(names.has("Hidden Lotus") == has_transform, "%s shows Hidden Lotus exactly while the transform lasts" % fighter.display_name())
		for chip: String in panel.chip_names:
			_check(chip != "", "chip has a name")
	if view.described != null and view.described_fighter != null:
		_check(view.described_fighter.abilities.has(view.described), "the footer describes an ability that is still on the bar")


func _top_up_chakra(view: BattleView) -> void:
	var pool: ChakraPool = view.battle.teams[0].pool
	for type: ChakraType.Type in ChakraType.real_types():
		while pool.count(type) < 2:
			pool.add(type)
	view.battle.chakra_changed.emit(0)


func _first_uncovered_action(view: BattleView) -> Action:
	for fighter: Fighter in view.battle.teams[0].fighters:
		for state: AbilityState in fighter.abilities:
			if _covered.has(state.data.display_name) or view.lock_reason(fighter, state) != "":
				continue
			var targets: Array[Fighter] = view.battle.valid_targets(0, fighter, state)
			var target: Fighter = null
			if ActionQueue.needs_pick(state.data):
				target = targets[0]
				if state.data.target_type == AbilityData.Target.ENEMY:
					target = targets[targets.size() - 1]
			return Action.new(fighter, state, target)
	return null


func _wait_for_resolution(view: BattleView) -> void:
	var waited_from: float = _elapsed()
	var probed: bool = false
	while view.turn_player.playing or (view.resolving and not view.battle.result.ended):
		_check(_elapsed() - waited_from < RESOLVE_TIMEOUT_SECONDS, "a turn finishes its animations within %.0f seconds" % RESOLVE_TIMEOUT_SECONDS)
		if not probed and not AnimConfig.fast and not _cover:
			probed = true
			await _probe_lock(view)
		await _frames(1)
	await _frames(1)


func _probe_lock(view: BattleView) -> void:
	_check(not view.can_act(), "input is locked while animations play")
	_check(view.end_turn_button.disabled and view.exchange_button.disabled and view.surrender_button.disabled, "footer buttons are disabled while animations play")
	var turn_before: int = view.battle.turn
	var queued_before: int = view.queue.actions.size()
	for panel_fighter: Fighter in view.battle.teams[0].fighters:
		for button: AbilityButton in (view.panels[panel_fighter] as FighterPanel).ability_buttons:
			_check(button.button.disabled, "ability buttons are disabled while animations play")
	await _click(view.end_turn_button)
	await _click(view.exchange_button)
	_check(view.modal == null, "clicking locked buttons opens no modal")
	_check(view.battle.turn == turn_before and view.queue.actions.size() == queued_before, "clicking during animations changes nothing")
	_lock_checks += 1
	if _animated_shots < 3 and _shots_dir != "":
		_animated_shots += 1
		await _shot("animating-%d" % _animated_shots)


func _check_sprites_match_state(view: BattleView) -> void:
	for fighter: Fighter in view.sprites:
		var sprite: FighterSprite = view.sprites[fighter]
		_check(not sprite.busy, "no sprite is stuck in an animation after the turn")
		_check(sprite.current_animation() == ("idle" if fighter.is_alive() else "defeated"), "%s rests as %s" % [fighter.display_name(), "idle" if fighter.is_alive() else "defeated"])
		_check(view.display_hp(fighter) == fighter.hp, "shown HP matches real HP after the turn")


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
