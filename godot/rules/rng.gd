class_name Rng
extends RefCounted

var _generator: RandomNumberGenerator = RandomNumberGenerator.new()


func _init(seed_value: int = 0) -> void:
	_generator.seed = seed_value


func int_range(low: int, high: int) -> int:
	return _generator.randi_range(low, high)


func pick(items: Array) -> Variant:
	if items.is_empty():
		return null
	return items[_generator.randi_range(0, items.size() - 1)]


func shuffle(items: Array) -> void:
	for i: int in range(items.size() - 1, 0, -1):
		var j: int = _generator.randi_range(0, i)
		var swap: Variant = items[i]
		items[i] = items[j]
		items[j] = swap
