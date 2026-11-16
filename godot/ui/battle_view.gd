class_name BattleView
extends Control

signal exit_requested
signal game_over(result: BattleResult)

const TURN_SECONDS: int = 60
const HINT_TEXT: String = "Hover an ability to read its description."

var battle: Battle
var player_team: int = 0
var background_name: String = ""
var panels: Dictionary = {}
var sprites: Dictionary = {}
var stage: BattleStage
var animated: bool = false
var shown_hp: Dictionary = {}
var chakra_labels: Dictionary = {}
var queue: ActionQueue
var turn_player: TurnPlayer = TurnPlayer.new()
var ai: AiPlayer = AiPlayer.new()
var ai_rng: Rng = Rng.new(1)
var turn_length: float = TURN_SECONDS
var time_left: float = TURN_SECONDS
var selected_fighter: Fighter
var selected_state: AbilityState
var targets: Array[Fighter] = []
var resolving: bool = false
var log_lines: Array[String] = []
var history: Array[String] = []
var modal: ModalBase
var queue_remove_buttons: Array[Button] = []
var game_over_panel: PanelContainer
var result_label: Label
var back_button: Button

var _built: bool = false
var _pending_next: Callable

@onready var background: TextureRect = %Background
@onready var player_avatar: TextureRect = %PlayerAvatar
@onready var enemy_avatar: TextureRect = %EnemyAvatar
@onready var turn_label: Label = %TurnLabel
@onready var timer_label: Label = %TimerLabel
@onready var player_board: VBoxContainer = %PlayerBoard
@onready var enemy_board: VBoxContainer = %EnemyBoard
@onready var chakra_row: HBoxContainer = %ChakraRow
@onready var chakra_total: Label = %ChakraTotal
@onready var exchange_button: Button = %ExchangeButton
@onready var arena_player: VBoxContainer = %ArenaPlayer
@onready var arena_enemy: VBoxContainer = %ArenaEnemy
@onready var end_turn_button: Button = %EndTurnButton
@onready var surrender_button: Button = %SurrenderButton
@onready var history_button: Button = %HistoryButton
@onready var desc_icon: TextureRect = %DescIcon
@onready var desc_name: Label = %DescName
@onready var desc_costs: CostRow = %DescCosts
@onready var desc_meta: Label = %DescMeta
@onready var desc_text: Label = %DescText
@onready var queue_list: VBoxContainer = %QueueList
@onready var log_text: RichTextLabel = %LogText


func bind(new_battle: Battle, team_idx: int = 0) -> void:
	_disconnect_battle()
	battle = new_battle
	player_team = team_idx
	battle.hp_changed.connect(_on_hp_changed)
	battle.fighter_died.connect(_on_fighter_died)
	battle.chakra_changed.connect(_on_chakra_changed)
	battle.turn_started.connect(_on_turn_started)
	queue = ActionQueue.new(battle, team_idx)
	queue.changed.connect(_on_queue_changed)
	resolving = false
	selected_fighter = null
	selected_state = null
	targets = []
	log_lines.clear()
	history.clear()
	_close_modal(false)
	time_left = turn_length
	_connect_turn_player()
	if is_node_ready():
		_build()


func _ready() -> void:
	theme = GameTheme.get_theme()
	if battle == null:
		bind(MatchFactory.new_match(MatchFactory.default_team(), 1))
	else:
		_build()


func set_turn_player(player: TurnPlayer) -> void:
	if turn_player.event_played.is_connected(_on_event_played):
		turn_player.event_played.disconnect(_on_event_played)
		turn_player.finished.disconnect(_on_play_finished)
	turn_player = player
	_connect_turn_player()


func use_animations() -> void:
	animated = true
	if stage != null:
		set_turn_player(AnimatedTurnPlayer.new(stage))


func _connect_turn_player() -> void:
	if not turn_player.event_played.is_connected(_on_event_played):
		turn_player.event_played.connect(_on_event_played)
		turn_player.finished.connect(_on_play_finished)


func set_turn_length(seconds: float) -> void:
	turn_length = seconds
	time_left = seconds
	_refresh_timer()


func can_act() -> bool:
	return turn_is_open() and modal == null


func turn_is_open() -> bool:
	return _built and not resolving and not battle.result.ended and battle.current_team == player_team


