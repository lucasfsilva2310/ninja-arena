class_name CharacterSelect
extends Control

signal team_chosen(team: Array[CharacterData])

const TEAM_SIZE: int = 3

var selected: Array[CharacterData] = []
var previewed: CharacterData
var cards: Array[CharacterCard] = []
var slot_panels: Array[PanelContainer] = []
var ability_buttons: Array[Button] = []

@onready var background: TextureRect = %Background
@onready var slots_row: HBoxContainer = %SlotsRow
@onready var start_button: Button = %StartButton
@onready var cards_grid: HFlowContainer = %CardsGrid
@onready var preview_name: Label = %PreviewName
@onready var abilities_row: HBoxContainer = %AbilitiesRow
@onready var desc_name: Label = %DescName
@onready var desc_costs: CostRow = %DescCosts
@onready var desc_meta: Label = %DescMeta
@onready var desc_text: Label = %DescText


func _ready() -> void:
	theme = GameTheme.get_theme()
	background.texture = Art.selection_background()
	for i: int in TEAM_SIZE:
		var slot: PanelContainer = PanelContainer.new()
		slot.custom_minimum_size = Vector2(76, 76)
		slot.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
		slot.gui_input.connect(_on_slot_input.bind(i))
		slots_row.add_child(slot)
		slot_panels.append(slot)
	for character: CharacterData in Content.characters():
		var card: CharacterCard = CharacterCard.new(character)
		card.clicked.connect(toggle_character)
		card.hovered.connect(preview)
		cards_grid.add_child(card)
		cards.append(card)
	start_button.pressed.connect(start)
	_reset_preview()
	_refresh()


func toggle_character(character: CharacterData) -> void:
	preview(character)
	if selected.has(character):
		selected.erase(character)
	elif selected.size() < TEAM_SIZE:
		selected.append(character)
	_refresh()


func remove_slot(index: int) -> void:
	if index < 0 or index >= selected.size():
		return
	selected.remove_at(index)
	_refresh()


func can_start() -> bool:
	return selected.size() == TEAM_SIZE


func start() -> void:
	if not can_start():
		return
	var team: Array[CharacterData] = selected.duplicate()
	team_chosen.emit(team)


func preview(character: CharacterData) -> void:
	previewed = character
	preview_name.text = character.display_name
	for child: Node in abilities_row.get_children():
		abilities_row.remove_child(child)
		child.queue_free()
	ability_buttons.clear()
	for ability: AbilityData in character.abilities:
		var button: Button = Button.new()
		button.theme_type_variation = "AbilityButton"
		button.custom_minimum_size = Vector2(56, 56)
		button.expand_icon = true
		button.icon = Art.ability_icon(ability.display_name)
		button.tooltip_text = ability.display_name
		button.mouse_entered.connect(show_ability.bind(ability))
		button.pressed.connect(show_ability.bind(ability))
		abilities_row.add_child(button)
		ability_buttons.append(button)
	show_ability(character.abilities[0])


func show_ability(ability: AbilityData) -> void:
	desc_name.text = ability.display_name
	desc_costs.show_cost(ability.cost, 18)
	desc_meta.text = "Cooldown: %d" % ability.cooldown
	desc_text.text = ability.description


func _reset_preview() -> void:
	previewed = null
	preview_name.text = ""
	desc_name.text = ""
	desc_costs.show_cost([])
	desc_meta.text = ""
	desc_text.text = "Hover or click a character to see its abilities."


func _refresh() -> void:
	for i: int in TEAM_SIZE:
		var slot: PanelContainer = slot_panels[i]
		for child: Node in slot.get_children():
			slot.remove_child(child)
			child.queue_free()
		if i < selected.size():
			slot.add_theme_stylebox_override("panel", GameTheme.box(Color(0.94, 0.97, 1.0, 0.95), GameTheme.SELECTED, 3, 8, 3))
			var portrait: TextureRect = TextureRect.new()
			portrait.texture = Art.avatar(selected[i].display_name)
			portrait.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
			portrait.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
			portrait.mouse_filter = Control.MOUSE_FILTER_IGNORE
			slot.add_child(portrait)
			slot.tooltip_text = "%s (click to remove)" % selected[i].display_name
		else:
			slot.add_theme_stylebox_override("panel", GameTheme.box(Color(0.97, 0.98, 0.99, 0.8), Color("94a3b8"), 2, 8, 3))
			var mark: Label = Label.new()
			mark.text = "?"
			mark.theme_type_variation = "TitleLabel"
			mark.add_theme_font_size_override("font_size", 28)
			mark.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
			mark.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
			mark.mouse_filter = Control.MOUSE_FILTER_IGNORE
			slot.add_child(mark)
			slot.tooltip_text = ""
	for card: CharacterCard in cards:
		card.picked = selected.has(card.character)
	start_button.disabled = not can_start()


func _on_slot_input(event: InputEvent, index: int) -> void:
	var press: InputEventMouseButton = event as InputEventMouseButton
	if press != null and press.pressed and press.button_index == MOUSE_BUTTON_LEFT:
		remove_slot(index)
