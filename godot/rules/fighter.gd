class_name Fighter
extends RefCounted

const MAX_HP: int = 100

var data: CharacterData
var hp: int = MAX_HP
var abilities: Array[AbilityState] = []
var effects: Array[ActiveEffect] = []


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
		if effect.invulnerable:
			return true
	return false


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
	return final_damage


func heal(amount: int) -> int:
	var healed: int = mini(amount, MAX_HP - hp)
	hp += healed
	return healed


func add_reduction(source_name: String, value: int, duration: int, is_percent: bool, invulnerable: bool) -> void:
	var effect: ActiveEffect = ActiveEffect.new()
	effect.source_name = source_name
	effect.value = value
	effect.remaining = duration
	effect.is_percent = is_percent
	effect.invulnerable = invulnerable
	effects.append(effect)


func tick_cooldowns() -> void:
	for state: AbilityState in abilities:
		state.tick()


func tick_effects() -> Array[ActiveEffect]:
	var expired: Array[ActiveEffect] = []
	var kept: Array[ActiveEffect] = []
	for effect: ActiveEffect in effects:
		effect.remaining -= 1
		if effect.remaining > 0:
			kept.append(effect)
		else:
			expired.append(effect)
	effects = kept
	return expired
