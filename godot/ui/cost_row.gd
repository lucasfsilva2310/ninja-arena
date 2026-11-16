class_name CostRow
extends HBoxContainer

const ICON_SIZE: int = 14


func _init() -> void:
	alignment = BoxContainer.ALIGNMENT_CENTER
	add_theme_constant_override("separation", 2)


func show_cost(cost: Array[ChakraType.Type], icon_size: int = ICON_SIZE) -> void:
	for child: Node in get_children():
		remove_child(child)
		child.queue_free()
	for type: ChakraType.Type in cost:
		var icon: TextureRect = TextureRect.new()
		icon.texture = Art.chakra_icon(type)
		icon.custom_minimum_size = Vector2(icon_size, icon_size)
		icon.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		icon.tooltip_text = ChakraType.type_name(type)
		add_child(icon)
