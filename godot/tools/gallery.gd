extends Control

const ENEMY_DAMAGE: int = 20

var _shots_dir: String = ""
var _only: String = ""
var _played: int = 0
var _left: VBoxContainer
var _right: VBoxContainer
var _title: Label
var _stage: BattleStage
var _fighters: Dictionary = {}
var _sprites: Dictionary = {}


func _ready() -> void:
	var args: PackedStringArray = OS.get_cmdline_user_args()
	AnimConfig.fast = args.has("--fast")
	if args.has("--shots") and args.find("--shots") + 1 < args.size():
		_shots_dir = args[args.find("--shots") + 1]
	if args.has("--only") and args.find("--only") + 1 < args.size():
		_only = args[args.find("--only") + 1]
	theme = GameTheme.get_theme()
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_build()
	_run.call_deferred()


func _build() -> void:
	var background: TextureRect = TextureRect.new()
	background.texture = Art.battle_background("forest")
	background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	background.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	background.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	add_child(background)
	var row: HBoxContainer = HBoxContainer.new()
	row.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	row.offset_left = 120
	row.offset_right = -120
	row.offset_top = 90
	row.offset_bottom = -60
	row.add_theme_constant_override("separation", 360)
	add_child(row)
	_left = VBoxContainer.new()
	_left.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_right = VBoxContainer.new()
	_right.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(_left)
	row.add_child(_right)
	_title = Label.new()
	_title.theme_type_variation = "TitleLabel"
	_title.add_theme_font_size_override("font_size", 32)
	_title.set_anchors_and_offsets_preset(Control.PRESET_TOP_WIDE)
	_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_title.offset_top = 20
	add_child(_title)
	var left_names: Array[String] = ["Naruto", "Sasuke", "Sakura"]
	var right_names: Array[String] = ["Rock Lee", "Naruto", "Sasuke"]
	_stage = BattleStage.new()
	for slot: int in 3:
		_add_fighter(left_names[slot], false, _left)
		_add_fighter(right_names[slot], true, _right)
	_stage.sprites = _sprites
	add_child(_stage)


func _add_fighter(character_name: String, enemy: bool, column: VBoxContainer) -> void:
	for character: CharacterData in Content.characters():
		if character.display_name == character_name:
			var fighter: Fighter = Fighter.new(character)
			var sprite: FighterSprite = FighterSprite.new(fighter, enemy)
			sprite.custom_minimum_size = Vector2(120, 150)
			column.add_child(sprite)
			_sprites[fighter] = sprite
			_fighters[fighter] = enemy


func _run() -> void:
	await get_tree().process_frame
	await get_tree().process_frame
	var player: AnimatedTurnPlayer = AnimatedTurnPlayer.new(_stage)
	for fighter: Fighter in _sprites:
		var character_slug: String = AnimConfig.slug(fighter.display_name())
		var abilities: Dictionary = AnimConfig.CHARACTERS[character_slug]["abilities"]
		for ability_slug: String in abilities:
			if _only != "" and _only != ability_slug:
				continue
			var victim: Fighter = _opponent_of(fighter)
			_title.text = "%s: %s%s" % [fighter.display_name(), ability_slug, " (enemy side)" if _fighters[fighter] else ""]
			var events: Array[BattleEvent] = [BattleEvent.new(BattleEvent.Type.ABILITY_USED, fighter, victim, 0, ability_slug)]
			if bool(abilities[ability_slug]["target"]):
				events.append(BattleEvent.new(BattleEvent.Type.DAMAGE, fighter, victim, ENEMY_DAMAGE, ability_slug))
			if _shots_dir != "" and not AnimConfig.fast:
				_shot_midway.call_deferred(fighter, character_slug, ability_slug)
			await player.play(events)
			_played += 1
			await get_tree().process_frame
			_check_rest(fighter, victim)
	print("GALLERY OK played=%d fast=%s" % [_played, str(AnimConfig.fast)])
	get_tree().quit(0)


func _opponent_of(fighter: Fighter) -> Fighter:
	var enemy: bool = _fighters[fighter]
	var candidates: Array[Fighter] = []
	for other: Fighter in _fighters:
		if _fighters[other] != enemy:
			candidates.append(other)
	return candidates[1]


func _check_rest(fighter: Fighter, victim: Fighter) -> void:
	for member: Fighter in [fighter, victim]:
		var sprite: FighterSprite = _sprites[member]
		if sprite.busy or sprite.current_animation() != "idle":
			printerr("GALLERY FAIL: %s is not back to idle (%s)" % [member.display_name(), sprite.current_animation()])
			get_tree().quit(1)


func _shot_midway(fighter: Fighter, character_slug: String, ability_slug: String) -> void:
	var frames: float = AnimConfig.ability_config(character_slug, ability_slug)["frames"]
	var side: String = "enemy" if _fighters[fighter] else "ally"
	var delay: float = AnimConfig.seconds(frames * AnimConfig.FRAME_MS * 0.55)
	var effects: Array = AnimConfig.effects_of(character_slug, ability_slug)
	if not effects.is_empty() and str(effects[0]["kind"]) == "projectile":
		delay = AnimConfig.seconds(float(effects[0]["start_ms"]) + float(effects[0]["duration_ms"]) * 0.5)
	await get_tree().create_timer(delay).timeout
	await RenderingServer.frame_post_draw
	var image: Image = get_viewport().get_texture().get_image()
	image.save_png("%s/gallery-%s-%s-%s.png" % [_shots_dir, character_slug, ability_slug, side])
