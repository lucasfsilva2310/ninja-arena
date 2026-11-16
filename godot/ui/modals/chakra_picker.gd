class_name ChakraPicker
extends VBoxContainer

signal changed

var limit: int = 5
var selected: Array[ChakraType.Type] = []
var remaining: Dictionary = {}
var count_labels: Dictionary = {}
var add_buttons: Dictionary = {}
var remove_buttons: Dictionary = {}
var total_label: Label
var selected_row: HBoxContainer


func _init(available: Array[ChakraType.Type], pick_limit: int) -> void:
	limit = pick_limit
	add_theme_constant_override("separation", 8)
	var options: HBoxContainer = HBoxContainer.new()
	options.alignment = BoxContainer.ALIGNMENT_CENTER
	options.add_theme_constant_override("separation", 14)
	add_child(options)
	for type: ChakraType.Type in ChakraType.real_types():
		remaining[type] = available.count(type)
		options.add_child(_build_cell(type))
	var title: Label = Label.new()
	title.text = "Selected chakras"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	add_child(title)
	selected_row = HBoxContainer.new()
	selected_row.alignment = BoxContainer.ALIGNMENT_CENTER
	selected_row.custom_minimum_size = Vector2(0, 36)
	selected_row.add_theme_constant_override("separation", 4)
	add_child(selected_row)
	total_label = Label.new()
	total_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	add_child(total_label)
	_refresh()


func add_chakra(type: ChakraType.Type) -> bool:
	if selected.size() >= limit or remaining.get(type, 0) <= 0:
		return false
	selected.append(type)
	remaining[type] -= 1
	_refresh()
	changed.emit()
	return true


func remove_chakra(type: ChakraType.Type) -> bool:
	var index: int = selected.rfind(type)
	if index == -1:
		return false
	selected.remove_at(index)
	remaining[type] += 1
	_refresh()
	changed.emit()
	return true


func is_full() -> bool:
	return selected.size() == limit


func _build_cell(type: ChakraType.Type) -> Control:
	var cell: PanelContainer = PanelContainer.new()
	var column: VBoxContainer = VBoxContainer.new()
	column.add_theme_constant_override("separation", 4)
	cell.add_child(column)
	var icon: TextureRect = TextureRect.new()
	icon.texture = Art.chakra_icon(type)
	icon.custom_minimum_size = Vector2(44, 44)
	icon.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	icon.tooltip_text = ChakraType.type_name(type)
	column.add_child(icon)
	var count: Label = Label.new()
	count.theme_type_variation = "TitleLabel"
	count.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	column.add_child(count)
	count_labels[type] = count
	var buttons: HBoxContainer = HBoxContainer.new()
	buttons.alignment = BoxContainer.ALIGNMENT_CENTER
	column.add_child(buttons)
	var plus: Button = Button.new()
	plus.text = "+"
	plus.custom_minimum_size = Vector2(34, 34)
	plus.pressed.connect(add_chakra.bind(type))
	buttons.add_child(plus)
	add_buttons[type] = plus
	var minus: Button = Button.new()
	minus.text = "-"
	minus.custom_minimum_size = Vector2(34, 34)
	minus.pressed.connect(remove_chakra.bind(type))
	buttons.add_child(minus)
	remove_buttons[type] = minus
	return cell


func _refresh() -> void:
	for type: ChakraType.Type in ChakraType.real_types():
		(count_labels[type] as Label).text = str(remaining[type])
		(add_buttons[type] as Button).disabled = remaining[type] <= 0 or selected.size() >= limit
		(remove_buttons[type] as Button).disabled = not selected.has(type)
	for child: Node in selected_row.get_children():
		selected_row.remove_child(child)
		child.queue_free()
	for type: ChakraType.Type in selected:
		var icon: TextureRect = TextureRect.new()
		icon.texture = Art.chakra_icon(type)
		icon.custom_minimum_size = Vector2(32, 32)
		icon.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		selected_row.add_child(icon)
	total_label.text = "Total selected: %d/%d" % [selected.size(), limit]
