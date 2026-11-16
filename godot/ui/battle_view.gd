class_name BattleView
extends Control

const TURN_SECONDS: int = 60
const HINT_TEXT: String = "Hover an ability to read its description."

var battle: Battle
var player_team: int = 0
var background_name: String = ""
var panels: Dictionary = {}
var sprites: Dictionary = {}
var chakra_labels: Dictionary = {}

var _built: bool = false

@onready var background: TextureRect = %Background
@onready var player_avatar: TextureRect = %PlayerAvatar
@onready var enemy_avatar: TextureRect = %EnemyAvatar
@onready var turn_label: Label = %TurnLabel
@onready var timer_label: Label = %TimerLabel
@onready var player_board: VBoxContainer = %PlayerBoard
@onready var enemy_board: VBoxContainer = %EnemyBoard
@onready var chakra_row: HBoxContainer = %ChakraRow
@onready var chakra_total: Label = %ChakraTotal
@onready var exchange_button: Button = %ExchangeButton
@onready var arena_player: VBoxContainer = %ArenaPlayer
@onready var arena_enemy: VBoxContainer = %ArenaEnemy
@onready var end_turn_button: Button = %EndTurnButton
@onready var surrender_button: Button = %SurrenderButton
@onready var history_button: Button = %HistoryButton
@onready var example_button: Button = %ExampleButton
@onready var desc_icon: TextureRect = %DescIcon
@onready var desc_name: Label = %DescName
@onready var desc_costs: CostRow = %DescCosts
@onready var desc_meta: Label = %DescMeta
@onready var desc_text: Label = %DescText


func bind(new_battle: Battle, team_idx: int = 0) -> void:
	_disconnect_battle()
	battle = new_battle
	player_team = team_idx
	battle.hp_changed.connect(_on_hp_changed)
	battle.fighter_died.connect(_on_fighter_died)
	battle.chakra_changed.connect(_on_chakra_changed)
	battle.turn_started.connect(_on_turn_started)
	if is_node_ready():
		_build()


func _ready() -> void:
	theme = GameTheme.get_theme()
	if battle == null:
		bind(MatchFactory.new_match(MatchFactory.default_team(), 1))
	else:
		_build()


func lock_reason(fighter: Fighter, state: AbilityState) -> String:
	if not fighter.is_alive():
		return "Down"
	if fighter.is_stunned():
		return "Stunned"
	if not state.is_ready():
		return "Cooldown: %d" % state.cooldown
	if not fighter.can_use_ability(state.data):
		return "Not available yet"
	if not battle.teams[player_team].pool.can_pay(state.data.cost):
		return "Not enough chakra"
	return ""


func show_ability(state: AbilityState) -> void:
	var data: AbilityData = state.data
	desc_icon.texture = Art.ability_icon(data.display_name)
	desc_name.text = data.display_name
	desc_costs.show_cost(data.cost, 18)
	desc_meta.text = "Cooldown: %d    Target: %s" % [data.cooldown, _target_text(data.target_type)]
	desc_text.text = data.description


func refresh_all() -> void:
	if not _built:
		return
	turn_label.text = "Turn %d" % battle.turn
	timer_label.text = "%02d" % TURN_SECONDS
	for fighter: Fighter in panels:
		_refresh_fighter(fighter)
	_refresh_chakra()


func _build() -> void:
	if _built:
		_clear()
	_built = true
	if background_name == "":
		var picker: RandomNumberGenerator = RandomNumberGenerator.new()
		picker.randomize()
		background_name = Art.BATTLE_BACKGROUNDS[picker.randi_range(0, Art.BATTLE_BACKGROUNDS.size() - 1)]
	background.texture = Art.battle_background(background_name)
	player_avatar.texture = Art.default_avatar()
	enemy_avatar.texture = Art.default_avatar()
	end_turn_button.disabled = true
	exchange_button.disabled = true
	surrender_button.disabled = true
	history_button.disabled = true
	example_button.disabled = true
	_build_chakra_row()
	_build_team(player_team, false, player_board, arena_player)
	_build_team(1 - player_team, true, enemy_board, arena_enemy)
	_reset_description()
	refresh_all()


func _build_team(team_idx: int, enemy: bool, board: VBoxContainer, arena: VBoxContainer) -> void:
	for fighter: Fighter in battle.teams[team_idx].fighters:
		var panel: FighterPanel = FighterPanel.new(fighter, enemy)
		panel.ability_hovered.connect(show_ability)
		board.add_child(panel)
		panels[fighter] = panel
		var sprite: PlaceholderSprite = PlaceholderSprite.new(fighter)
		arena.add_child(sprite)
		sprites[fighter] = sprite


func _build_chakra_row() -> void:
	for type: ChakraType.Type in ChakraType.real_types():
		var cell: HBoxContainer = HBoxContainer.new()
		cell.add_theme_constant_override("separation", 4)
		var icon: TextureRect = TextureRect.new()
		icon.texture = Art.chakra_icon(type)
		icon.custom_minimum_size = Vector2(28, 28)
		icon.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		icon.tooltip_text = ChakraType.type_name(type)
		cell.add_child(icon)
		var count: Label = Label.new()
		count.theme_type_variation = "TitleLabel"
		cell.add_child(count)
		chakra_row.add_child(cell)
		chakra_labels[type] = count


func _clear() -> void:
	for node: Node in [player_board, enemy_board, arena_player, arena_enemy, chakra_row]:
		for child: Node in node.get_children():
			node.remove_child(child)
			child.queue_free()
	panels.clear()
	sprites.clear()
	chakra_labels.clear()


func _reset_description() -> void:
	desc_icon.texture = null
	desc_name.text = ""
	desc_costs.show_cost([])
	desc_meta.text = ""
	desc_text.text = HINT_TEXT


func _refresh_fighter(fighter: Fighter) -> void:
	var panel: FighterPanel = panels[fighter]
	panel.refresh(lock_reason)
	var sprite: PlaceholderSprite = sprites[fighter]
	sprite.refresh()


func _refresh_chakra() -> void:
	var pool: ChakraPool = battle.teams[player_team].pool
	for type: ChakraType.Type in chakra_labels:
		var label: Label = chakra_labels[type]
		label.text = "x%d" % pool.count(type)
	chakra_total.text = "Total: %d" % pool.total()


func _disconnect_battle() -> void:
	if battle == null:
		return
	battle.hp_changed.disconnect(_on_hp_changed)
	battle.fighter_died.disconnect(_on_fighter_died)
	battle.chakra_changed.disconnect(_on_chakra_changed)
	battle.turn_started.disconnect(_on_turn_started)


func _on_hp_changed(fighter: Fighter, _old_hp: int, _new_hp: int) -> void:
	if _built and panels.has(fighter):
		_refresh_fighter(fighter)


func _on_fighter_died(fighter: Fighter) -> void:
	if _built and panels.has(fighter):
		_refresh_fighter(fighter)


func _on_chakra_changed(_team_idx: int) -> void:
	if not _built:
		return
	_refresh_chakra()
	for fighter: Fighter in battle.teams[player_team].fighters:
		_refresh_fighter(fighter)


func _on_turn_started(_team_idx: int, _turn: int) -> void:
	refresh_all()


static func _target_text(target: AbilityData.Target) -> String:
	match target:
		AbilityData.Target.ENEMY:
			return "One enemy"
		AbilityData.Target.ALLY:
			return "One ally"
		AbilityData.Target.SELF:
			return "Self"
		AbilityData.Target.ALL_ENEMIES:
			return "All enemies"
		_:
			return "All allies"
