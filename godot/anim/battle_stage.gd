class_name BattleStage
extends Control

const EFFECT_PIXEL_SCALE: float = FighterSprite.SPRITE_BOX / 60.0

var sprites: Dictionary = {}
var _running_effects: int = 0


func _init() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	z_index = 10


func play_attack(source: Fighter, target: Fighter, ability_slug: String) -> void:
	var actor: FighterSprite = sprites.get(source)
	if AnimConfig.fast or actor == null:
		return
	var milliseconds: float = actor.play_once(ability_slug)
	if milliseconds <= 0.0:
		milliseconds = AnimConfig.FALLBACK_ATTACK_MS
	for effect: Dictionary in AnimConfig.effects_of(actor.character_slug, ability_slug):
		_run_effect(effect, actor, sprites.get(target) if target != null else null)
	await _wait(milliseconds)
	actor.release()


func play_impact(targets: Array[Fighter]) -> void:
	if AnimConfig.fast:
		return
	while _running_effects > 0:
		await get_tree().process_frame
	var longest: float = 0.0
	for target: Fighter in targets:
		var victim: FighterSprite = sprites.get(target)
		if victim != null:
			longest = maxf(longest, victim.play_once("damaged"))
	await _wait(longest if longest > 0.0 else AnimConfig.FALLBACK_IMPACT_MS)


func play_recovery(targets: Array[Fighter]) -> void:
	if AnimConfig.fast:
		return
	var longest: float = 0.0
	for target: Fighter in targets:
		var victim: FighterSprite = sprites.get(target)
		if victim == null:
			continue
		if victim.alive:
			longest = maxf(longest, victim.play_once("recover"))
		else:
			victim.release()
	if longest > 0.0:
		await _wait(longest)
	for target: Fighter in targets:
		var victim: FighterSprite = sprites.get(target)
		if victim != null:
			victim.release()


func release_all() -> void:
	for fighter: Fighter in sprites:
		(sprites[fighter] as FighterSprite).release()


func spawn_effect(character_slug: String, effect: Dictionary, from: Vector2, to: Vector2, pixel_scale: float) -> AnimatedSprite2D:
	var frames: SpriteFrames = SpriteLibrary.effect_frames(character_slug)
	if frames == null or not frames.has_animation(str(effect["name"])):
		return null
	var node: AnimatedSprite2D = AnimatedSprite2D.new()
	node.sprite_frames = frames
	node.animation = str(effect["name"])
	node.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	var factor: float = pixel_scale * float(effect["scale"])
	var heading: Vector2 = to - from
	if str(effect["kind"]) == "projectile" and absf(heading.x) + absf(heading.y) > 1.0:
		var leftward: bool = heading.x < 0.0
		node.scale = Vector2(-factor if leftward else factor, factor)
		var tilt: float = atan2(heading.y, absf(heading.x))
		node.rotation = -tilt if leftward else tilt
	else:
		node.scale = Vector2(factor, factor)
	node.global_position = from
	add_child(node)
	return node


func _run_effect(effect: Dictionary, actor: FighterSprite, victim: FighterSprite) -> void:
	_running_effects += 1
	await _wait(float(effect["start_ms"]))
	var from: Vector2 = actor.body_center()
	var to: Vector2 = victim.body_center() if victim != null and str(effect["kind"]) == "projectile" else from
	var node: AnimatedSprite2D = spawn_effect(actor.character_slug, effect, from, to, EFFECT_PIXEL_SCALE)
	if node != null:
		var duration: float = AnimConfig.seconds(float(effect["duration_ms"])) * 1000.0
		var count: int = node.sprite_frames.get_frame_count(node.animation)
		var started: int = Time.get_ticks_msec()
		var elapsed: float = 0.0
		while elapsed < duration and is_instance_valid(node):
			var progress: float = elapsed / duration
			node.frame = mini(int(progress * count), count - 1)
			node.global_position = from.lerp(to, progress)
			await get_tree().process_frame
			elapsed = float(Time.get_ticks_msec() - started)
		if is_instance_valid(node):
			node.queue_free()
	_running_effects -= 1


func _wait(milliseconds: float) -> void:
	var duration: float = AnimConfig.seconds(milliseconds)
	if duration > 0.0:
		await get_tree().create_timer(duration).timeout
