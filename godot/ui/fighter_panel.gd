class_name FighterPanel
extends PanelContainer

signal ability_hovered(state: AbilityState)
signal ability_pressed(fighter: Fighter, state: AbilityState)
signal clicked(fighter: Fighter)

const AVATAR_SIZE: int = 72
const PLAYER_EFFECTS_HEIGHT: int = 22
const ENEMY_EFFECTS_HEIGHT: int = 70

var fighter: Fighter
var is_enemy: bool = false
var avatar_rect: TextureRect
var name_label: Label
var hp_bar: ProgressBar
var hp_label: Label
var effects_box: HFlowContainer
var abilities_row: HBoxContainer
var ability_buttons: Array[AbilityButton] = []
var highlighted: bool = false

var _built_states: Array[AbilityState] = []


func _init(new_fighter: Fighter, enemy: bool = false) -> void:
	fighter = new_fighter
	is_enemy = enemy
	size_flags_vertical = Control.SIZE_EXPAND_FILL
	gui_input.connect(_on_gui_input)
	var column: VBoxContainer = VBoxContainer.new()
	column.add_theme_constant_override("separation", 4)
	add_child(column)

	var main: HBoxContainer = HBoxContainer.new()
	main.add_theme_constant_override("separation", 10)
	column.add_child(main)

	avatar_rect = TextureRect.new()
	avatar_rect.custom_minimum_size = Vector2(AVATAR_SIZE, AVATAR_SIZE)
	avatar_rect.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	avatar_rect.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	avatar_rect.size_flags_vertical = Control.SIZE_SHRINK_BEGIN
	avatar_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE

	var info: VBoxContainer = VBoxContainer.new()
	info.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	info.add_theme_constant_override("separation", 3)

	name_label = Label.new()
	name_label.theme_type_variation = "TitleLabel"
	name_label.clip_text = true
	name_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	info.add_child(name_label)

	hp_bar = ProgressBar.new()
	hp_bar.theme_type_variation = "HpBar"
	hp_bar.min_value = 0
	hp_bar.max_value = Fighter.MAX_HP
	hp_bar.show_percentage = false
	hp_bar.custom_minimum_size = Vector2(60, 18)
	hp_bar.mouse_filter = Control.MOUSE_FILTER_IGNORE
	hp_label = Label.new()
	hp_label.theme_type_variation = "LightLabel"
	hp_label.add_theme_font_size_override("font_size", 13)
	hp_label.add_theme_constant_override("outline_size", 3)
	hp_label.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	hp_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	hp_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	hp_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	hp_bar.add_child(hp_label)
	info.add_child(hp_bar)

	effects_box = HFlowContainer.new()
	effects_box.add_theme_constant_override("h_separation", 4)
	effects_box.add_theme_constant_override("v_separation", 3)
	effects_box.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var effects_scroll: ScrollContainer = ScrollContainer.new()
	effects_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	effects_scroll.custom_minimum_size = Vector2(0, ENEMY_EFFECTS_HEIGHT if is_enemy else PLAYER_EFFECTS_HEIGHT)
	effects_scroll.add_child(effects_box)
	info.add_child(effects_scroll)

	if is_enemy:
		name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
		effects_box.alignment = FlowContainer.ALIGNMENT_END
		main.add_child(info)
		main.add_child(avatar_rect)
	else:
		main.add_child(avatar_rect)
		main.add_child(info)

	abilities_row = HBoxContainer.new()
	abilities_row.add_theme_constant_override("separation", 8)
	abilities_row.alignment = BoxContainer.ALIGNMENT_BEGIN
	abilities_row.visible = not is_enemy
	column.add_child(abilities_row)


func set_highlight(value: bool) -> void:
	highlighted = value
	if highlighted:
		add_theme_stylebox_override("panel", GameTheme.box(Color(1, 0.95, 0.7, 0.97), Color("f59e0b"), 4, 10, 10))
	else:
		remove_theme_stylebox_override("panel")


func refresh(lock_for: Callable = Callable()) -> void:
	var alive: bool = fighter.is_alive()
	name_label.text = fighter.display_name()
	hp_bar.value = fighter.hp
	hp_bar.theme_type_variation = "HpBar" if alive else "DeadHpBar"
	hp_label.text = "%d / %d" % [fighter.hp, Fighter.MAX_HP]
	avatar_rect.texture = Art.avatar(fighter.display_name()) if alive else Art.dead_avatar()
	modulate = Color.WHITE if alive else Color(0.65, 0.65, 0.65)
	_refresh_effects()
	if not is_enemy:
		_refresh_abilities(lock_for)


func _refresh_effects() -> void:
	for child: Node in effects_box.get_children():
		effects_box.remove_child(child)
		child.queue_free()
	for effect: ActiveEffect in fighter.active_effects():
		var chip: PanelContainer = PanelContainer.new()
		chip.theme_type_variation = "ChipPanel"
		chip.mouse_filter = Control.MOUSE_FILTER_PASS
		chip.tooltip_text = "%s: %s (%s left)" % [effect.source_name, effect.description, effect.turns_text()]
		var label: Label = Label.new()
		label.theme_type_variation = "SmallLabel"
		label.text = "%s %d" % [effect.source_name, effect.remaining]
		chip.add_child(label)
		effects_box.add_child(chip)


func _refresh_abilities(lock_for: Callable) -> void:
	if _built_states != fighter.abilities:
		_rebuild_abilities()
	for button: AbilityButton in ability_buttons:
		var reason: String = ""
		if lock_for.is_valid():
			reason = lock_for.call(fighter, button.state)
		button.refresh(reason)


func _rebuild_abilities() -> void:
	for child: Node in abilities_row.get_children():
		abilities_row.remove_child(child)
		child.queue_free()
	ability_buttons.clear()
	_built_states = fighter.abilities.duplicate()
	for state: AbilityState in fighter.abilities:
		var button: AbilityButton = AbilityButton.new()
		button.setup(state)
		button.activated.connect(func(pressed_state: AbilityState) -> void: ability_pressed.emit(fighter, pressed_state))
		button.hovered.connect(func(hovered_state: AbilityState) -> void: ability_hovered.emit(hovered_state))
		abilities_row.add_child(button)
		ability_buttons.append(button)


func _on_gui_input(event: InputEvent) -> void:
	var mouse: InputEventMouseButton = event as InputEventMouseButton
	if mouse != null and mouse.pressed and mouse.button_index == MOUSE_BUTTON_LEFT:
		clicked.emit(fighter)
