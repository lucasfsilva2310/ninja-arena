extends RefCounted

const N: ChakraType.Type = ChakraType.Type.NINJUTSU
const T: ChakraType.Type = ChakraType.Type.TAIJUTSU
const G: ChakraType.Type = ChakraType.Type.GENJUTSU
const B: ChakraType.Type = ChakraType.Type.BLOODLINE
const R: ChakraType.Type = ChakraType.Type.RANDOM


static func types(list: Array) -> Array[ChakraType.Type]:
	var result: Array[ChakraType.Type] = []
	for item: Variant in list:
		result.append(item)
	return result


static func effect(kind: EffectData.Kind, value: int, duration: int = 0, is_percent: bool = false, invulnerable: bool = false) -> EffectData:
	var data: EffectData = EffectData.new()
	data.kind = kind
	data.value = value
	data.duration = duration
	data.is_percent = is_percent
	data.invulnerable = invulnerable
	return data


static func ability(ability_name: String, cost: Array, cooldown: int, target: AbilityData.Target, effects: Array) -> AbilityData:
	var data: AbilityData = AbilityData.new()
	data.display_name = ability_name
	data.cost = types(cost)
	data.cooldown = cooldown
	data.target_type = target
	for item: Variant in effects:
		data.effects.append(item)
	return data


static func hit(amount: int, cost: Array = [], cooldown: int = 0) -> AbilityData:
	return ability("Hit%d" % amount, cost, cooldown, AbilityData.Target.ENEMY, [effect(EffectData.Kind.DAMAGE, amount)])


static func heal(amount: int, cost: Array = []) -> AbilityData:
	return ability("Heal%d" % amount, cost, 0, AbilityData.Target.ALLY, [effect(EffectData.Kind.HEAL, amount)])


static func names(list: Array) -> Array[String]:
	var result: Array[String] = []
	for item: Variant in list:
		result.append(item)
	return result


static func buff(value: int, duration: int, ability_names: Array) -> EffectData:
	var data: EffectData = effect(EffectData.Kind.BUFF, value, duration)
	data.ability_names = names(ability_names)
	return data


static func enable(duration: int, ability_names: Array) -> EffectData:
	var data: EffectData = effect(EffectData.Kind.ENABLE_ABILITY, 0, duration)
	data.ability_names = names(ability_names)
	return data


static func stun(duration: int) -> EffectData:
	return effect(EffectData.Kind.STUN, 0, duration)


static func transform(replacement: AbilityData, duration: int, damage: int = 0) -> EffectData:
	var data: EffectData = effect(EffectData.Kind.TRANSFORM, damage, duration)
	data.replacement = replacement
	return data


static func self_cast(ability_name: String, effects: Array, cooldown: int = 0) -> AbilityData:
	return ability(ability_name, [], cooldown, AbilityData.Target.SELF, effects)


static func character(character_name: String, abilities: Array) -> CharacterData:
	var data: CharacterData = CharacterData.new()
	data.display_name = character_name
	for item: Variant in abilities:
		data.abilities.append(item)
	return data


static func team(abilities: Array) -> Team:
	var members: Array[CharacterData] = []
	for i: int in 3:
		members.append(character("F%d" % i, abilities))
	return Team.new(members)


static func battle(team_a: Team, team_b: Team, seed_value: int = 1) -> Battle:
	var match_battle: Battle = Battle.new(team_a, team_b, Rng.new(seed_value))
	match_battle.start()
	return match_battle


static func give(pool: ChakraPool, list: Array) -> void:
	for item: Variant in list:
		pool.add(item)


static func empty_payment() -> Array[ChakraType.Type]:
	var result: Array[ChakraType.Type] = []
	return result


static func actions(list: Array) -> Array[Action]:
	var result: Array[Action] = []
	for item: Variant in list:
		result.append(item)
	return result


static func skip_turn(match_battle: Battle) -> void:
	match_battle.submit_turn(match_battle.current_team, actions([]), empty_payment())
