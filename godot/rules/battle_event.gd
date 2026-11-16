class_name BattleEvent
extends RefCounted

enum Type {
	TURN_STARTED,
	CHAKRA_GAINED,
	ABILITY_USED,
	DAMAGE,
	HEAL,
	REDUCTION_ADDED,
	REDUCTION_EXPIRED,
	FIGHTER_DIED,
	BATTLE_ENDED,
	REJECTED,
}

var type: Type
var source: Fighter
var target: Fighter
var amount: int = 0
var text: String = ""


func _init(event_type: Type, event_source: Fighter = null, event_target: Fighter = null, event_amount: int = 0, event_text: String = "") -> void:
	type = event_type
	source = event_source
	target = event_target
	amount = event_amount
	text = event_text
