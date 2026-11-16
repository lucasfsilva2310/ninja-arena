class_name TurnPlayer
extends RefCounted

signal event_played(event: BattleEvent)
signal finished

var playing: bool = false


func play(events: Array[BattleEvent]) -> void:
	playing = true
	for event: BattleEvent in events:
		event_played.emit(event)
	playing = false
	finished.emit()
