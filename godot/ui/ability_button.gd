class_name AbilityButton
extends VBoxContainer

signal hovered(state: AbilityState)
signal activated(state: AbilityState)

const ICON_SIZE: int = 52

var state: AbilityState
var button: Button
var cooldown_label: Label
var cost_row: CostRow
var lock_reason: String = ""
var selected: bool = false


func _init() -> void:
	add_theme_constant_override("separation", 2)
	button = Button.new()
	button.theme_type_variation = "AbilityButton"
	button.custom_minimum_size = Vector2(ICON_SIZE, ICON_SIZE)
	button.expand_icon = true
	button.icon_alignment = HORIZONTAL_ALIGNMENT_CENTER
	button.mouse_entered.connect(_on_hover)
	button.pressed.connect(_on_pressed)
	add_child(button)

	cooldown_label = Label.new()
	cooldown_label.theme_type_variation = "LightLabel"
	cooldown_label.add_theme_font_size_override("font_size", 30)
	cooldown_label.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	cooldown_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	cooldown_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	cooldown_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	cooldown_label.visible = false
	button.add_child(cooldown_label)

	cost_row = CostRow.new()
	add_child(cost_row)


func setup(new_state: AbilityState) -> void:
	state = new_state
	button.icon = Art.ability_icon(state.data.display_name)
	cost_row.show_cost(state.data.cost)
	refresh("")


func refresh(new_lock_reason: String, cooldown_offset: int = 0) -> void:
	lock_reason = new_lock_reason
	var locked: bool = lock_reason != ""
	button.disabled = locked
	var shown: int = maxi(state.cooldown - cooldown_offset, 0)
	cooldown_label.visible = shown > 0
	cooldown_label.text = str(shown)
	var tip: String = state.data.display_name
	if locked:
		tip += "\n" + lock_reason
	button.tooltip_text = tip


func set_selected(value: bool) -> void:
	selected = value
	if selected:
		button.add_theme_stylebox_override("normal", GameTheme.box(Color(1, 0.9, 0.3, 0.25), Color("fbbf24"), 4, 6, 0))
	else:
		button.remove_theme_stylebox_override("normal")


func is_locked() -> bool:
	return lock_reason != ""


func _on_hover() -> void:
	hovered.emit(state)


func _on_pressed() -> void:
	activated.emit(state)
