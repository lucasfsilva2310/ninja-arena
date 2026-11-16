extends Control

const DEFAULT_ARGS: Array[String] = ["idle", "Naruto,Sasuke,Sakura", "Rock Lee,Sasuke,Naruto"]


func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	var args: Array[String] = DEFAULT_ARGS.duplicate()
	var user: PackedStringArray = OS.get_cmdline_user_args()
	for i: int in mini(user.size() - 3, 3):
		args[i] = user[3 + i]
	var battle: Battle = Battle.new(Team.new(_team(args[1])), Team.new(_team(args[2])), Rng.new(3))
	battle.start()
	var view: BattleView = (load("res://ui/battle.tscn") as PackedScene).instantiate() as BattleView
	view.background_name = "forest"
	view.bind(battle)
	add_child(view)
	_pose.call_deferred(view, battle, args[0])


func _team(names: String) -> Array[CharacterData]:
	var wanted: PackedStringArray = names.split(",")
	var result: Array[CharacterData] = []
	for character_name: String in wanted:
		for character: CharacterData in Content.characters():
			if character.display_name == character_name:
				result.append(character)
	return result


func _pose(view: BattleView, battle: Battle, mode: String) -> void:
	var all: Array[FighterSprite] = []
	for team_idx: int in 2:
		for slot: int in 3:
			var sprite: FighterSprite = view.sprites[battle.teams[team_idx].fighters[slot]]
			all.append(sprite)
			_pose_one(sprite, mode, slot)
	if mode == "fireball" or mode == "smoke":
		_pose_effect(view, battle, mode)


func _pose_one(sprite: FighterSprite, mode: String, slot: int) -> void:
	match mode:
		"idle":
			sprite.set_pose("idle", 0)
		"damaged":
			sprite.set_pose("damaged", 2)
		"recover":
			sprite.set_pose("recover", 1)
		"defeated":
			sprite.set_alive(false)
			sprite.release()
		"attack":
			var abilities: Array = (AnimConfig.CHARACTERS[sprite.character_slug]["abilities"] as Dictionary).keys()
			var slug: String = abilities[slot % abilities.size()]
			var count: int = sprite.sprite.sprite_frames.get_frame_count(slug)
			sprite.set_pose(slug, count / 2)
		"fireball":
			sprite.set_pose("fireball" if sprite.character_slug == "sasuke" else "idle", 12)
		"smoke":
			sprite.set_pose("kawarimi" if sprite.character_slug == "sakura" or sprite.character_slug == "sasuke" else "idle", 3)


func _pose_effect(view: BattleView, battle: Battle, mode: String) -> void:
	var user: Fighter = battle.teams[0].fighters[1]
	var victim: Fighter = battle.teams[1].fighters[1]
	var actor: FighterSprite = view.sprites[user]
	var target: FighterSprite = view.sprites[victim]
	var effect: Dictionary = AnimConfig.effects_of("sasuke", "fireball")[0] if mode == "fireball" else AnimConfig.effects_of("sasuke", "kawarimi")[0]
	var from: Vector2 = actor.body_center()
	var to: Vector2 = target.body_center() if mode == "fireball" else from
	var node: AnimatedSprite2D = view.stage.spawn_effect("sasuke", effect, from, to, BattleStage.EFFECT_PIXEL_SCALE)
	node.frame = 5
	node.global_position = from.lerp(to, 0.7)
	if mode == "fireball":
		var back_from: Vector2 = target.body_center()
		var back_to: Vector2 = actor.body_center()
		var reverse: AnimatedSprite2D = view.stage.spawn_effect("sasuke", effect, back_from, back_to, BattleStage.EFFECT_PIXEL_SCALE)
		reverse.frame = 8
		reverse.global_position = back_from.lerp(back_to, 0.3) + Vector2(0, 90)
