class_name TurnPlayer
extends RefCounted

signal event_played(event: BattleEvent)
signal phase_started(phase: String, used: BattleEvent)
signal finished

const PHASE_ATTACK: String = "attack"
const PHASE_IMPACT: String = "impact"
const PHASE_RECOVERY: String = "recovery"

var playing: bool = false


func play(events: Array[BattleEvent]) -> void:
	playing = true
	var index: int = 0
	while index < events.size():
		var event: BattleEvent = events[index]
		index += 1
		if event.type != BattleEvent.Type.ABILITY_USED:
			event_played.emit(event)
			continue
		var group: Array[BattleEvent] = []
		while index < events.size() and _belongs_to_action(events[index]):
			group.append(events[index])
			index += 1
		await _play_action(event, group)
	playing = false
	finished.emit()


func _play_action(used: BattleEvent, group: Array[BattleEvent]) -> void:
	event_played.emit(used)
	var damaged: Array[Fighter] = _damaged_targets(group)
	phase_started.emit(PHASE_ATTACK, used)
	await _attack(used, group)
	if not damaged.is_empty() and _requires_impact(used):
		phase_started.emit(PHASE_IMPACT, used)
		await _impact(used, damaged)
	for event: BattleEvent in group:
		event_played.emit(event)
	if not damaged.is_empty() and _requires_impact(used):
		phase_started.emit(PHASE_RECOVERY, used)
		await _recovery(used, damaged)


func _belongs_to_action(event: BattleEvent) -> bool:
	match event.type:
		BattleEvent.Type.DAMAGE, BattleEvent.Type.HEAL, BattleEvent.Type.REDUCTION_ADDED, BattleEvent.Type.EFFECT_ADDED, BattleEvent.Type.FIGHTER_DIED:
			return true
		_:
			return false


func _damaged_targets(group: Array[BattleEvent]) -> Array[Fighter]:
	var result: Array[Fighter] = []
	for event: BattleEvent in group:
		if event.type == BattleEvent.Type.DAMAGE and event.amount > 0 and event.target != null and not result.has(event.target):
			result.append(event.target)
	return result


func _requires_impact(_used: BattleEvent) -> bool:
	return true


func _attack(_used: BattleEvent, _group: Array[BattleEvent]) -> void:
	pass


func _impact(_used: BattleEvent, _targets: Array[Fighter]) -> void:
	pass


func _recovery(_used: BattleEvent, _targets: Array[Fighter]) -> void:
	pass
