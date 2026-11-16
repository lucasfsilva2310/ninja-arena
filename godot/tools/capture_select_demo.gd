extends Control


func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	var screen: CharacterSelect = (load("res://ui/character_select.tscn") as PackedScene).instantiate() as CharacterSelect
	add_child(screen)
	for character: CharacterData in Content.characters():
		if character.display_name != "Sasuke":
			screen.toggle_character(character)
	screen.preview(Content.characters()[2])
	screen.show_ability(Content.characters()[2].abilities[1])
