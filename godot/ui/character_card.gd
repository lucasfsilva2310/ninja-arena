class_name CharacterCard
extends PanelContainer

signal clicked(character: CharacterData)
signal hovered(character: CharacterData)

const NORMAL_STYLE_COLOR: Color = Color(0.95, 0.92, 0.88, 0.95)

var character: CharacterData
var picked: bool = false:
	set(value):
		picked = value
		_apply_style()


func _init(new_character: CharacterData) -> void:
	character = new_character
	custom_minimum_size = Vector2(104, 128)
	mouse_filter = Control.MOUSE_FILTER_STOP
	mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	var column: VBoxContainer = VBoxContainer.new()
	column.mouse_filter = Control.MOUSE_FILTER_IGNORE
	column.add_theme_constant_override("separation", 4)
	add_child(column)
	var portrait: TextureRect = TextureRect.new()
	portrait.texture = Art.avatar(character.display_name)
	portrait.custom_minimum_size = Vector2(88, 88)
	portrait.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	portrait.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	portrait.mouse_filter = Control.MOUSE_FILTER_IGNORE
	column.add_child(portrait)
	var label: Label = Label.new()
	label.text = character.display_name
	label.theme_type_variation = "TitleLabel"
	label.add_theme_font_size_override("font_size", 16)
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	column.add_child(label)
	mouse_entered.connect(func() -> void: hovered.emit(character))
	_apply_style()


func _gui_input(event: InputEvent) -> void:
	var press: InputEventMouseButton = event as InputEventMouseButton
	if press != null and press.pressed and press.button_index == MOUSE_BUTTON_LEFT:
		clicked.emit(character)


func _apply_style() -> void:
	if picked:
		add_theme_stylebox_override("panel", GameTheme.box(Color(0.75, 0.86, 1.0, 0.95), GameTheme.SELECTED, 3, 8, 6))
	else:
		add_theme_stylebox_override("panel", GameTheme.box(NORMAL_STYLE_COLOR, GameTheme.PARCHMENT_EDGE, 2, 8, 6))
