class_name Action
extends RefCounted

var source: Fighter
var ability: AbilityState
var target: Fighter


func _init(source_fighter: Fighter, ability_state: AbilityState, target_fighter: Fighter = null) -> void:
	source = source_fighter
	ability = ability_state
	target = target_fighter
