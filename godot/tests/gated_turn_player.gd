extends TurnPlayer

signal release_impact


func _impact(_used: BattleEvent, _targets: Array[Fighter]) -> void:
	await release_impact