func lock_reason(fighter: Fighter, state: AbilityState) -> String:
	if not fighter.is_alive():
		return "Down"
	if fighter.is_stunned():
		return "Stunned"
	if not state.is_ready():
		return "Cooldown: %d" % state.cooldown
	if not fighter.can_use_ability(state.data):
		return "Not available yet"
	if resolving:
		return "Turn resolving"
	if battle.result.ended or battle.current_team != player_team:
		return "Not your turn"
	if queue.has_action_for(fighter):
		return "Action queued"
	if battle.valid_targets(player_team, fighter, state).is_empty():
		return "No valid target"
	if not queue.would_afford(fighter, state):
		return "Not enough chakra"
	return ""


func select_ability(fighter: Fighter, state: AbilityState) -> void:
	if not can_act() or lock_reason(fighter, state) != "":
		return
	if selected_state == state and selected_fighter == fighter:
		clear_selection()
		return
	selected_fighter = fighter
	selected_state = state
	targets = battle.valid_targets(player_team, fighter, state)
	show_ability(state)
	_refresh_selection()


func click_target(fighter: Fighter) -> void:
	if not can_act() or selected_state == null:
		return
	if not targets.has(fighter):
		clear_selection()
		return
	var action: Action = Action.new(selected_fighter, selected_state, fighter)
	var error: String = queue.try_add(action)
	if error != "":
		_say("Cannot queue: %s." % error)
	clear_selection()


func clear_selection() -> void:
	selected_fighter = null
	selected_state = null
	targets = []
	_refresh_selection()


func remove_action(index: int) -> void:
	if not can_act():
		return
	queue.remove_at(index)


func end_turn() -> void:
	if not can_act():
		return
	if queue.needs_random_choice():
		clear_selection()
		_open_modal(PaymentModal.new(queue.random_candidates(), queue.random_slots()))
		var payment_modal: PaymentModal = modal as PaymentModal
		payment_modal.confirmed.connect(_on_payment_confirmed)
		payment_modal.cancelled.connect(_close_modal)
		return
	_submit_player_turn(queue.to_plan())


func open_exchange() -> void:
	if not can_act():
		return
	clear_selection()
	_open_modal(ExchangeModal.new(battle.teams[player_team].pool.chakras.duplicate(), queue.exchange_error))
	var exchange: ExchangeModal = modal as ExchangeModal
	exchange.confirmed.connect(_on_exchange_confirmed)
	exchange.cancelled.connect(_close_modal)


func open_surrender() -> void:
	if not can_act():
		return
	clear_selection()
	_open_modal(SurrenderModal.new())
	var surrender: SurrenderModal = modal as SurrenderModal
	surrender.confirmed.connect(_on_surrender_confirmed)
	surrender.cancelled.connect(_close_modal)


func open_history() -> void:
	if not _built or modal != null:
		return
	_open_modal(HistoryModal.new(history))
	modal.cancelled.connect(_close_modal)


func _open_modal(new_modal: ModalBase) -> void:
	_close_modal(false)
	modal = new_modal
	add_child(modal)
	_refresh_controls()


func _close_modal(refresh: bool = true) -> void:
	if modal == null:
		return
	remove_child(modal)
	modal.queue_free()
	modal = null
	if _built and refresh:
		_refresh_controls()


func _on_payment_confirmed(payment: Array[ChakraType.Type]) -> void:
	if not queue.is_valid_random_payment(payment):
		return
	_close_modal()
	_submit_player_turn(queue.plan_with_payment(payment))


func _on_exchange_confirmed(chakras: Array[ChakraType.Type], target: ChakraType.Type) -> void:
	if queue.exchange_error(chakras, target) != "":
		return
	_close_modal()
	battle.exchange_chakra(player_team, chakras, target)


func _on_surrender_confirmed() -> void:
	_close_modal()
	if not can_act():
		return
	resolving = true
	for event: BattleEvent in battle.surrender(player_team):
		_on_event_played(event)
	_finish_if_over()


func _submit_player_turn(plan: TurnPlan) -> void:
	clear_selection()
	_sync_shown_hp()
	resolving = true
	var events: Array[BattleEvent] = battle.submit_turn(player_team, plan.actions, plan.random_payment)
	if not events.is_empty() and events[0].type == BattleEvent.Type.REJECTED:
		_say(EventText.describe(events[0]))
		resolving = false
		queue.clear()
		_refresh_controls()
		return
	queue.clear()
	_refresh_controls()
	_play(events, _after_player_events)


