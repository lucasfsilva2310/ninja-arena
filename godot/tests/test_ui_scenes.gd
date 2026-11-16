extends "res://tools/test_case.gd"

const Helpers: GDScript = preload("res://tests/ui_helpers.gd")

const BATTLE_NODES: Array[String] = [
	"Background", "PlayerAvatar", "EnemyAvatar", "TurnLabel", "TimerLabel", "PlayerBoard", "EnemyBoard",
	"ChakraRow", "ChakraTotal", "ExchangeButton", "ArenaPlayer", "ArenaEnemy", "EndTurnButton",
	"SurrenderButton", "HistoryButton", "SpeedButton", "DescIcon", "DescName", "DescCosts", "DescMeta", "DescText",
]

const SELECT_NODES: Array[String] = [
	"Background", "SlotsRow", "StartButton", "CardsGrid", "PreviewName", "AbilitiesRow",
	"DescName", "DescCosts", "DescMeta", "DescText",
]


func test_app_scene_loads_and_is_the_main_scene() -> void:
	var packed: PackedScene = load("res://ui/app.tscn") as PackedScene
	assert_true(packed != null)
	assert_eq(str(ProjectSettings.get_setting("application/run/main_scene")), "res://ui/app.tscn")
	assert_true(ProjectSettings.has_setting("autoload/SceneRouter"))


func test_character_select_scene_has_every_node_the_script_uses() -> void:
	var screen: Node = Helpers.mount("res://ui/character_select.tscn")
	for node_name: String in SELECT_NODES:
		assert_true(screen.get_node_or_null("%" + node_name) != null)
	Helpers.unmount(screen)


func test_battle_scene_has_every_node_the_script_uses() -> void:
	var screen: Node = Helpers.mount("res://ui/battle.tscn")
	for node_name: String in BATTLE_NODES:
		assert_true(screen.get_node_or_null("%" + node_name) != null)
	Helpers.unmount(screen)


func test_battle_scene_without_a_bound_battle_builds_a_default_match() -> void:
	var view: BattleView = Helpers.mount("res://ui/battle.tscn") as BattleView
	assert_eq(view.panels.size(), 6)
	Helpers.unmount(view)


func test_battle_scene_instantiates_without_a_tree_error() -> void:
	var view: Node = (load("res://ui/battle.tscn") as PackedScene).instantiate()
	assert_true(view is BattleView)
	view.free()


func test_assets_resolve_for_every_character_and_ability() -> void:
	for character: CharacterData in Content.characters():
		assert_true(Art.avatar(character.display_name) != Art.default_avatar())
		for ability: AbilityData in character.abilities:
			assert_true(Art.ability_icon(ability.display_name) != null)
			assert_true(Art.ability_icon(ability.display_name) != Art.ability_icon("No Such Ability"))
	assert_true(Art.ability_icon("Hidden Lotus") != Art.ability_icon("No Such Ability"))
	for type: ChakraType.Type in ChakraType.Type.values():
		assert_true(Art.chakra_icon(type) != null)
	for background_name: String in Art.BATTLE_BACKGROUNDS:
		assert_true(Art.battle_background(background_name) != null)
	assert_true(Art.selection_background() != null)
	assert_true(Art.dead_avatar() != null)
