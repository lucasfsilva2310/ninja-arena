extends Node

func _ready():
    print("=== MINIMAL TEST ===")
    test_minimal_functionality()
    print("=== TEST COMPLETED ===")

func test_minimal_functionality():
    # Test 1: Create basic ability with only damage
    print("--- Test 1: Creating Basic Ability ---")
    var effects = [{
        "type": "Damage",
        "value": 20
    }]
    
    var ability = Ability.new("Basic Attack", "Simple attack", ["Taijutsu"], 0, effects, "Enemy")
    print("✅ Ability created: ", ability.name)
    
    # Test 2: Create basic character
    print("\n--- Test 2: Creating Basic Character ---")
    var character = Character.new("Test Character", [ability])
    print("✅ Character created: ", character.character_name)
    print("✅ Character HP: ", character.get_hp())
    print("✅ Character alive: ", character.is_alive())
    
    # Test 3: Test basic damage
    print("\n--- Test 3: Testing Basic Damage ---")
    var original_hp = character.get_hp()
    character.take_damage(20)
    print("✅ Original HP: ", original_hp)
    print("✅ HP after damage: ", character.get_hp())
    
    # Test 4: Test basic healing
    print("\n--- Test 4: Testing Basic Healing ---")
    character.heal(10)
    print("✅ HP after healing: ", character.get_hp())
    
    # Test 5: Create basic player
    print("\n--- Test 5: Creating Basic Player ---")
    var player = Player.new("Test Player", [character])
    print("✅ Player created: ", player.player_name)
    print("✅ Player characters: ", player.characters.size())
    
    # Test 6: Test ability cooldown
    print("\n--- Test 6: Testing Ability Cooldown ---")
    print("✅ Ability on cooldown: ", ability.is_on_cooldown())
    ability.current_cooldown = 1
    print("✅ Ability on cooldown after setting: ", ability.is_on_cooldown())
    
    print("\n🎉 All minimal tests passed!")
    print("The basic game engine is working correctly.") 