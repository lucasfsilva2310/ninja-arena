class_name HistoryModal
extends ModalBase

var scroll: ScrollContainer
var entries: VBoxContainer
var close_button: Button


func _init(lines: Array[String]) -> void:
	super._init("Battle history", 560.0)
	scroll = ScrollContainer.new()
	scroll.custom_minimum_size = Vector2(0, 360)
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	body.add_child(scroll)
	entries = VBoxContainer.new()
	entries.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	entries.add_theme_constant_override("separation", 2)
	scroll.add_child(entries)
	if lines.is_empty():
		entries.add_child(_line("No battle history yet."))
	for text: String in lines:
		entries.add_child(_line(text))
	close_button = add_cancel("Close")


func _ready() -> void:
	await get_tree().process_frame
	if is_inside_tree():
		scroll.scroll_vertical = int(scroll.get_v_scroll_bar().max_value)


func _line(text: String) -> Label:
	var label: Label = Label.new()
	label.text = text
	label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	return label
