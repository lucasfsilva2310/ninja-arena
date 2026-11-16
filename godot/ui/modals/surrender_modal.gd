class_name SurrenderModal
extends ModalBase

signal confirmed

var yes_button: Button
var no_button: Button


func _init() -> void:
	super._init("Are you sure?", 400.0)
	var text: Label = Label.new()
	text.text = "Do you really want to surrender this battle?"
	text.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	body.add_child(text)
	yes_button = add_action("Yes", &"EndTurnButton")
	yes_button.pressed.connect(func() -> void: confirmed.emit())
	no_button = add_cancel("No")
