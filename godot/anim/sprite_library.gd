class_name SpriteLibrary
extends RefCounted

static var _frames: Dictionary = {}
static var _effects: Dictionary = {}


static func character_frames(character_slug: String) -> SpriteFrames:
	if not _frames.has(character_slug):
		_frames[character_slug] = _load(AnimConfig.frames_path(character_slug))
	return _frames[character_slug]


static func effect_frames(character_slug: String) -> SpriteFrames:
	if not _effects.has(character_slug):
		_effects[character_slug] = _load(AnimConfig.effects_path(character_slug))
	return _effects[character_slug]


static func has_animation(character_slug: String, animation: String) -> bool:
	var frames: SpriteFrames = character_frames(character_slug)
	return frames != null and frames.has_animation(animation)


static func duration_ms(character_slug: String, animation: String) -> float:
	var frames: SpriteFrames = character_frames(character_slug)
	if frames == null or not frames.has_animation(animation):
		return 0.0
	return frames.get_frame_count(animation) * AnimConfig.FRAME_MS


static func _load(path: String) -> SpriteFrames:
	if not ResourceLoader.exists(path):
		return null
	return load(path) as SpriteFrames
