class_name PlaceholderSprite
extends PanelContainer

var fighter: Fighter
var name_label: Label


func _init(new_fighter: Fighter) -> void:
	fighter = new_fighter
	size_flags_horizontal = Control.SIZE_EXPAND_FILL
	size_flags_vertical = Control.SIZE_EXPAND_FILL
	custom_minimum_size = Vector2(70, 50)
	name_label = Label.new()
	name_label.theme_type_variation = "LightLabel"
	name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	name_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	name_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	add_child(name_label)
	refresh()


func refresh() -> void:
	var alive: bool = fighter.is_alive()
	var fill: Color = Art.placeholder_color(fighter.display_name()) if alive else Color("475569")
	add_theme_stylebox_override("panel", GameTheme.box(fill, Color(0, 0, 0, 0.6), 2, 6, 4))
	name_label.text = fighter.display_name() if alive else "%s (down)" % fighter.display_name()
