extends RefCounted

const NINJUTSU: ChakraType.Type = ChakraType.Type.NINJUTSU
const TAIJUTSU: ChakraType.Type = ChakraType.Type.TAIJUTSU
const GENJUTSU: ChakraType.Type = ChakraType.Type.GENJUTSU
const BLOODLINE: ChakraType.Type = ChakraType.Type.BLOODLINE


static func tree_root() -> Window:
	return (Engine.get_main_loop() as SceneTree).root


static func mount(scene_path: String) -> Node:
	var scene: Node = (load(scene_path) as PackedScene).instantiate()
	tree_root().add_child(scene)
	return scene


static func unmount(node: Node) -> void:
	tree_root().remove_child(node)
	node.free()


static func team_of(names: Array) -> Array[CharacterData]:
	var result: Array[CharacterData] = []
	for character: CharacterData in Content.characters():
		if names.has(character.display_name):
			result.append(character)
	return result


static func real_battle(seed_value: int = 3) -> Battle:
	return MatchFactory.new_match(team_of(["Naruto", "Sasuke", "Sakura"]), seed_value)


static func mount_battle(match_battle: Battle) -> BattleView:
	var view: BattleView = (load("res://ui/battle.tscn") as PackedScene).instantiate() as BattleView
	view.background_name = "forest"
	view.bind(match_battle)
	tree_root().add_child(view)
	return view


static func find_state(fighter: Fighter, ability_name: String) -> AbilityState:
	for state: AbilityState in fighter.abilities:
		if state.data.display_name == ability_name:
			return state
	return null


static func payment(list: Array = []) -> Array[ChakraType.Type]:
	var result: Array[ChakraType.Type] = []
	for item: Variant in list:
		result.append(item)
	return result


static func actions(list: Array) -> Array[Action]:
	var result: Array[Action] = []
	for item: Variant in list:
		result.append(item)
	return result