func advance_timer(delta: float) -> void:
	if not turn_is_open():
		return
	time_left -= delta
	_refresh_timer()
	if time_left <= 0.0:
		_close_modal()
		_submit_player_turn(queue.to_plan())


func _process(delta: float) -> void:
	advance_timer(delta)


func _play(events: Array[BattleEvent], next: Callable) -> void:
	resolving = true
	_pending_next = next
	turn_player.play(events)


func _on_play_finished() -> void:
	var next: Callable = _pending_next
	_pending_next = Callable()
	if next.is_valid():
		next.call()


func _after_player_events() -> void:
	if _finish_if_over():
		return
	if battle.current_team != player_team:
		var enemy_team: int = battle.current_team
		var plan: TurnPlan = ai.plan_turn(battle, enemy_team, ai_rng)
		var events: Array[BattleEvent] = battle.submit_turn(enemy_team, plan.actions, plan.random_payment)
		_play(events, _after_enemy_events)
		return
	_unlock()


func _after_enemy_events() -> void:
	if _finish_if_over():
		return
	_unlock()


func _unlock() -> void:
	resolving = false
	_sync_shown_hp()
	time_left = turn_length
	refresh_all()


func _finish_if_over() -> bool:
	if not battle.result.ended:
		return false
	resolving = true
	_sync_shown_hp()
	refresh_all()
	show_game_over(battle.result)
	game_over.emit(battle.result)
	return true


func show_game_over(result: BattleResult) -> void:
	if game_over_panel == null:
		_build_game_over()
	if result.draw:
		result_label.text = "Draw"
	elif result.winner == player_team:
		result_label.text = "Victory"
	else:
		result_label.text = "Defeat"
	game_over_panel.visible = true


func _build_game_over() -> void:
	game_over_panel = PanelContainer.new()
	game_over_panel.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	game_over_panel.grow_horizontal = Control.GROW_DIRECTION_BOTH
	game_over_panel.grow_vertical = Control.GROW_DIRECTION_BOTH
	game_over_panel.custom_minimum_size = Vector2(360, 200)
	var column: VBoxContainer = VBoxContainer.new()
	column.alignment = BoxContainer.ALIGNMENT_CENTER
	column.add_theme_constant_override("separation", 18)
	game_over_panel.add_child(column)
	result_label = Label.new()
	result_label.theme_type_variation = "TitleLabel"
	result_label.add_theme_font_size_override("font_size", 48)
	result_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	column.add_child(result_label)
	back_button = Button.new()
	back_button.text = "Back to select"
	back_button.custom_minimum_size = Vector2(0, 44)
	back_button.pressed.connect(func() -> void: exit_requested.emit())
	column.add_child(back_button)
	add_child(game_over_panel)


func _say(text: String) -> void:
	log_lines.append(text)
	log_text.text = "\n".join(log_lines)


func _record(text: String) -> void:
	history.append(text)
	_say(text)


func _on_event_played(event: BattleEvent) -> void:
	_apply_event_to_shown_hp(event)
	var text: String = EventText.describe(event)
	if text != "":
		_record(text)
	refresh_all()


func _on_queue_changed() -> void:
	if _built:
		_refresh_queue()
		_refresh_chakra()
		_refresh_controls()


func show_ability(state: AbilityState) -> void:
	var data: AbilityData = state.data
	desc_icon.texture = Art.ability_icon(data.display_name)
	desc_name.text = data.display_name
	desc_costs.show_cost(data.cost, 18)
	desc_meta.text = "Cooldown: %d    Target: %s" % [data.cooldown, _target_text(data.target_type)]
	desc_text.text = data.description


func refresh_all() -> void:
	if not _built:
		return
	turn_label.text = "Turn %d" % battle.turn
	_refresh_timer()
	for fighter: Fighter in panels:
		_refresh_fighter(fighter)
	_refresh_chakra()
	_refresh_queue()
	_refresh_controls()
	_refresh_selection()


