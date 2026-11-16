class_name Team
extends RefCounted

var fighters: Array[Fighter] = []
var pool: ChakraPool = ChakraPool.new()


func _init(characters: Array[CharacterData]) -> void:
	for character: CharacterData in characters:
		fighters.append(Fighter.new(character))


func living_fighters() -> Array[Fighter]:
	var result: Array[Fighter] = []
	for fighter: Fighter in fighters:
		if fighter.is_alive():
			result.append(fighter)
	return result


func is_defeated() -> bool:
	return living_fighters().is_empty()


func owns(fighter: Fighter) -> bool:
	return fighters.has(fighter)
