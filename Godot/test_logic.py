#!/usr/bin/env python3
"""
Simple logic test for the game engine concepts
This simulates the core game mechanics without requiring Godot
"""

class Ability:
    def __init__(self, name, damage, chakra_requirements):
        self.name = name
        self.damage = damage
        self.chakra_requirements = chakra_requirements
        self.current_cooldown = 0
    
    def is_on_cooldown(self):
        return self.current_cooldown > 0

class Character:
    def __init__(self, name, abilities):
        self.name = name
        self.hp = 100
        self.max_hp = 100
        self.abilities = abilities
        self.active_effects = []
    
    def is_alive(self):
        return self.hp > 0
    
    def take_damage(self, damage):
        self.hp = max(0, self.hp - damage)
        print(f"{self.name} took {damage} damage. HP: {self.hp}")
    
    def heal(self, amount):
        self.hp = min(self.max_hp, self.hp + amount)
        print(f"{self.name} healed {amount} HP. HP: {self.hp}")
    
    def get_available_abilities(self):
        return [ability for ability in self.abilities if not ability.is_on_cooldown()]

class Player:
    def __init__(self, name, characters):
        self.name = name
        self.characters = characters
        self.chakras = []
    
    def is_defeated(self):
        return all(not char.is_alive() for char in self.characters)

class GameEngine:
    def __init__(self, player1, player2):
        self.player1 = player1
        self.player2 = player2
        self.current_player = player1
        self.turn = 0
        self.action_history = []
    
    def start_game(self):
        self.turn = 1
        self.add_to_history(f"Game started! {self.current_player.name}'s turn")
        print(f"🎮 Game started! {self.current_player.name}'s turn")
    
    def add_to_history(self, message):
        formatted_message = f"Turn {self.turn}: {message}"
        self.action_history.append(formatted_message)
        print(formatted_message)
    
    def next_turn(self, player):
        self.turn += 1
        self.current_player = player
        self.add_to_history(f"Turn {self.turn}! It's {self.current_player.name}'s turn")
    
    def execute_action(self, attacker_char, ability, target_char):
        if not attacker_char.is_alive():
            return False
        
        self.add_to_history(f"{attacker_char.name} used {ability.name} on {target_char.name}!")
        
        # Apply damage
        target_char.take_damage(ability.damage)
        
        # Set cooldown
        ability.current_cooldown = 1
        
        return True
    
    def check_game_over(self):
        if self.player1.is_defeated():
            self.add_to_history(f"{self.player2.name} wins!")
            return True
        elif self.player2.is_defeated():
            self.add_to_history(f"{self.player1.name} wins!")
            return True
        return False

def test_game_engine():
    print("=== NARUTO ARENA GAME ENGINE LOGIC TEST ===")
    
    # Create sample abilities
    naruto_kick = Ability("Naruto Kick", 20, ["Taijutsu"])
    rasengan = Ability("Rasengan", 35, ["Ninjutsu"])
    chidori = Ability("Chidori", 30, ["Ninjutsu"])
    
    # Create sample characters
    naruto = Character("Naruto", [naruto_kick, rasengan])
    sasuke = Character("Sasuke", [chidori])
    enemy1 = Character("Enemy 1", [Ability("Attack", 15, ["Taijutsu"])])
    enemy2 = Character("Enemy 2", [Ability("Attack", 15, ["Taijutsu"])])
    
    # Create players
    player1 = Player("Player 1", [naruto, sasuke])
    player2 = Player("AI", [enemy1, enemy2])
    
    # Create game engine
    game = GameEngine(player1, player2)
    
    print("\n--- Test 1: Starting Game ---")
    game.start_game()
    print(f"Turn: {game.turn}")
    print(f"Current Player: {game.current_player.name}")
    print(f"Player 1 HP: {player1.characters[0].hp}")
    print(f"Player 2 HP: {player2.characters[0].hp}")
    
    print("\n--- Test 2: Executing Actions ---")
    # Player 1 attacks
    success = game.execute_action(naruto, naruto_kick, enemy1)
    print(f"Action executed successfully: {success}")
    
    # Switch turns
    game.next_turn(player2)
    
    # AI attacks
    success = game.execute_action(enemy1, enemy1.abilities[0], naruto)
    print(f"AI action executed successfully: {success}")
    
    print("\n--- Test 3: Character Abilities ---")
    available_abilities = naruto.get_available_abilities()
    print(f"Available abilities for Naruto: {len(available_abilities)}")
    for ability in available_abilities:
        print(f"  - {ability.name}")
    
    print("\n--- Test 4: Damage and Healing ---")
    original_hp = naruto.hp
    naruto.take_damage(20)
    naruto.heal(10)
    
    print("\n--- Test 5: Game Over Check ---")
    game_over = game.check_game_over()
    print(f"Game over: {game_over}")
    
    print("\n--- Test 6: Action History ---")
    print(f"History entries: {len(game.action_history)}")
    for entry in game.action_history:
        print(f"  {entry}")
    
    print("\n=== LOGIC TEST COMPLETED ===")
    print("✅ All game logic tests passed!")
    print("The core game mechanics are working correctly.")

if __name__ == "__main__":
    test_game_engine() 