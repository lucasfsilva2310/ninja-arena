class_name Player
extends Node

var player_name: String
var characters: Array[Character] = []
var chakras: Array[String] = []

func _init(player_name: String, player_characters: Array[Character] = []):
    self.player_name = player_name
    characters = player_characters

func receive_chakra(turn: int, game_engine: GameEngine = null):
    var alive_characters = []
    for character in characters:
        if character.is_alive():
            alive_characters.append(character)

    var is_start_of_game = turn == 1

    if is_start_of_game:
        chakras = [generate_random_chakra()]
        if game_engine:
            game_engine.add_to_history("%s received initial chakra" % player_name)
        return

    var new_chakras = []
    for i in range(alive_characters.size()):
        new_chakras.append(generate_random_chakra())
    
    if game_engine:
        game_engine.add_to_history("%s received %d new chakra" % [player_name, new_chakras.size()])

    chakras.append_array(new_chakras)

func generate_random_chakra() -> String:
    var chakra_types = ["Ninjutsu", "Taijutsu", "Genjutsu", "Bloodline"]
    return chakra_types[randi() % chakra_types.size()]

func consume_chakra(chakra: String):
    var index = chakras.find(chakra)
    if index != -1:
        chakras.remove_at(index)

func transform_chakras(chakras_to_transform: Array[String], target_chakra: String, game_engine: GameEngine = null):
    for chakra in chakras_to_transform:
        consume_chakra(chakra)
    
    chakras.append(target_chakra)

    if game_engine:
        game_engine.add_to_history("%s transformed %d chakras into %s" % [player_name, chakras_to_transform.size(), target_chakra])

func get_chakra_count() -> Dictionary:
    var chakra_count = {
        "Ninjutsu": 0,
        "Taijutsu": 0,
        "Genjutsu": 0,
        "Bloodline": 0
    }
    
    for chakra in chakras:
        if chakra_count.has(chakra):
            chakra_count[chakra] += 1
    
    return chakra_count

func process_active_effects(game_engine: GameEngine = null):
    for character in characters:
        var effects_to_remove = []
        
        for i in range(character.active_effects.size()):
            var effect = character.active_effects[i]
            
            if effect.has("type") and effect.type == "damage_reduction":
                if not effect.damage_reduction.has("applied"):
                    effect.damage_reduction.applied = true
                else:
                    effect.damage_reduction.remaining_turns -= 1
                    if game_engine:
                        game_engine.add_to_history("%s's damage reduction from %s has %d turns remaining" % [
                            character.character_name, 
                            effect.name, 
                            effect.damage_reduction.remaining_turns
                        ])
                    
                    if effect.damage_reduction.remaining_turns <= 0:
                        effects_to_remove.append(i)
            
            elif effect.has("type") and effect.type == "transformation":
                if not effect.transformation.has("applied"):
                    character.apply_transformation(
                        effect.transformation.original_ability,
                        effect.transformation.new_ability,
                        effect.transformation.remaining_turns,
                        game_engine
                    )
                    effect.transformation.applied = true
                else:
                    effect.transformation.remaining_turns -= 1
                    if effect.transformation.remaining_turns == 0:
                        character.revert_transformation(
                            effect.transformation.new_ability,
                            game_engine
                        )
                        effects_to_remove.append(i)
                    elif game_engine:
                        game_engine.add_to_history("%s's transformation has %d turns remaining" % [
                            character.character_name,
                            effect.transformation.remaining_turns
                        ])
            
            elif effect.has("type") and effect.type == "buff":
                if not effect.buff.has("applied"):
                    effect.buff.applied = true
                else:
                    effect.buff.remaining_turns -= 1
                    if game_engine:
                        game_engine.add_to_history("%s's buff from %s has %d turns remaining" % [
                            character.character_name,
                            effect.name,
                            effect.buff.remaining_turns
                        ])
                    
                    if effect.buff.remaining_turns <= 0:
                        effects_to_remove.append(i)
            
            elif effect.has("type") and effect.type == "enable_ability":
                if not effect.enabled_abilities.has("applied"):
                    effect.enabled_abilities.applied = true
                else:
                    effect.enabled_abilities.remaining_turns -= 1
                    if game_engine:
                        game_engine.add_to_history("%s's enabling effect for %s has %d turns remaining" % [
                            character.character_name,
                            effect.enabled_abilities.ability_names.join(", "),
                            effect.enabled_abilities.remaining_turns
                        ])
                    
                    if effect.enabled_abilities.remaining_turns <= 0:
                        effects_to_remove.append(i)
        
        # Remove expired effects (in reverse order to maintain indices)
        for i in range(effects_to_remove.size() - 1, -1, -1):
            character.active_effects.remove_at(effects_to_remove[i])

func process_cooldowns(game_engine: GameEngine = null):
    for character in characters:
        for ability in character.abilities:
            if ability.is_on_cooldown():
                ability.current_cooldown -= 1
                if ability.current_cooldown == 0 and game_engine:
                    game_engine.add_to_history("%s's ability %s is now ready" % [character.character_name, ability.name])

func choose_ability(character: Character) -> Ability:
    var available_abilities = []
    for ability in character.abilities:
        if ability.can_use(character, chakras):
            available_abilities.append(ability)
    
    return available_abilities[0] if available_abilities.size() > 0 else null

func is_defeated() -> bool:
    for character in characters:
        if character.is_alive():
            return false
    return true 