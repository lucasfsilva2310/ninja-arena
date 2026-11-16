class_name PaymentModal
extends ModalBase

signal confirmed(payment: Array[ChakraType.Type])

var picker: ChakraPicker
var slots: int = 0
var confirm_button: Button
var cancel_button: Button


func _init(candidates: Array[ChakraType.Type], random_slots: int) -> void:
	super._init("Pay %d Random chakra(s)" % random_slots, 520.0)
	slots = random_slots
	var hint: Label = Label.new()
	hint.text = "Choose which chakras pay the Random slots."
	hint.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	body.add_child(hint)
	picker = ChakraPicker.new(candidates, random_slots)
	picker.changed.connect(_refresh)
	body.add_child(picker)
	confirm_button = add_action("Confirm", &"StartButton")
	confirm_button.pressed.connect(confirm)
	cancel_button = add_cancel()
	_refresh()


func can_confirm() -> bool:
	return picker.selected.size() == slots


func confirm() -> void:
	if can_confirm():
		confirmed.emit(picker.selected.duplicate())


func _refresh() -> void:
	confirm_button.disabled = not can_confirm()
