class_name Content
extends RefCounted

const ABILITY_DIR: String = "res://content/abilities/"
const CHARACTER_DIR: String = "res://content/characters/"

const ABILITY_FILES: Dictionary = {
	"Kage Bunshin": "kage_bunshin",
	"Naruto Kick": "naruto_kick",
	"Rasengan": "rasengan",
	"Escape Clone": "escape_clone",
	"Fireball": "fireball",
	"Chidori": "chidori",
	"Sharingan": "sharingan",
	"Kawarimi": "kawarimi",
	"Anger Punch": "anger_punch",
	"Heal": "heal",
	"Inner Strength": "inner_strength",
	"Konoha Senpu": "konoha_senpu",
	"Primary Lotus": "primary_lotus",
	"Release Weights": "release_weights",
	"Backflip": "backflip",
	"Hidden Lotus": "hidden_lotus",
}

const SELECTABLE: Array[String] = ["naruto", "sasuke", "sakura", "rock_lee"]
const AI_TEAM: Array[String] = ["naruto", "sasuke", "sakura"]


static func characters() -> Array[CharacterData]:
	return _load_characters(SELECTABLE)


static func ai_roster() -> Array[CharacterData]:
	return _load_characters(AI_TEAM)


static func ability(ability_name: String) -> AbilityData:
	if not ABILITY_FILES.has(ability_name):
		return null
	return load(ABILITY_DIR + String(ABILITY_FILES[ability_name]) + ".tres") as AbilityData


static func _load_characters(files: Array[String]) -> Array[CharacterData]:
	var result: Array[CharacterData] = []
	for file: String in files:
		result.append(load(CHARACTER_DIR + file + ".tres") as CharacterData)
	return result
