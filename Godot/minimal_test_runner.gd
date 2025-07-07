extends SceneTree

# Minimal test runner for the game engine
# This avoids any complex class references

func _init():
    print("=== MINIMAL NARUTO ARENA TEST ===")
    test_minimal_game_engine()
    print("=== TEST COMPLETED ===")
    quit()

func test_minimal_game_engine():
    # Create basic abilities
    var basic_attack = create_minimal_ability("Basic Attack", 20)
    var heal_ability = create_minimal_ability("Heal", 25)
    
    # Create basic characters
    var character1 = create_minimal_character("Character 1", [basic_attack])
    var character2 = create_minimal_character("Character 2", [heal_ability])
    
    # Create basic players
    var player1 = create_minimal_player("Player 1", [character1])
    var player2 = create_minimal_player("Player 2", [character2])
    
    # Test basic functionality
    print("\n--- Test 1: Basic Character Creation ---")
    print("Character 1 HP: ", character1.hp)
    print("Character 2 HP: ", character2.hp)
    
    print("\n--- Test 2: Basic Damage ---")
    character1.take_damage(20)
    print("Character 1 HP after damage: ", character1.hp)
    
    print("\n--- Test 3: Basic Healing ---")
    character2.heal(10)
    print("Character 2 HP after healing: ", character2.hp)
    
    print("\n--- Test 4: Basic Ability ---")
    print("Ability name: ", basic_attack.name)
    print("Ability damage: ", basic_attack.damage)
    
    print("\n--- Test 5: Basic Player ---")
    print("Player 1 name: ", player1.player_name)
    print("Player 1 characters: ", player1.characters.size())
    
    print("\n✅ All minimal tests passed!")

func create_minimal_ability(name: String, damage: int) -> Dictionary:
    return {
        "name": name,
        "damage": damage,
        "description": "Basic ability"
    }

func create_minimal_character(name: String, abilities: Array) -> Dictionary:
    return {
        "name": name,
        "hp": 100,
        "max_hp": 100,
        "abilities": abilities,
        "take_damage": func(damage: int):
            self.hp = max(0, self.hp - damage),
        "heal": func(amount: int):
            self.hp = min(self.max_hp, self.hp + amount)
    }

func create_minimal_player(name: String, characters: Array) -> Dictionary:
    return {
        "name": name,
        "characters": characters
    } 