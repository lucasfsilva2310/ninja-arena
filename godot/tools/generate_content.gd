extends SceneTree

const ABILITY_DIR: String = "res://content/abilities/"
const CHARACTER_DIR: String = "res://content/characters/"

const N: ChakraType.Type = ChakraType.Type.NINJUTSU
const T: ChakraType.Type = ChakraType.Type.TAIJUTSU
const B: ChakraType.Type = ChakraType.Type.BLOODLINE
const R: ChakraType.Type = ChakraType.Type.RANDOM

var _failed: bool = false


func _init() -> void:
	var hidden: AbilityData = _save_ability("hidden_lotus", _ability("Hidden Lotus", "Rock Lee opens the fifth chakra gate and deals 40 damage to one enemy.", [T, R], 0, AbilityData.Target.ENEMY, [_damage(40)]))
	_save_ability("naruto_kick", _ability("Naruto Kick", "Naruto kicks one enemy and deals 20 damage. While Kage Bunshin lasts, it deals 10 more damage.", [T, R], 0, AbilityData.Target.ENEMY, [_damage(20)]))
	var rasengan: AbilityData = _ability("Rasengan", "Naruto hits one enemy with a Rasengan and deals 35 damage. The enemy cannot act on its next turn. Naruto can use this only while Kage Bunshin lasts.", [N, R], 1, AbilityData.Target.ENEMY, [_damage(35), _stun(1, "This character cannot act.")])
	rasengan.required_enabler = "Kage Bunshin"
	_save_ability("rasengan", rasengan)
	_save_ability("kage_bunshin", _ability("Kage Bunshin", "Naruto makes clones. For 3 turns he has 15% damage reduction, Naruto Kick deals 10 more damage, and he can use Rasengan.", [R], 5, AbilityData.Target.SELF, [
		_reduction(15, 3, true, false, "This character has 15% damage reduction."),
		_buff(10, 3, ["Naruto Kick"], "Naruto Kick deals 10 more damage."),
		_enable(3, ["Rasengan"], "This character can use Rasengan."),
	]))
	_save_ability("kawarimi", _ability("Kawarimi", "The caster swaps places with a log and cannot be hurt for 1 turn.", [R], 1, AbilityData.Target.SELF, [_reduction(0, 1, false, true, "This character cannot be hurt.")]))
	_save_ability("escape_clone", _ability("Escape Clone", "Naruto leaves a clone in his place and cannot be hurt for 1 turn.", [R], 1, AbilityData.Target.SELF, [_reduction(0, 1, false, true, "This character cannot be hurt.")]))
	_save_ability("backflip", _ability("Backflip", "Rock Lee jumps back and cannot be hurt for 1 turn.", [R], 1, AbilityData.Target.SELF, [_reduction(0, 1, false, true, "This character cannot be hurt.")]))
	_save_ability("fireball", _ability("Fireball", "Sasuke throws a fireball at one enemy and deals 25 damage.", [N], 1, AbilityData.Target.ENEMY, [_damage(25)]))
	_save_ability("chidori", _ability("Chidori", "Sasuke hits one enemy with lightning chakra and deals 35 damage. While Sharingan lasts, it deals 10 more damage.", [N, R], 1, AbilityData.Target.ENEMY, [_damage(35)]))
	_save_ability("sharingan", _ability("Sharingan", "Sasuke uses the Sharingan. For 3 turns he has 15 damage reduction and Chidori deals 10 more damage.", [B, R], 4, AbilityData.Target.SELF, [
		_reduction(15, 3, false, false, "This character has 15 damage reduction."),
		_buff(10, 3, ["Chidori"], "Chidori deals 10 more damage."),
	]))
	_save_ability("anger_punch", _ability("Anger Punch", "Sakura punches one enemy and deals 15 damage. While Inner Strength lasts, it deals 10 more damage.", [T], 0, AbilityData.Target.ENEMY, [_damage(15)]))
	_save_ability("heal", _ability("Heal", "Sakura heals one ally for 15 health. She cannot heal an ally at full health.", [N], 0, AbilityData.Target.ALLY, [_heal(15)]))
	_save_ability("inner_strength", _ability("Inner Strength", "Sakura uses her inner strength. For 3 turns she has 10 damage reduction and Anger Punch deals 10 more damage.", [R], 4, AbilityData.Target.SELF, [
		_reduction(10, 3, false, false, "This character has 10 damage reduction."),
		_buff(10, 3, ["Anger Punch"], "Anger Punch deals 10 more damage."),
	]))
	var senpu: AbilityData = _ability("Konoha Senpu", "Rock Lee kicks one enemy and deals 20 damage. Each time he uses it, it deals 5 more damage for the rest of the battle.", [T], 1, AbilityData.Target.ENEMY, [_damage(20)])
	senpu.stacking = true
	_save_ability("konoha_senpu", senpu)
	var lotus_effect: EffectData = _effect(EffectData.Kind.TRANSFORM, 30, 2)
	lotus_effect.replacement = hidden
	lotus_effect.description = "Primary Lotus becomes Hidden Lotus for 1 turn."
	_save_ability("primary_lotus", _ability("Primary Lotus", "Rock Lee wraps one enemy in bandages and deals 30 damage. On his next turn, this ability becomes Hidden Lotus for 1 turn.", [T], 1, AbilityData.Target.ENEMY, [lotus_effect]))
	_save_ability("release_weights", _ability("Release Weights", "Rock Lee drops his weights. For 2 turns he has 10 damage reduction.", [T], 1, AbilityData.Target.SELF, [_reduction(10, 2, false, false, "This character has 10 damage reduction.")]))

	_save_character("naruto", "Naruto", ["kage_bunshin", "naruto_kick", "rasengan", "escape_clone"])
	_save_character("sasuke", "Sasuke", ["fireball", "chidori", "sharingan", "kawarimi"])
	_save_character("sakura", "Sakura", ["anger_punch", "heal", "inner_strength", "kawarimi"])
	_save_character("rock_lee", "Rock Lee", ["konoha_senpu", "primary_lotus", "release_weights", "backflip"])
	quit(1 if _failed else 0)


