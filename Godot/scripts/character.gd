class_name Character
extends Node

const MAX_HP: int = 100

var character_name: String
var hp: int = MAX_HP
var abilities: Array[Ability] = []
var active_effects: Array[Dictionary] = []

# Character effect types are now defined in character_effects.gd

func _init(character_name: String, base_abilities: Array[Ability]):
	self.character_name = character_name
	# Create abilities in memory so they won't conflict with database ones
	for ability in base_abilities:
		var new_ability = Ability.new(
			ability.name,
			ability.description,
			ability.required_chakra.duplicate(),
			ability.default_cooldown,
			ability.effects.duplicate(),
			ability.target,
			ability.is_permanent,
			ability.is_stacking
		)
		abilities.append(new_ability)

func is_alive() -> bool:
	return hp > 0

func get_hp() -> int:
	return hp

func get_max_hp() -> int:
	return MAX_HP

func is_at_max_hp() -> bool:
	return hp == MAX_HP

func set_hp(new_hp: int):
	hp = min(get_max_hp(), new_hp)

func is_invulnerable() -> bool:
	for effect in active_effects:
		if effect.has("type") and effect.type == "damage_reduction":
			if effect.damage_reduction.reduced_amount == INF:
				return true
	return false

func take_damage(damage: int, increased_damage: int = 0, game_engine: GameEngine = null):
	var total_damage: int = damage + increased_damage
	var damage_reduction: int = 0

	# Calculate damage reduction from active effects
	for effect in active_effects:
		if effect.has("type") and effect.type == "damage_reduction":
			if effect.damage_reduction.is_percent:
				# For percentage reduction, reduce the total damage
				var reduction = floor(total_damage * (effect.damage_reduction.reduced_amount / 100.0))
				damage_reduction = max(damage_reduction, reduction)
			else:
				# For flat reduction, reduce the total damage
				var reduction = min(total_damage, effect.damage_reduction.reduced_amount)
				damage_reduction = max(damage_reduction, reduction)

	# Apply damage reduction to total damage
	var final_damage = max(0, total_damage - damage_reduction)

	# Create history message
	if game_engine:
		var message: String = "%s received %d damage" % [character_name, damage]

		if increased_damage > 0:
			message += " with %d increased damage" % increased_damage

		if damage_reduction > 0:
			for effect in active_effects:
				if effect.has("type") and effect.type == "damage_reduction":
					var reduction_type = "%" if effect.damage_reduction.is_percent else ""
					message += ", reduced by %d%s" % [effect.damage_reduction.reduced_amount, reduction_type]
					break

		message += ". Final damage: %d" % final_damage
		game_engine.add_to_history(message)

	# Apply final damage
	set_hp(max(0, hp - final_damage))

func heal(amount: int, game_engine: GameEngine = null):
	var new_hp = min(MAX_HP, hp + amount)
	if game_engine:
		game_engine.add_to_history("%s was healed for %d. Current HP: %d" % [character_name, amount, new_hp])
	set_hp(new_hp)

func add_damage_reduction(ability: Ability, description: String, amount: int, remaining_turns: int, is_percent: bool, game_engine: GameEngine = null):
	if game_engine:
		var percent_symbol = "%" if is_percent else ""
		game_engine.add_to_history("%s received %d%s damage reduction for %d turns" % [character_name, amount, percent_symbol, remaining_turns])

	var effect = {
		"type": "damage_reduction",
		"name": ability.name,
		"description": description,
		"damage_reduction": {
			"reduced_amount": amount,
			"remaining_turns": remaining_turns,
			"is_percent": is_percent
		}
	}

	active_effects.append(effect)

