class_name Ability
extends Resource

var current_cooldown: int = 0

var name: String
var description: String
var required_chakra: Array[String]
var default_cooldown: int
var effects: Array[Dictionary]
var target: String
var is_permanent: bool = false
var is_stacking: bool = false

func _init(ability_name: String, ability_description: String, chakra_requirements: Array[String], cooldown: int, ability_effects: Array[Dictionary], target_type: String, permanent: bool = false, stacking: bool = false):
    name = ability_name
    description = ability_description
    required_chakra = chakra_requirements
    default_cooldown = cooldown
    effects = ability_effects
    target = target_type
    is_permanent = permanent
    is_stacking = stacking
    
    # Set default name and description for effects
    for effect in effects:
        if not effect.has("name"):
            effect.name = name
        if not effect.has("description"):
            effect.description = description

func can_use(char: Character, chakras: Array[String]) -> bool:
    if is_on_cooldown():
        return false
    if not char.is_alive():
        return false

    # Check if this ability needs an enabler
    var needs_enabler_effect = null
    for effect in effects:
        if effect.type == "Damage" and effect.has("needs_enabler"):
            needs_enabler_effect = effect
            break
    
    if needs_enabler_effect:
        var enabler_name = needs_enabler_effect.needs_enabler
        var is_enabled = false
        
        for effect in char.active_effects:
            if effect.has("type") and effect.type == "enable_ability":
                if effect.name == enabler_name or effect.enabled_abilities.ability_names.has(name):
                    is_enabled = true
                    break
        
        if not is_enabled:
            return false

    # Map with available chakras
    var available_chakras: Dictionary = {}
    for chakra in chakras:
        if not available_chakras.has(chakra):
            available_chakras[chakra] = 0
        available_chakras[chakra] += 1

    # Map with needed chakras
    var required_chakras: Dictionary = {}
    for chakra in required_chakra:
        if not required_chakras.has(chakra):
            required_chakras[chakra] = 0
        required_chakras[chakra] += 1

    # Check if has enough chakra
    for chakra in required_chakras.keys():
        if chakra == "Random":
            continue  # Ignore random
        
        var required_amount = required_chakras[chakra]
        var available_amount = available_chakras.get(chakra, 0)
        if available_amount < required_amount:
            return false

    # Deal with random
    var total_required_chakras = required_chakra.size()
    var total_available_chakras = chakras.size()

    return total_available_chakras >= total_required_chakras

func apply_effect(character: Character, ability: Ability, target: Character, game_engine: GameEngine = null):
    for effect in effects:
        match effect.type:
            "Damage":
                var increased_damage = 0
                for active_effect in character.active_effects:
                    if active_effect.has("type") and active_effect.type == "buff":
                        if active_effect.buff.buffed_abilities.has(ability.name):
                            increased_damage += active_effect.buff.value
                
                target.take_damage(effect.value, increased_damage, game_engine)
            
            "Heal":
                target.heal(effect.value, game_engine)
            
            "DamageReduction":
                target.add_damage_reduction(
                    ability,
                    effect.damage_reduction.description,
                    effect.damage_reduction.reduced_amount,
                    effect.damage_reduction.duration,
                    effect.damage_reduction.get("is_percent", false),
                    game_engine
                )
            
            "Transform":
                if effect.has("value") and effect.value > 0:
                    target.take_damage(effect.value, 0, game_engine)
                
                character.apply_transformation(
                    ability,
                    effect.transformation,
                    effect.get("duration", 1),
                    game_engine
                )
            
            "Buff":
                character.apply_buff(ability, effect.buff, effect.value, game_engine)
            
            "EnableAbility":
                if effect.has("duration"):
                    character.apply_enable_ability(
                        ability,
                        effect.enabled_abilities,
                        effect.duration,
                        game_engine
                    )
            
            "Stun":
                target.add_stun(ability, effect.duration, game_engine)

        if not is_on_cooldown():
            # Add one because process_cooldown from game_engine already subtracts 1 after executing the turn
            current_cooldown = default_cooldown + 1

        if current_cooldown == 0:
            character.remove_active_effect(effect)

func is_on_cooldown() -> bool:
    return current_cooldown > 0

func clone() -> Ability:
    return Ability.new(
        name,
        description,
        required_chakra.duplicate(),
        default_cooldown,
        effects.duplicate(),
        target,
        is_permanent,
        is_stacking
    ) 