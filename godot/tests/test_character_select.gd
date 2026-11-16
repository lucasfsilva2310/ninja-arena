extends "res://tools/test_case.gd"

const Helpers: GDScript = preload("res://tests/ui_helpers.gd")


func _character(screen: CharacterSelect, character_name: String) -> CharacterData:
	for card: CharacterCard in screen.cards:
		if card.character.display_name == character_name:
			return card.character
	return null


func test_select_shows_the_four_characters_from_content() -> void:
	var screen: CharacterSelect = Helpers.mount("res://ui/character_select.tscn") as CharacterSelect
	assert_eq(screen.cards.size(), 4)
	var names: Array[String] = []
	for card: CharacterCard in screen.cards:
		names.append(card.character.display_name)
	assert_eq(names, ["Naruto", "Sasuke", "Sakura", "Rock Lee"] as Array[String])
	Helpers.unmount(screen)


func test_start_button_is_disabled_below_three_picks() -> void:
	var screen: CharacterSelect = Helpers.mount("res://ui/character_select.tscn") as CharacterSelect
	assert_true(screen.start_button.disabled)
	screen.toggle_character(_character(screen, "Naruto"))
	assert_true(screen.start_button.disabled)
	screen.toggle_character(_character(screen, "Sasuke"))
	assert_true(screen.start_button.disabled)
	screen.toggle_character(_character(screen, "Sakura"))
	assert_false(screen.start_button.disabled)
	Helpers.unmount(screen)


func test_fourth_pick_does_nothing() -> void:
	var screen: CharacterSelect = Helpers.mount("res://ui/character_select.tscn") as CharacterSelect
	for character_name: String in ["Naruto", "Sasuke", "Sakura", "Rock Lee"]:
		screen.toggle_character(_character(screen, character_name))
	assert_eq(screen.selected.size(), 3)
	assert_false(screen.selected.has(_character(screen, "Rock Lee")))
	assert_false(screen.start_button.disabled)
	for card: CharacterCard in screen.cards:
		assert_eq(card.picked, card.character.display_name != "Rock Lee")
	Helpers.unmount(screen)


func test_picking_a_picked_character_removes_it() -> void:
	var screen: CharacterSelect = Helpers.mount("res://ui/character_select.tscn") as CharacterSelect
	screen.toggle_character(_character(screen, "Naruto"))
	screen.toggle_character(_character(screen, "Naruto"))
	assert_eq(screen.selected.size(), 0)
	Helpers.unmount(screen)


func test_removing_a_slot_after_three_picks_disables_start_and_frees_a_pick() -> void:
	var screen: CharacterSelect = Helpers.mount("res://ui/character_select.tscn") as CharacterSelect
	for character_name: String in ["Naruto", "Sasuke", "Sakura"]:
		screen.toggle_character(_character(screen, character_name))
	screen.remove_slot(1)
	assert_true(screen.start_button.disabled)
	assert_eq(screen.selected.size(), 2)
	screen.toggle_character(_character(screen, "Rock Lee"))
	assert_false(screen.start_button.disabled)
	screen.remove_slot(7)
	assert_eq(screen.selected.size(), 3)
	Helpers.unmount(screen)


func test_start_emits_the_chosen_team_only_at_three() -> void:
	var screen: CharacterSelect = Helpers.mount("res://ui/character_select.tscn") as CharacterSelect
	var received: Array = []
	screen.team_chosen.connect(func(team: Array[CharacterData]) -> void: received.append(team))
	screen.toggle_character(_character(screen, "Naruto"))
	screen.start()
	assert_eq(received.size(), 0)
	screen.toggle_character(_character(screen, "Sakura"))
	screen.toggle_character(_character(screen, "Rock Lee"))
	screen.start()
	assert_eq(received.size(), 1)
	var team: Array[CharacterData] = received[0]
	assert_eq(team.size(), 3)
	assert_eq(team[2].display_name, "Rock Lee")
	Helpers.unmount(screen)


func test_pressing_the_start_button_emits_team_chosen() -> void:
	var screen: CharacterSelect = Helpers.mount("res://ui/character_select.tscn") as CharacterSelect
	var count: Array[int] = [0]
	screen.team_chosen.connect(func(_team: Array[CharacterData]) -> void: count[0] += 1)
	for character_name: String in ["Naruto", "Sasuke", "Sakura"]:
		screen.toggle_character(_character(screen, character_name))
	screen.start_button.pressed.emit()
	assert_eq(count[0], 1)
	Helpers.unmount(screen)


func test_preview_shows_four_abilities_and_the_description() -> void:
	var screen: CharacterSelect = Helpers.mount("res://ui/character_select.tscn") as CharacterSelect
	var naruto: CharacterData = _character(screen, "Naruto")
	screen.preview(naruto)
	assert_eq(screen.preview_name.text, "Naruto")
	assert_eq(screen.ability_buttons.size(), 4)
	assert_eq(screen.desc_name.text, naruto.abilities[0].display_name)
	assert_eq(screen.desc_text.text, naruto.abilities[0].description)
	screen.ability_buttons[2].mouse_entered.emit()
	assert_eq(screen.desc_name.text, naruto.abilities[2].display_name)
	assert_eq(screen.desc_costs.get_child_count(), naruto.abilities[2].cost.size())
	assert_eq(screen.desc_meta.text, "Cooldown: %d" % naruto.abilities[2].cooldown)
	Helpers.unmount(screen)


func test_hovering_a_card_previews_without_picking() -> void:
	var screen: CharacterSelect = Helpers.mount("res://ui/character_select.tscn") as CharacterSelect
	screen.cards[1].mouse_entered.emit()
	assert_eq(screen.previewed.display_name, "Sasuke")
	assert_eq(screen.selected.size(), 0)
	Helpers.unmount(screen)


func test_clicking_a_card_picks_and_previews() -> void:
	var screen: CharacterSelect = Helpers.mount("res://ui/character_select.tscn") as CharacterSelect
	var click: InputEventMouseButton = InputEventMouseButton.new()
	click.button_index = MOUSE_BUTTON_LEFT
	click.pressed = true
	screen.cards[2]._gui_input(click)
	assert_eq(screen.selected.size(), 1)
	assert_eq(screen.selected[0].display_name, "Sakura")
	assert_eq(screen.previewed.display_name, "Sakura")
	Helpers.unmount(screen)


func test_slots_show_question_marks_until_filled() -> void:
	var screen: CharacterSelect = Helpers.mount("res://ui/character_select.tscn") as CharacterSelect
	assert_eq(screen.slot_panels.size(), 3)
	assert_true(screen.slot_panels[0].get_child(0) is Label)
	screen.toggle_character(_character(screen, "Naruto"))
	assert_true(screen.slot_panels[0].get_child(0) is TextureRect)
	assert_true(screen.slot_panels[1].get_child(0) is Label)
	Helpers.unmount(screen)