func apply_transformation(original_ability: Ability, new_ability: Ability, duration: int, game_engine: GameEngine = null):
	if game_engine:
		game_engine.add_to_history("%s transformed ability from %s to %s for %d turns" % [character_name, original_ability.name, new_ability.name, duration])

	replace_ability(original_ability, new_ability)

	var effect = {
		"type": "transformation",
		"name": original_ability.name,
		"description": original_ability.description,
		"transformation": {
			"original_ability": original_ability,
			"new_ability": new_ability,
			"remaining_turns": duration
		}
	}

	active_effects.append(effect)

func revert_transformation(new_ability: Ability, game_engine: GameEngine = null):
	for effect in active_effects:
		if effect.has("type") and effect.type == "transformation":
			if effect.transformation.new_ability == new_ability:
				if game_engine:
					game_engine.add_to_history("%s reverted transformation from %s to %s" % [character_name, new_ability.name, effect.transformation.original_ability.name])
				
				replace_ability(new_ability, effect.transformation.original_ability)
				active_effects.erase(effect)
				break

func replace_ability(old_ability: Ability, new_ability: Ability, game_engine: GameEngine = null):
	for i in range(abilities.size()):
		if abilities[i] == old_ability:
			abilities[i] = new_ability
			if game_engine:
				game_engine.add_to_history("%s replaced %s with %s" % [character_name, old_ability.name, new_ability.name])
			break

func apply_buff(ability: Ability, buff: Dictionary, value: int, game_engine: GameEngine = null):
	if game_engine:
		game_engine.add_to_history("%s received %d buff on %s for %d turns" % [character_name, value, buff.buffed_abilities[0], buff.remaining_turns])

	var effect = {
		"type": "buff",
		"name": ability.name,
		"description": ability.description,
		"buff": {
			"buffed_abilities": buff.buffed_abilities,
			"buff_type": buff.buff_type,
			"remaining_turns": buff.remaining_turns,
			"value": value
		}
	}

	active_effects.append(effect)

func apply_enable_ability(ability: Ability, ability_names: Array[String], duration: int, game_engine: GameEngine = null):
	if game_engine:
		game_engine.add_to_history("%s can now use %s for %d turns" % [character_name, ability_names[0], duration])

	var effect = {
		"type": "enable_ability",
		"name": ability.name,
		"description": ability.description,
		"enabled_abilities": {
			"ability_names": ability_names,
			"remaining_turns": duration
		}
	}

	active_effects.append(effect)

func remove_active_effect(current_effect: Dictionary):
	for i in range(active_effects.size()):
		if active_effects[i].name == current_effect.name:
			active_effects.remove_at(i)
			break

func add_stun(ability: Ability, duration: int, game_engine: GameEngine = null):
	if game_engine:
		game_engine.add_to_history("%s is stunned for %d turns" % [character_name, duration])

	var effect = {
		"type": "stun",
		"name": ability.name,
		"description": ability.description,
		"stun": {
			"duration": duration
		}
	}

	active_effects.append(effect)

func is_stunned() -> bool:
	for effect in active_effects:
		if effect.has("type") and effect.type == "stun":
			return true
	return false

func can_use_ability(ability: Ability, chakras: Array[String]) -> bool:
	# Check if character is stunned
	if is_stunned():
		return false

	# Check if ability is on cooldown
	if ability.is_on_cooldown():
		return false

	# Check if ability is enabled (for abilities that need enablers)
	var is_enabled = true
	for effect in ability.effects:
		if effect.type == "Damage" and effect.has("needs_enabler"):
			var enabler_name = effect.needs_enabler
			var has_enabler = false
			
			for active_effect in active_effects:
				if active_effect.has("type") and active_effect.type == "enable_ability":
					if active_effect.enabled_abilities.ability_names.has(ability.name):
						has_enabler = true
						break
			
			if not has_enabler:
				is_enabled = false
				break

	return is_enabled

func get_available_abilities() -> Array[Ability]:
	var available_abilities: Array[Ability] = []
	
	for ability in abilities:
		if can_use_ability(ability, []):  # We'll handle chakra requirements separately
			available_abilities.append(ability)
	
	return available_abilities 
