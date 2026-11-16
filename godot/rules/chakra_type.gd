class_name ChakraType
extends RefCounted

enum Type { NINJUTSU, TAIJUTSU, GENJUTSU, BLOODLINE, RANDOM }

const NAMES: Dictionary = {
	Type.NINJUTSU: "Ninjutsu",
	Type.TAIJUTSU: "Taijutsu",
	Type.GENJUTSU: "Genjutsu",
	Type.BLOODLINE: "Bloodline",
	Type.RANDOM: "Random",
}


static func real_types() -> Array[Type]:
	var result: Array[Type] = [Type.NINJUTSU, Type.TAIJUTSU, Type.GENJUTSU, Type.BLOODLINE]
	return result


static func type_name(type: Type) -> String:
	return NAMES[type]


static func parse(type_text: String) -> int:
	var wanted: String = type_text.strip_edges().to_lower()
	for type: Type in NAMES:
		if String(NAMES[type]).to_lower() == wanted:
			return type
	return -1
