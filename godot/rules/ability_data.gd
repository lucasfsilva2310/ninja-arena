class_name AbilityData
extends Resource

enum Target { ENEMY, ALLY, SELF, ALL_ENEMIES, ALL_ALLIES }

@export var display_name: String = ""
@export_multiline var description: String = ""
@export var cost: Array[ChakraType.Type] = []
@export var cooldown: int = 0
@export var target_type: Target = Target.ENEMY
@export var effects: Array[EffectData] = []
@export var stacking: bool = false


func has_effect(kind: EffectData.Kind) -> bool:
	for effect: EffectData in effects:
		if effect.kind == kind:
			return true
	return false
