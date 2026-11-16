class_name ActiveEffect
extends RefCounted

var kind: EffectData.Kind = EffectData.Kind.DAMAGE_REDUCTION
var source_name: String = ""
var description: String = ""
var value: int = 0
var is_percent: bool = false
var invulnerable: bool = false
var remaining: int = 0
var ability_names: Array[String] = []
var original_state: AbilityState
var replacement_state: AbilityState


func turns_text() -> String:
	return "1 turn" if remaining == 1 else "%d turns" % remaining
