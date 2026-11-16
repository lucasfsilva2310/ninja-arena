class_name Art
extends RefCounted

const ROOT: String = "res://assets/"
const CHARACTER_DIRS: Array[String] = ["naruto", "sasuke", "sakura", "rocklee"]
const BATTLE_BACKGROUNDS: Array[String] = ["akatsuki", "forest", "training", "waterfall"]

const CHAKRA_COLORS: Dictionary = {
	ChakraType.Type.NINJUTSU: Color("3b82f6"),
	ChakraType.Type.TAIJUTSU: Color("22c55e"),
	ChakraType.Type.GENJUTSU: Color("ffffff"),
	ChakraType.Type.BLOODLINE: Color("ef4444"),
	ChakraType.Type.RANDOM: Color("000000"),
}

const PLACEHOLDER_COLORS: Dictionary = {
	"Naruto": Color("e8892b"),
	"Sasuke": Color("3a4f9c"),
	"Sakura": Color("d9709a"),
	"Rock Lee": Color("3f9e5c"),
}


static func slug(display_name: String) -> String:
	return display_name.replace(" ", "").to_lower()


static func _load_texture(path: String) -> Texture2D:
	if not ResourceLoader.exists(path):
		return null
	return load(path) as Texture2D


static func default_avatar() -> Texture2D:
	return _load_texture(ROOT + "characters/default/avatar/default.png")


static func dead_avatar() -> Texture2D:
	return _load_texture(ROOT + "characters/default/avatar/dead.png")


static func avatar(character_name: String) -> Texture2D:
	var key: String = slug(character_name)
	var texture: Texture2D = _load_texture(ROOT + "characters/%s/avatar/%s.png" % [key, key])
	return texture if texture != null else default_avatar()


static func ability_icon(ability_name: String) -> Texture2D:
	var key: String = slug(ability_name)
	for dir: String in CHARACTER_DIRS:
		var texture: Texture2D = _load_texture(ROOT + "characters/%s/abilities/%s.png" % [dir, key])
		if texture != null:
			return texture
	return _load_texture(ROOT + "characters/default/abilities/default.png")


static func chakra_icon(type: ChakraType.Type) -> Texture2D:
	return _load_texture(ROOT + "chakras/chakra-%s.png" % ChakraType.type_name(type).to_lower())


static func chakra_color(type: ChakraType.Type) -> Color:
	return CHAKRA_COLORS[type]


static func placeholder_color(character_name: String) -> Color:
	return PLACEHOLDER_COLORS.get(character_name, Color("777777"))


static func battle_background(background_name: String) -> Texture2D:
	return _load_texture(ROOT + "backgrounds/battle/%s.png" % background_name)


static func selection_background() -> Texture2D:
	return _load_texture(ROOT + "backgrounds/character-selection/itachi.png")
