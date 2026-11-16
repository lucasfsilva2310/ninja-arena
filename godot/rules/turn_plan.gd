class_name TurnPlan
extends RefCounted

var actions: Array[Action] = []
var random_payment: Array[ChakraType.Type] = []


func is_empty() -> bool:
	return actions.is_empty()
