extends TurnPlayer

var held: Array[Array] = []


func play(events: Array[BattleEvent]) -> void:
	playing = true
	held.append(events)


func release() -> void:
	var events: Array[BattleEvent] = []
	events.assign(held.pop_front())
	for event: BattleEvent in events:
		event_played.emit(event)
	playing = false
	finished.emit()
