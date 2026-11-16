extends SceneTree


func _init() -> void:
	var failures: int = 0
	for character_slug: String in AnimConfig.CHARACTERS:
		failures += _build_character(character_slug)
	print("build_sprite_frames: done, failures=%d" % failures)
	quit(1 if failures > 0 else 0)


func _build_character(character_slug: String) -> int:
	var config: Dictionary = AnimConfig.CHARACTERS[character_slug]
	var frames: SpriteFrames = _empty()
	var failures: int = 0
	failures += _add(frames, "idle", character_slug, "idle", int(config["idle"]), true)
	failures += _add(frames, "damaged", character_slug, "damaged", int(config["damaged"]), false)
	failures += _add(frames, "recover", character_slug, "recover", int(config["recover"]), false)
	failures += _add(frames, "defeated", character_slug, "defeated", 1, false)
	var effects: SpriteFrames = _empty()
	var abilities: Dictionary = config["abilities"]
	for ability_slug: String in abilities:
		var ability: Dictionary = abilities[ability_slug]
		failures += _add(frames, ability_slug, character_slug, ability_slug, int(ability["frames"]), false)
		for effect: Dictionary in ability.get("effects", []):
			var folder: String = "%s/effects/%s" % [effect["folder"], effect["name"]]
			failures += _add(effects, str(effect["name"]), character_slug, folder, int(effect["frames"]), true)
	failures += _save(frames, AnimConfig.frames_path(character_slug))
	if effects.get_animation_names().size() > 0:
		failures += _save(effects, AnimConfig.effects_path(character_slug))
	return failures


func _empty() -> SpriteFrames:
	var frames: SpriteFrames = SpriteFrames.new()
	frames.remove_animation("default")
	return frames


func _add(frames: SpriteFrames, animation: String, character_slug: String, folder: String, count: int, loop: bool) -> int:
	frames.add_animation(animation)
	frames.set_animation_speed(animation, 1000.0 / AnimConfig.FRAME_MS)
	frames.set_animation_loop(animation, loop)
	for i: int in count:
		var path: String = "%s%s/sprites/%s/%s" % [AnimConfig.SPRITE_ROOT, character_slug, folder, _file(character_slug, folder, i)]
		var texture: Texture2D = load(path) as Texture2D
		if texture == null:
			printerr("build_sprite_frames: missing %s" % path)
			return 1
		frames.add_frame(animation, texture)
	return 0


func _file(character_slug: String, folder: String, index: int) -> String:
	if folder == "defeated":
		return "defeated.png"
	return "%s-sprites-%d.png" % [character_slug, index]


func _save(frames: SpriteFrames, path: String) -> int:
	var error: Error = ResourceSaver.save(frames, path)
	if error != OK:
		printerr("build_sprite_frames: cannot save %s (%d)" % [path, error])
		return 1
	print("build_sprite_frames: saved %s" % path)
	return 0