func _build() -> void:
	if _built:
		_clear()
	_built = true
	if background_name == "":
		var picker: RandomNumberGenerator = RandomNumberGenerator.new()
		picker.randomize()
		background_name = Art.BATTLE_BACKGROUNDS[picker.randi_range(0, Art.BATTLE_BACKGROUNDS.size() - 1)]
	background.texture = Art.battle_background(background_name)
	player_avatar.texture = Art.default_avatar()
	enemy_avatar.texture = Art.default_avatar()
	end_turn_button.disabled = true
	if not end_turn_button.pressed.is_connected(end_turn):
		end_turn_button.pressed.connect(end_turn)
	exchange_button.disabled = true
	surrender_button.disabled = true
	history_button.disabled = true
	if not exchange_button.pressed.is_connected(open_exchange):
		exchange_button.pressed.connect(open_exchange)
		surrender_button.pressed.connect(open_surrender)
		history_button.pressed.connect(open_history)
	_build_chakra_row()
	_build_team(player_team, false, player_board, arena_player)
	_build_team(1 - player_team, true, enemy_board, arena_enemy)
	stage = BattleStage.new()
	stage.sprites = sprites
	add_child(stage)
	if animated:
		set_turn_player(AnimatedTurnPlayer.new(stage))
	_reset_description()
	log_text.add_theme_color_override("default_color", Color.WHITE)
	log_text.add_theme_font_size_override("normal_font_size", 14)
	log_text.text = ""
	if game_over_panel != null:
		game_over_panel.visible = false
	time_left = turn_length
	refresh_all()


func _build_team(team_idx: int, enemy: bool, board: VBoxContainer, arena: VBoxContainer) -> void:
	for fighter: Fighter in battle.teams[team_idx].fighters:
		var panel: FighterPanel = FighterPanel.new(fighter, enemy)
		panel.ability_hovered.connect(show_ability)
		panel.ability_pressed.connect(select_ability)
		panel.clicked.connect(click_target)
		board.add_child(panel)
		panels[fighter] = panel
		var sprite: FighterSprite = FighterSprite.new(fighter, enemy)
		arena.add_child(sprite)
		sprites[fighter] = sprite
		shown_hp[fighter] = fighter.hp


func _build_chakra_row() -> void:
	for type: ChakraType.Type in ChakraType.real_types():
		var cell: HBoxContainer = HBoxContainer.new()
		cell.add_theme_constant_override("separation", 4)
		var icon: TextureRect = TextureRect.new()
		icon.texture = Art.chakra_icon(type)
		icon.custom_minimum_size = Vector2(28, 28)
		icon.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		icon.tooltip_text = ChakraType.type_name(type)
		cell.add_child(icon)
		var count: Label = Label.new()
		count.theme_type_variation = "TitleLabel"
		cell.add_child(count)
		chakra_row.add_child(cell)
		chakra_labels[type] = count


func _clear() -> void:
	for node: Node in [player_board, enemy_board, arena_player, arena_enemy, chakra_row]:
		for child: Node in node.get_children():
			node.remove_child(child)
			child.queue_free()
	if stage != null:
		remove_child(stage)
		stage.queue_free()
		stage = null
	panels.clear()
	sprites.clear()
	shown_hp.clear()
	chakra_labels.clear()


func _reset_description() -> void:
	desc_icon.texture = null
	desc_name.text = ""
	desc_costs.show_cost([])
	desc_meta.text = ""
	desc_text.text = HINT_TEXT


func _refresh_fighter(fighter: Fighter) -> void:
	var panel: FighterPanel = panels[fighter]
	panel.shown_hp = display_hp(fighter)
	panel.refresh(lock_reason)
	var sprite: FighterSprite = sprites[fighter]
	sprite.set_alive(display_hp(fighter) > 0)


func display_hp(fighter: Fighter) -> int:
	if resolving and shown_hp.has(fighter):
		return int(shown_hp[fighter])
	return fighter.hp


func _sync_shown_hp() -> void:
	for fighter: Fighter in panels:
		shown_hp[fighter] = fighter.hp


func _apply_event_to_shown_hp(event: BattleEvent) -> void:
	if event.target == null or not shown_hp.has(event.target):
		return
	match event.type:
		BattleEvent.Type.DAMAGE:
			shown_hp[event.target] = maxi(int(shown_hp[event.target]) - event.amount, 0)
		BattleEvent.Type.HEAL:
			shown_hp[event.target] = mini(int(shown_hp[event.target]) + event.amount, Fighter.MAX_HP)
		BattleEvent.Type.FIGHTER_DIED:
			shown_hp[event.target] = 0


