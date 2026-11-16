class_name ExchangeModal
extends ModalBase

signal confirmed(chakras: Array[ChakraType.Type], target: ChakraType.Type)

var picker: ChakraPicker
var target: int = -1
var target_buttons: Dictionary = {}
var message_label: Label
var confirm_button: Button
var cancel_button: Button
var check: Callable


func _init(available: Array[ChakraType.Type], exchange_check: Callable = Callable()) -> void:
	super._init("Exchange chakra", 520.0)
	check = exchange_check
	var hint: Label = Label.new()
	hint.text = "Pick exactly %d chakras to give up." % ChakraPool.EXCHANGE_SIZE
	hint.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	body.add_child(hint)
	picker = ChakraPicker.new(available, ChakraPool.EXCHANGE_SIZE)
	picker.changed.connect(_refresh)
	body.add_child(picker)
	var target_hint: Label = Label.new()
	target_hint.text = "Pick the chakra you receive."
	target_hint.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	body.add_child(target_hint)
	var targets: HBoxContainer = HBoxContainer.new()
	targets.alignment = BoxContainer.ALIGNMENT_CENTER
	targets.add_theme_constant_override("separation", 10)
	body.add_child(targets)
	for type: ChakraType.Type in ChakraType.real_types():
		var button: Button = Button.new()
		button.toggle_mode = true
		button.icon = Art.chakra_icon(type)
		button.expand_icon = true
		button.custom_minimum_size = Vector2(56, 56)
		button.tooltip_text = ChakraType.type_name(type)
		button.add_theme_stylebox_override("pressed", GameTheme.box(GameTheme.SELECTED, Color("1e3a8a"), 3, 8, 8))
		button.add_theme_stylebox_override("hover_pressed", GameTheme.box(GameTheme.SELECTED.lightened(0.15), Color("1e3a8a"), 3, 8, 8))
		button.pressed.connect(pick_target.bind(type))
		targets.add_child(button)
		target_buttons[type] = button
	message_label = Label.new()
	message_label.theme_type_variation = "SmallLabel"
	message_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	message_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	body.add_child(message_label)
	confirm_button = add_action("Transform", &"StartButton")
	confirm_button.pressed.connect(confirm)
	cancel_button = add_cancel()
	_refresh()


func pick_target(type: ChakraType.Type) -> void:
	target = type
	_refresh()


func can_confirm() -> bool:
	return picker.is_full() and target != -1 and _check_error() == ""


func confirm() -> void:
	if can_confirm():
		confirmed.emit(picker.selected.duplicate(), target as ChakraType.Type)


func _check_error() -> String:
	if not check.is_valid() or not picker.is_full() or target == -1:
		return ""
	return check.call(picker.selected, target as ChakraType.Type)


func _refresh() -> void:
	for type: ChakraType.Type in target_buttons:
		(target_buttons[type] as Button).set_pressed_no_signal(type == target)
	message_label.text = _check_error()
	confirm_button.disabled = not can_confirm()
