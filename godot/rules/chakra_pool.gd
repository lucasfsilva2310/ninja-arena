class_name ChakraPool
extends RefCounted

const EXCHANGE_SIZE: int = 5

var chakras: Array[ChakraType.Type] = []


func add(type: ChakraType.Type) -> bool:
	if type == ChakraType.Type.RANDOM:
		return false
	chakras.append(type)
	return true


func remove(type: ChakraType.Type) -> bool:
	var index: int = chakras.find(type)
	if index == -1:
		return false
	chakras.remove_at(index)
	return true


func count(type: ChakraType.Type) -> int:
	return chakras.count(type)


func total() -> int:
	return chakras.size()


func can_pay(cost: Array[ChakraType.Type]) -> bool:
	var work: Array[ChakraType.Type] = chakras.duplicate()
	return _take_specific(work, cost) >= 0 and work.size() >= _random_slots(cost)


func pay(cost: Array[ChakraType.Type], random_payment: Array[ChakraType.Type]) -> bool:
	var work: Array[ChakraType.Type] = chakras.duplicate()
	if _take_specific(work, cost) < 0:
		return false
	if random_payment.size() != _random_slots(cost):
		return false
	for type: ChakraType.Type in random_payment:
		if type == ChakraType.Type.RANDOM:
			return false
		var index: int = work.find(type)
		if index == -1:
			return false
		work.remove_at(index)
	chakras = work
	return true


func exchange(five_chakras: Array[ChakraType.Type], target: ChakraType.Type) -> bool:
	if five_chakras.size() != EXCHANGE_SIZE or target == ChakraType.Type.RANDOM:
		return false
	var work: Array[ChakraType.Type] = chakras.duplicate()
	for type: ChakraType.Type in five_chakras:
		var index: int = work.find(type)
		if type == ChakraType.Type.RANDOM or index == -1:
			return false
		work.remove_at(index)
	work.append(target)
	chakras = work
	return true


static func _random_slots(cost: Array[ChakraType.Type]) -> int:
	return cost.count(ChakraType.Type.RANDOM)


static func _take_specific(work: Array[ChakraType.Type], cost: Array[ChakraType.Type]) -> int:
	for type: ChakraType.Type in cost:
		if type == ChakraType.Type.RANDOM:
			continue
		var index: int = work.find(type)
		if index == -1:
			return -1
		work.remove_at(index)
	return 0
