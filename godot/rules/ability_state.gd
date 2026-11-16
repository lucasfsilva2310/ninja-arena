class_name AbilityState
extends RefCounted

var data: AbilityData
var cooldown: int = 0


func _init(ability_data: AbilityData) -> void:
	data = ability_data


func is_ready() -> bool:
	return cooldown == 0


func start_cooldown() -> void:
	if cooldown == 0:
		cooldown = data.cooldown + 1


func tick() -> void:
	if cooldown > 0:
		cooldown -= 1
