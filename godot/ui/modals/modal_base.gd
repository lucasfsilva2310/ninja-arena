class_name ModalBase
extends Control

signal cancelled

var title_label: Label
var body: VBoxContainer
var actions: HBoxContainer
var panel: PanelContainer


func _init(title: String, min_width: float = 420.0) -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP
	var dim: ColorRect = ColorRect.new()
	dim.color = Color(0, 0, 0, 0.6)
	dim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	dim.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(dim)
	var center: CenterContainer = CenterContainer.new()
	center.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	center.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(center)
	panel = PanelContainer.new()
	panel.custom_minimum_size = Vector2(min_width, 0)
	center.add_child(panel)
	var column: VBoxContainer = VBoxContainer.new()
	column.add_theme_constant_override("separation", 12)
	panel.add_child(column)
	title_label = Label.new()
	title_label.theme_type_variation = "TitleLabel"
	title_label.add_theme_font_size_override("font_size", 26)
	title_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	title_label.text = title
	column.add_child(title_label)
	body = VBoxContainer.new()
	body.add_theme_constant_override("separation", 10)
	column.add_child(body)
	actions = HBoxContainer.new()
	actions.alignment = BoxContainer.ALIGNMENT_CENTER
	actions.add_theme_constant_override("separation", 12)
	column.add_child(actions)


func add_action(text: String, variation: StringName = &"") -> Button:
	var button: Button = Button.new()
	button.text = text
	button.custom_minimum_size = Vector2(120, 40)
	if variation != &"":
		button.theme_type_variation = variation
	actions.add_child(button)
	return button


func add_cancel(text: String = "Cancel") -> Button:
	var button: Button = add_action(text)
	button.pressed.connect(func() -> void: cancelled.emit())
	return button
