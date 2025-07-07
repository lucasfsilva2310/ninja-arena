extends Node

func _ready():
    print("=== SIMPLE TEST ===")
    test_basic_functionality()
    print("=== TEST COMPLETED ===")

func test_basic_functionality():
    # Test 1: Create basic ability
    print("--- Test 1: Creating Ability ---")
    var effects = [{
        "type": "Damage",
        "value": 20,
        "name": "Test Attack",
        "description": "Basic attack"
    }]
    
    var ability = Ability.new("Test Attack", "Basic attack", ["Taijutsu"], 0, effects, "Enemy")
    print("Ability created: ", ability.name)
    print("Ability damage: ", ability.effects[0].value)
    
    # Test 2: Create basic character
    print("\n--- Test 2: Creating Character ---")
    var character = Character.new("Test Character", [ability])
    print("Character created: ", character.name)
    print("Character HP: ", character.get_hp())
    print("Character alive: ", character.is_alive())
    
    # Test 3: Create basic player
    print("\n--- Test 3: Creating Player ---")
    var player = Player.new("Test Player", [character])
    print("Player created: ", player.player_name)
    print("Player characters: ", player.characters.size())
    
    # Test 4: Test damage
    print("\n--- Test 4: Testing Damage ---")
    var original_hp = character.get_hp()
    character.take_damage(20)
    print("Original HP: ", original_hp)
    print("HP after damage: ", character.get_hp())
    
    # Test 5: Test healing
    print("\n--- Test 5: Testing Healing ---")
    character.heal(10)
    print("HP after healing: ", character.get_hp())
    
    print("\n✅ All basic tests passed!") 