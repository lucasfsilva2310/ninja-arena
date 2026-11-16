extends "res://tools/test_case.gd"

const EXPECTED: Dictionary = {
	"naruto": {"idle": 3, "damaged": 7, "recover": 4, "defeated": 1, "rasengan": 12, "escapeclone": 5, "kagebunshin": 5, "narutokick": 10},
	"sasuke": {"idle": 6, "damaged": 6, "recover": 5, "defeated": 1, "fireball": 15, "chidori": 34, "kawarimi": 8, "sharingan": 7},
	"sakura": {"idle": 6, "damaged": 7, "recover": 5, "defeated": 1, "angerpunch": 9, "innerstrength": 9, "kawarimi": 8, "heal": 8},
	"rocklee": {"idle": 6, "damaged": 7, "recover": 5, "defeated": 1, "primarylotus": 31, "hiddenlotus": 44, "konohasenpu": 24, "releaseweights": 27, "backflip": 13},
}


func test_every_character_resource_loads_with_the_react_frame_counts() -> void:
	for character_slug: String in EXPECTED:
		var frames: SpriteFrames = SpriteLibrary.character_frames(character_slug)
		assert_true(frames != null)
		if frames == null:
			continue
		var table: Dictionary = EXPECTED[character_slug]
		assert_eq(frames.get_animation_names().size(), table.size())
		for animation: String in table:
			assert_true(frames.has_animation(animation))
			assert_eq(frames.get_frame_count(animation), int(table[animation]))


func test_every_frame_has_a_texture() -> void:
	for character_slug: String in EXPECTED:
		var frames: SpriteFrames = SpriteLibrary.character_frames(character_slug)
		for animation: String in frames.get_animation_names():
			for i: int in frames.get_frame_count(animation):
				assert_true(frames.get_frame_texture(animation, i) != null)


func test_effect_resources_have_the_react_frame_counts() -> void:
	var sasuke: SpriteFrames = SpriteLibrary.effect_frames("sasuke")
	assert_eq(sasuke.get_frame_count("fireball"), 12)
	assert_eq(sasuke.get_frame_count("smoke"), 6)
	assert_eq(SpriteLibrary.effect_frames("sakura").get_frame_count("smoke"), 6)
	assert_true(SpriteLibrary.effect_frames("naruto") == null)


func test_idle_loops_and_the_rest_play_once() -> void:
	var frames: SpriteFrames = SpriteLibrary.character_frames("naruto")
	assert_true(frames.get_animation_loop("idle"))
	assert_false(frames.get_animation_loop("rasengan"))
	assert_false(frames.get_animation_loop("damaged"))
	assert_eq(frames.get_animation_speed("idle"), 1000.0 / 150.0)


func test_every_ability_in_the_content_has_an_animation() -> void:
	var count: int = 0
	for character: CharacterData in Content.characters():
		var character_slug: String = AnimConfig.slug(character.display_name)
		for ability: AbilityData in character.abilities:
			count += 1
			assert_true(SpriteLibrary.has_animation(character_slug, AnimConfig.slug(ability.display_name)))
	assert_eq(count, 16)


func test_target_animation_flags_match_react() -> void:
	var targeted: Array[String] = ["naruto/rasengan", "naruto/narutokick", "sasuke/fireball", "sasuke/chidori", "sakura/angerpunch", "rocklee/primarylotus", "rocklee/hiddenlotus", "rocklee/konohasenpu"]
	var seen: int = 0
	for character_slug: String in EXPECTED:
		for animation: String in EXPECTED[character_slug]:
			if ["idle", "damaged", "recover", "defeated"].has(animation):
				continue
			var key: String = "%s/%s" % [character_slug, animation]
			assert_eq(AnimConfig.requires_target_animation(character_slug, animation), targeted.has(key))
			seen += 1
	assert_eq(seen, 17)


func test_fireball_and_smoke_timing_match_react() -> void:
	var fireball: Dictionary = AnimConfig.effects_of("sasuke", "fireball")[0]
	assert_eq(int(fireball["start_ms"]), 1500)
	assert_eq(int(fireball["duration_ms"]), 900)
	assert_eq(fireball["kind"], "projectile")
	var smoke: Dictionary = AnimConfig.effects_of("sakura", "kawarimi")[0]
	assert_eq(int(smoke["start_ms"]), 300)
	assert_eq(int(smoke["duration_ms"]), 500)
	assert_eq(smoke["kind"], "dispersion")
	assert_eq(AnimConfig.effects_of("naruto", "rasengan").size(), 0)
