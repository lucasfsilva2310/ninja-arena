class_name Fighter
extends RefCounted

const MAX_HP: int = 100
const STACK_BONUS: int = 5

var data: CharacterData
var hp: int = MAX_HP
var abilities: Array[AbilityState] = []
var effects: Array[ActiveEffect] = []
var stack_counts: Dictionary = {}


func _init(character_data: CharacterData) -> void:
	data = character_data
	for ability: AbilityData in character_data.abilities:
		abilities.append(AbilityState.new(ability))


func display_name() -> String:
	return data.display_name


func is_alive() -> bool:
	return hp > 0


func is_full_hp() -> bool:
	return hp >= MAX_HP


func is_invulnerable() -> bool:
	for effect: ActiveEffect in effects:
		if effect.kind == EffectData.Kind.DAMAGE_REDUCTION and effect.invulnerable:
			return true
	return false


func is_stunned() -> bool:
	for effect: ActiveEffect in effects:
		if effect.kind == EffectData.Kind.STUN:
			return true
	return false


func can_use_ability(ability: AbilityData) -> bool:
	if ability.required_enabler == "":
		return true
	for effect: ActiveEffect in effects:
		if effect.kind != EffectData.Kind.ENABLE_ABILITY:
			continue
		if effect.source_name == ability.required_enabler or effect.ability_names.has(ability.display_name):
			return true
	return false


func buff_bonus(ability: AbilityData) -> int:
	var bonus: int = 0
	for effect: ActiveEffect in effects:
		if effect.kind == EffectData.Kind.BUFF and effect.ability_names.has(ability.display_name):
			bonus += effect.value
	return bonus


func stack_count(ability: AbilityData) -> int:
	return int(stack_counts.get(ability, 0))


func stack_bonus(ability: AbilityData) -> int:
	return stack_count(ability) * STACK_BONUS if ability.stacking else 0


func record_use(ability: AbilityData) -> void:
	if ability.stacking:
		stack_counts[ability] = stack_count(ability) + 1


func active_effects() -> Array[ActiveEffect]:
	return effects.duplicate()


func state_for(ability: AbilityData) -> AbilityState:
	for state: AbilityState in abilities:
		if state.data == ability:
			return state
	return null


func reduced_damage(amount: int) -> int:
	if is_invulnerable():
		return 0
	var percent_sum: int = 0
	var flat_sum: int = 0
	for effect: ActiveEffect in effects:
		if effect.kind != EffectData.Kind.DAMAGE_REDUCTION:
			continue
		if effect.is_percent:
			percent_sum += effect.value
		else:
			flat_sum += effect.value
	percent_sum = mini(percent_sum, 100)
	var reduction: int = mini(amount, floori(amount * percent_sum / 100.0) + flat_sum)
	return maxi(0, amount - reduction)


func take_damage(amount: int) -> int:
	var final_damage: int = mini(reduced_damage(amount), hp)
	hp -= final_damage
	if hp == 0:
		stack_counts.clear()
	return final_damage


func heal(amount: int) -> int:
	var healed: int = mini(amount, MAX_HP - hp)
	hp += healed
	return healed


func add_reduction(source_name: String, value: int, duration: int, is_percent: bool, invulnerable: bool, description: String = "") -> ActiveEffect:
	var effect: ActiveEffect = _new_effect(EffectData.Kind.DAMAGE_REDUCTION, source_name, duration)
	effect.value = value
	effect.is_percent = is_percent
	effect.invulnerable = invulnerable
	if description != "":
		effect.description = description
	elif invulnerable:
		effect.description = "Invulnerable"
	elif is_percent:
		effect.description = "%d%% damage reduction" % value
	else:
		effect.description = "%d damage reduction" % value
	effects.append(effect)
	return effect


func add_buff(source_name: String, value: int, duration: int, ability_names: Array[String], description: String = "") -> ActiveEffect:
	var effect: ActiveEffect = _new_effect(EffectData.Kind.BUFF, source_name, duration)
	effect.value = value
	effect.ability_names = ability_names.duplicate()
	effect.description = description if description != "" else "+%d damage to %s" % [value, ", ".join(ability_names)]
	effects.append(effect)
	return effect


func add_enable(source_name: String, duration: int, ability_names: Array[String], description: String = "") -> ActiveEffect:
	var effect: ActiveEffect = _new_effect(EffectData.Kind.ENABLE_ABILITY, source_name, duration)
	effect.ability_names = ability_names.duplicate()
	effect.description = description if description != "" else "Can use %s" % ", ".join(ability_names)
	effects.append(effect)
	return effect


func add_stun(source_name: String, duration: int, description: String = "") -> ActiveEffect:
	var effect: ActiveEffect = _new_effect(EffectData.Kind.STUN, source_name, duration)
	effect.description = description if description != "" else "Cannot act"
	effects.append(effect)
	return effect


func add_transform(source_name: String, used: AbilityState, replacement: AbilityData, duration: int, description: String = "") -> ActiveEffect:
	var slot: int = abilities.find(used)
	if slot == -1:
		return null
	var effect: ActiveEffect = _new_effect(EffectData.Kind.TRANSFORM, source_name, duration)
	effect.original_state = used
	effect.replacement_state = AbilityState.new(replacement)
	effect.description = description if description != "" else "%s becomes %s" % [used.data.display_name, replacement.display_name]
	abilities[slot] = effect.replacement_state
	effects.append(effect)
	return effect


func tick_cooldowns() -> void:
	for state: AbilityState in abilities:
		state.tick()
	for effect: ActiveEffect in effects:
		if effect.kind == EffectData.Kind.TRANSFORM:
			effect.original_state.tick()


func tick_effects() -> Array[ActiveEffect]:
	return _tick(false)


func tick_stuns() -> Array[ActiveEffect]:
	return _tick(true)


func _tick(stuns: bool) -> Array[ActiveEffect]:
	var expired: Array[ActiveEffect] = []
	var kept: Array[ActiveEffect] = []
	for effect: ActiveEffect in effects:
		if (effect.kind == EffectData.Kind.STUN) != stuns:
			kept.append(effect)
			continue
		effect.remaining -= 1
		if effect.remaining > 0:
			kept.append(effect)
		else:
			expired.append(effect)
	effects = kept
	for effect: ActiveEffect in expired:
		if effect.kind == EffectData.Kind.TRANSFORM:
			var slot: int = abilities.find(effect.replacement_state)
			if slot != -1:
				abilities[slot] = effect.original_state
	return expired


func _new_effect(kind: EffectData.Kind, source_name: String, duration: int) -> ActiveEffect:
	var effect: ActiveEffect = ActiveEffect.new()
	effect.kind = kind
	effect.source_name = source_name
	effect.remaining = duration
	return effect
