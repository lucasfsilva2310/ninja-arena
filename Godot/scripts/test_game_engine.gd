extends Node

# Test script for the game engine
# This will create sample characters and abilities to test the core functionality

func _ready():
	print("=== NARUTO ARENA GAME ENGINE TEST ===")
	test_game_engine()
	print("=== TEST COMPLETED ===")

func test_game_engine():
	# Create sample abilities
	var naruto_kick = create_test_ability("Naruto Kick", 20, ["Taijutsu"])
	var rasengan = create_test_ability("Rasengan", 35, ["Ninjutsu"])
	var escape_clone = create_test_ability("Escape Clone", 0, ["Random"])
	
	# Create sample characters
	var naruto = Character.new("Naruto", [naruto_kick, rasengan, escape_clone])
	var sasuke = Character.new("Sasuke", [create_test_ability("Chidori", 30, ["Ninjutsu"])])
	var sakura = Character.new("Sakura", [create_test_ability("Heal", 25, ["Ninjutsu"])])
	
	# Create players
	var player1 = Player.new("Player 1", [naruto, sasuke, sakura])
	var player2 = Player.new("AI", [Character.new("Enemy 1", [create_test_ability("Attack", 15, ["Taijutsu"])])])
	
	# Create game engine
	var game_engine = GameEngine.new(player1, player2)
	
	# Test 1: Start game
	print("\n--- Test 1: Starting Game ---")
	game_engine.start_game()
	print("Turn: ", game_engine.turn)
	print("Current Player: ", game_engine.current_player.player_name)
	print("Player 1 HP: ", player1.characters[0].get_hp())
	print("Player 2 HP: ", player2.characters[0].get_hp())
	
	# Test 2: Add actions to queue
	print("\n--- Test 2: Adding Actions to Queue ---")
	var action = SelectedAction.new()
	action.attacker_player = player1
	action.attacker_character = player1.characters[0]
	action.attacker_ability = player1.characters[0].abilities[0]
	action.target_character = player2.characters[0]
	action.target_player = player2
	
	game_engine.add_selected_action(action)
	print("Actions in queue: ", game_engine.get_action_queue().size())
	
	# Test 3: Execute action
	print("\n--- Test 3: Executing Action ---")
	var success = game_engine.execute_action(0)
	print("Action executed successfully: ", success)
	print("Player 2 HP after attack: ", player2.characters[0].get_hp())
	
	# Test 4: Next turn
	print("\n--- Test 4: Next Turn ---")
	game_engine.next_turn(player2)
	print("Turn: ", game_engine.turn)
	print("Current Player: ", game_engine.current_player.player_name)
	
	# Test 5: AI turn
	print("\n--- Test 5: AI Turn ---")
	game_engine.execute_ai_turn()
	print("Player 1 HP after AI attack: ", player1.characters[0].get_hp())
	
	# Test 6: Game over check
	print("\n--- Test 6: Game Over Check ---")
	var game_over = game_engine.check_game_over()
	print("Game over: ", game_over)
	
	# Test 7: Character abilities
	print("\n--- Test 7: Character Abilities ---")
	var available_abilities = player1.characters[0].get_available_abilities()
	print("Available abilities for Naruto: ", available_abilities.size())
	for ability in available_abilities:
		print("  - ", ability.name)
	
	# Test 8: Damage and healing
	print("\n--- Test 8: Damage and Healing ---")
	var original_hp = player1.characters[0].get_hp()
	player1.characters[0].take_damage(20)
	print("HP after damage: ", player1.characters[0].get_hp())
	player1.characters[0].heal(10)
	print("HP after healing: ", player1.characters[0].get_hp())
	
	# Test 9: Action history
	print("\n--- Test 9: Action History ---")
	var history = game_engine.get_action_history()
	print("History entries: ", history.size())
	for entry in history:
		print("  ", entry)

func create_test_ability(name: String, damage: int, chakra_requirements: Array[String]) -> Ability:
	var effects: Array[Dictionary] = []
	if damage > 0:
		effects.append({
			"type": "Damage",
			"value": damage,
			"name": name,
			"description": "Deals " + str(damage) + " damage"
		})
	else:
		effects.append({
			"type": "DamageReduction",
			"damage_reduction": {
				"description": "Become invulnerable",
				"reduced_amount": INF,
				"duration": 1,
				"is_percent": false
			},
			"name": name,
			"description": "Become invulnerable for 1 turn"
		})
	
	return Ability.new(name, "Test ability", chakra_requirements, 0, effects, "Enemy") 
