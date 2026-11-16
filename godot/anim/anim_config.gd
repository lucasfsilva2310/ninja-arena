class_name AnimConfig
extends RefCounted

static var fast: bool = false

const FRAME_MS: int = 150
const FALLBACK_ATTACK_MS: int = 500
const FALLBACK_IMPACT_MS: int = 500
const FALLBACK_RECOVERY_MS: int = 300
const SPRITE_ROOT: String = "res://assets/characters/"

const CHARACTERS: Dictionary = {
	"naruto": {
		"idle": 3, "damaged": 7, "recover": 4,
		"abilities": {
			"rasengan": {"frames": 12, "target": true},
			"escapeclone": {"frames": 5, "target": false},
			"kagebunshin": {"frames": 5, "target": false},
			"narutokick": {"frames": 10, "target": true},
		},
	},
	"sasuke": {
		"idle": 6, "damaged": 6, "recover": 5,
		"abilities": {
			"fireball": {
				"frames": 15, "target": true,
				"effects": [{"name": "fireball", "kind": "projectile", "folder": "fireball", "frames": 12, "start_ms": 1500, "duration_ms": 900, "scale": 1.5}],
			},
			"chidori": {"frames": 34, "target": true},
			"kawarimi": {
				"frames": 8, "target": false,
				"effects": [{"name": "smoke", "kind": "dispersion", "folder": "kawarimi", "frames": 6, "start_ms": 300, "duration_ms": 500, "scale": 1.5}],
			},
			"sharingan": {"frames": 7, "target": false},
		},
	},
	"sakura": {
		"idle": 6, "damaged": 7, "recover": 5,
		"abilities": {
			"angerpunch": {"frames": 9, "target": true},
			"innerstrength": {"frames": 9, "target": false},
			"kawarimi": {
				"frames": 8, "target": false,
				"effects": [{"name": "smoke", "kind": "dispersion", "folder": "kawarimi", "frames": 6, "start_ms": 300, "duration_ms": 500, "scale": 1.5}],
			},
			"heal": {"frames": 8, "target": false},
		},
	},
	"rocklee": {
		"idle": 6, "damaged": 7, "recover": 5,
		"abilities": {
			"primarylotus": {"frames": 31, "target": true},
			"hiddenlotus": {"frames": 44, "target": true},
			"konohasenpu": {"frames": 24, "target": true},
			"releaseweights": {"frames": 27, "target": false},
			"backflip": {"frames": 13, "target": false},
		},
	},
}


static func slug(display_name: String) -> String:
	return display_name.replace(" ", "").to_lower()


static func frames_path(character_slug: String) -> String:
	return "%s%s/%s_frames.tres" % [SPRITE_ROOT, character_slug, character_slug]


static func effects_path(character_slug: String) -> String:
	return "%s%s/%s_effects.tres" % [SPRITE_ROOT, character_slug, character_slug]


static func ability_config(character_slug: String, ability_slug: String) -> Dictionary:
	var character: Dictionary = CHARACTERS.get(character_slug, {})
	return (character.get("abilities", {}) as Dictionary).get(ability_slug, {})


static func requires_target_animation(character_slug: String, ability_slug: String) -> bool:
	return bool(ability_config(character_slug, ability_slug).get("target", false))


static func effects_of(character_slug: String, ability_slug: String) -> Array:
	return ability_config(character_slug, ability_slug).get("effects", [])


static func seconds(milliseconds: float) -> float:
	return 0.0 if fast else milliseconds / 1000.0