func _effect(kind: EffectData.Kind, value: int, duration: int) -> EffectData:
	var data: EffectData = EffectData.new()
	data.kind = kind
	data.value = value
	data.duration = duration
	return data


func _damage(value: int) -> EffectData:
	return _effect(EffectData.Kind.DAMAGE, value, 0)


func _heal(value: int) -> EffectData:
	return _effect(EffectData.Kind.HEAL, value, 0)


func _stun(duration: int, text: String) -> EffectData:
	var data: EffectData = _effect(EffectData.Kind.STUN, 0, duration)
	data.description = text
	return data


func _reduction(value: int, duration: int, percent: bool, invulnerable: bool, text: String) -> EffectData:
	var data: EffectData = _effect(EffectData.Kind.DAMAGE_REDUCTION, value, duration)
	data.is_percent = percent
	data.invulnerable = invulnerable
	data.description = text
	return data


func _buff(value: int, duration: int, names: Array[String], text: String) -> EffectData:
	var data: EffectData = _effect(EffectData.Kind.BUFF, value, duration)
	data.ability_names = names
	data.description = text
	return data


func _enable(duration: int, names: Array[String], text: String) -> EffectData:
	var data: EffectData = _effect(EffectData.Kind.ENABLE_ABILITY, 0, duration)
	data.ability_names = names
	data.description = text
	return data


func _ability(display_name: String, text: String, cost: Array[ChakraType.Type], cooldown: int, target: AbilityData.Target, effects: Array[EffectData]) -> AbilityData:
	var data: AbilityData = AbilityData.new()
	data.display_name = display_name
	data.description = text
	data.cost = cost
	data.cooldown = cooldown
	data.target_type = target
	data.effects = effects
	return data


func _save_ability(file: String, data: AbilityData) -> AbilityData:
	var path: String = ABILITY_DIR + file + ".tres"
	_check(ResourceSaver.save(data, path), path)
	return load(path) as AbilityData


func _save_character(file: String, display_name: String, ability_files: Array[String]) -> void:
	var data: CharacterData = CharacterData.new()
	data.display_name = display_name
	for ability_file: String in ability_files:
		data.abilities.append(load(ABILITY_DIR + ability_file + ".tres") as AbilityData)
	var path: String = CHARACTER_DIR + file + ".tres"
	_check(ResourceSaver.save(data, path), path)


func _check(code: Error, path: String) -> void:
	if code != OK:
		printerr("generate_content: save failed for %s (%d)" % [path, code])
		_failed = true
