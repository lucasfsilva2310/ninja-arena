class_name FighterSprite
extends Control

const SPRITE_BOX: float = 96.0
const FEET_MARGIN: float = 6.0
const SLOT_SIZE: Vector2 = Vector2(100, 60)

var fighter: Fighter
var enemy: bool = false
var character_slug: String = ""
var sprite: AnimatedSprite2D
var busy: bool = false
var alive: bool = true
var base_scale: float = 1.0


func _init(new_fighter: Fighter, is_enemy: bool = false) -> void:
	fighter = new_fighter
	enemy = is_enemy
	character_slug = AnimConfig.slug(fighter.display_name())
	size_flags_horizontal = Control.SIZE_EXPAND_FILL
	size_flags_vertical = Control.SIZE_EXPAND_FILL
	custom_minimum_size = SLOT_SIZE
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	clip_contents = false
	sprite = AnimatedSprite2D.new()
	sprite.centered = false
	sprite.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	var frames: SpriteFrames = SpriteLibrary.character_frames(character_slug)
	if frames != null:
		sprite.sprite_frames = frames
		var idle: Texture2D = frames.get_frame_texture("idle", 0)
		base_scale = SPRITE_BOX / maxf(float(idle.get_width()), float(idle.get_height()))
	sprite.scale = Vector2(-base_scale if enemy else base_scale, base_scale)
	sprite.frame_changed.connect(_align_frame)
	add_child(sprite)
	_layout()
	_show_resting_pose()


func _notification(what: int) -> void:
	if what == NOTIFICATION_RESIZED and sprite != null:
		_layout()


func set_alive(value: bool) -> void:
	alive = value
	if not busy:
		_show_resting_pose()


func release() -> void:
	busy = false
	_show_resting_pose()


func play_once(animation: String) -> float:
	if sprite.sprite_frames == null or not sprite.sprite_frames.has_animation(animation):
		return 0.0
	busy = true
	sprite.speed_scale = AnimConfig.speed
	sprite.play(animation)
	_align_frame()
	return sprite.sprite_frames.get_frame_count(animation) * float(AnimConfig.FRAME_MS)


func set_pose(animation: String, frame_index: int) -> void:
	busy = true
	sprite.animation = animation
	sprite.frame = frame_index
	sprite.stop()
	_align_frame()


func current_animation() -> String:
	return str(sprite.animation)


func body_center() -> Vector2:
	var height: float = _frame_size().y * absf(sprite.scale.y)
	return sprite.global_position + Vector2(0, -height / 2.0)


func feet_point() -> Vector2:
	return sprite.global_position


func _show_resting_pose() -> void:
	if sprite.sprite_frames == null:
		return
	var animation: String = "idle" if alive else "defeated"
	sprite.speed_scale = 1.0
	if sprite.animation != animation or not sprite.is_playing():
		sprite.play(animation)
	_align_frame()


func _layout() -> void:
	sprite.position = Vector2(size.x / 2.0, size.y - FEET_MARGIN)


func _frame_size() -> Vector2:
	if sprite.sprite_frames == null:
		return Vector2.ZERO
	var texture: Texture2D = sprite.sprite_frames.get_frame_texture(sprite.animation, sprite.frame)
	return texture.get_size() if texture != null else Vector2.ZERO


func _align_frame() -> void:
	var frame_size: Vector2 = _frame_size()
	sprite.offset = Vector2(-frame_size.x / 2.0, -frame_size.y)