func _refresh_chakra() -> void:
	var pool: ChakraPool = battle.teams[player_team].pool
	var reserved: Array[ChakraType.Type] = queue.reserved_cost()
	for type: ChakraType.Type in chakra_labels:
		var label: Label = chakra_labels[type]
		var held: int = reserved.count(type)
		label.text = "x%d" % pool.count(type) if held == 0 else "x%d (-%d)" % [pool.count(type), held]
	chakra_total.text = "Total: %d" % pool.total() if reserved.is_empty() else "Total: %d (reserved %d)" % [pool.total(), reserved.size()]


func _refresh_timer() -> void:
	timer_label.text = "%02d" % maxi(ceili(time_left), 0)


func _refresh_controls() -> void:
	end_turn_button.disabled = not can_act()
	exchange_button.disabled = not can_act()
	surrender_button.disabled = not can_act()
	history_button.disabled = not _built or modal != null
	for fighter: Fighter in battle.teams[player_team].fighters:
		panels[fighter].shown_hp = display_hp(fighter)
		panels[fighter].refresh(lock_reason)


func _refresh_selection() -> void:
	for fighter: Fighter in panels:
		var panel: FighterPanel = panels[fighter]
		panel.set_highlight(targets.has(fighter))
		for button: AbilityButton in panel.ability_buttons:
			button.set_selected(fighter == selected_fighter and button.state == selected_state)


func _refresh_queue() -> void:
	for child: Node in queue_list.get_children():
		queue_list.remove_child(child)
		child.queue_free()
	queue_remove_buttons.clear()
	for i: int in queue.actions.size():
		var action: Action = queue.actions[i]
		var row: HBoxContainer = HBoxContainer.new()
		row.add_theme_constant_override("separation", 4)
		var icon: TextureRect = TextureRect.new()
		icon.texture = Art.ability_icon(action.ability.data.display_name)
		icon.custom_minimum_size = Vector2(28, 28)
		icon.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		row.add_child(icon)
		var label: Label = Label.new()
		label.theme_type_variation = "LightLabel"
		label.add_theme_font_size_override("font_size", 13)
		label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		label.clip_text = true
		var target_name: String = action.target.display_name() if action.target != null and action.target != action.source else ""
		label.text = action.ability.data.display_name
		label.tooltip_text = "%s uses %s" % [action.source.display_name(), action.ability.data.display_name]
		if target_name != "":
			label.tooltip_text += " on %s" % target_name
		label.mouse_filter = Control.MOUSE_FILTER_PASS
		row.add_child(label)
		var remove: Button = Button.new()
		remove.text = "X"
		remove.tooltip_text = "Remove this action"
		remove.pressed.connect(remove_action.bind(i))
		row.add_child(remove)
		queue_list.add_child(row)
		queue_remove_buttons.append(remove)


func _disconnect_battle() -> void:
	if battle == null:
		return
	battle.hp_changed.disconnect(_on_hp_changed)
	battle.fighter_died.disconnect(_on_fighter_died)
	battle.chakra_changed.disconnect(_on_chakra_changed)
	battle.turn_started.disconnect(_on_turn_started)
	queue.changed.disconnect(_on_queue_changed)


func _on_hp_changed(fighter: Fighter, _old_hp: int, _new_hp: int) -> void:
	if _built and panels.has(fighter):
		_refresh_fighter(fighter)


func _on_fighter_died(fighter: Fighter) -> void:
	if _built and panels.has(fighter):
		_refresh_fighter(fighter)


func _on_chakra_changed(_team_idx: int) -> void:
	if not _built:
		return
	_refresh_chakra()
	for fighter: Fighter in battle.teams[player_team].fighters:
		_refresh_fighter(fighter)


func _on_turn_started(team_idx: int, _turn: int) -> void:
	if team_idx == player_team:
		time_left = turn_length
	refresh_all()


static func _target_text(target: AbilityData.Target) -> String:
	match target:
		AbilityData.Target.ENEMY:
			return "One enemy"
		AbilityData.Target.ALLY:
			return "One ally"
		AbilityData.Target.SELF:
			return "Self"
		AbilityData.Target.ALL_ENEMIES:
			return "All enemies"
		_:
			return "All allies"
