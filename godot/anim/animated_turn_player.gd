class_name AnimatedTurnPlayer
extends TurnPlayer

var stage: BattleStage


func _init(new_stage: BattleStage = null) -> void:
	stage = new_stage


func _requires_impact(used: BattleEvent) -> bool:
	if used.source == null:
		return false
	return AnimConfig.requires_target_animation(AnimConfig.slug(used.source.display_name()), AnimConfig.slug(used.text))


func _attack(used: BattleEvent, _group: Array[BattleEvent]) -> void:
	if stage != null and is_instance_valid(stage):
		await stage.play_attack(used.source, used.target, AnimConfig.slug(used.text))


func _impact(_used: BattleEvent, targets: Array[Fighter]) -> void:
	if stage != null and is_instance_valid(stage):
		await stage.play_impact(targets)


func _recovery(_used: BattleEvent, targets: Array[Fighter]) -> void:
	if stage != null and is_instance_valid(stage):
		await stage.play_recovery(targets)
