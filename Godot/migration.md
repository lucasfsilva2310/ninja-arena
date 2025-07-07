# Naruto Arena - Godot Migration Strategy

## Overview

This document outlines the migration strategy for converting the Naruto Arena web application to a Godot game engine project.

## Current Architecture

```
React (Frontend) ↔ Node.js/Express (Backend) ↔ Socket.io (Multiplayer)
```

## Target Architecture

```
Godot (Game Engine) ↔ Godot's built-in networking ↔ WebSocket/ENet
```

## Framework/Tools Migration Map

### Frontend → Godot

| Current Technology        | Godot Equivalent         | Purpose                         |
| ------------------------- | ------------------------ | ------------------------------- |
| React Components          | Control Nodes (UI)       | User interface elements         |
| TypeScript                | GDScript                 | Game logic and scripting        |
| CSS Styling               | Theme System             | Visual styling and theming      |
| State Management (XState) | Godot's built-in signals | State management and events     |
| Vite Build System         | Godot's export system    | Project building and deployment |
| HTML Canvas               | Godot's 2D/3D rendering  | Graphics and animations         |

### Backend → Godot

| Current Technology | Godot Equivalent                 | Purpose                  |
| ------------------ | -------------------------------- | ------------------------ |
| Node.js/Express    | Godot's built-in networking      | Server functionality     |
| Socket.io          | WebSocket/ENet                   | Real-time communication  |
| Redis              | Godot's built-in data structures | Data caching and storage |
| Fastify            | Godot's HTTP server              | REST API endpoints       |

### Game Logic

| Current Technology | Godot Equivalent               | Purpose                  |
| ------------------ | ------------------------------ | ------------------------ |
| Custom Game Engine | Godot's Scene System           | Game architecture        |
| Character Models   | Godot's Node system            | Character representation |
| Ability System     | GDScript classes               | Combat mechanics         |
| Turn-based Logic   | Custom GDScript implementation | Game flow control        |

## Migration Phases

### Phase 1: Core Game Logic ✅ COMPLETED

**Goal**: Convert the game engine and core systems to GDScript

**Tasks**:

- [x] Convert GameEngine class to GDScript
- [x] Migrate Character model
- [x] Migrate Ability system
- [x] Migrate Player model
- [x] Implement basic turn-based combat
- [x] Set up project structure

**Files to migrate**:

- `client/src/models/game-engine.ts` → `Godot/scripts/game_engine.gd`
- `client/src/models/character/character.model.ts` → `Godot/scripts/character.gd`
- `client/src/models/ability/ability.model.ts` → `Godot/scripts/ability.gd`
- `client/src/models/player.model.ts` → `Godot/scripts/player.gd`

### Phase 2: UI Development

**Goal**: Create user interface using Godot's Control system

**Tasks**:

- [ ] Create character selection screen
- [ ] Build battle interface
- [ ] Design HUD for game state
- [ ] Implement ability selection UI
- [ ] Add health bars and status indicators

### Phase 3: Visual Polish

**Goal**: Add visual elements and animations

**Tasks**:

- [ ] Add character sprites and animations
- [ ] Implement jutsu visual effects
- [ ] Add sound effects and music
- [ ] Create particle effects for abilities
- [ ] Design UI themes and styling

### Phase 4: Multiplayer

**Goal**: Implement multiplayer functionality

**Tasks**:

- [ ] Set up Godot's networking system
- [ ] Implement lobby system
- [ ] Add real-time combat synchronization
- [ ] Create matchmaking system
- [ ] Handle player disconnections

## Phase 1 Implementation

### Game Engine Migration

The core `GameEngine` class has been converted to GDScript. Here's the implementation:

```gdscript
# Godot/scripts/game_engine.gd
class_name GameEngine
extends Node

# Game state
var turn: int = 0
var current_player: Player
var action_history: Array[String] = []
var action_queue: Array[SelectedAction] = []

# Players
var player1: Player
var player2: Player

# Signals for UI updates
signal state_changed()
signal game_over(winner: String)

# Action structure
class SelectedAction:
    var attacker_player: Player
    var attacker_character: Character
    var attacker_ability: Ability
    var target_character: Character
    var target_player: Player

func _init(p1: Player, p2: Player):
    player1 = p1
    player2 = p2
    current_player = player1

# Observer pattern for state changes
func subscribe(listener: Callable) -> Callable:
    state_changed.connect(listener)
    return func(): state_changed.disconnect(listener)

func notify_state_change():
    state_changed.emit()

# Action queue management
func add_selected_action(action: SelectedAction):
    action_queue.append(action)
    notify_state_change()

func remove_selected_action(index: int):
    if index >= 0 and index < action_queue.size():
        action_queue.remove_at(index)
        notify_state_change()

func get_action_queue() -> Array[SelectedAction]:
    return action_queue.duplicate()

func clear_action_queue():
    action_queue.clear()
    notify_state_change()

func add_to_history(message: String):
    var formatted_message = "Turn %d: %s" % [turn, message]
    print(formatted_message)
    action_history.append(formatted_message)

func start_game():
    add_to_history("🎮 Game started! %s's turn" % player1.name)
    next_turn(player1)

func next_turn(player: Player):
    turn += 1
    current_player = player
    add_to_history("🎮 Turn %d! It's %s's turn" % [turn, current_player.name])

    player.receive_chakra(turn, self)
    player.process_cooldowns(self)
    player.process_active_effects(self)

    # Clear action queue when turn changes
    clear_action_queue()
    notify_state_change()

# Chakra transformation
func transform_chakras(player: Player, chakras_to_transform: Array, target_chakra: String):
    player.transform_chakras(chakras_to_transform, target_chakra, self)
    notify_state_change()

# Execute a single action
func execute_action(action_index: int) -> bool:
    if action_index >= action_queue.size():
        add_to_history("Action at index %d not found." % action_index)
        return false

    var action = action_queue[action_index]

    if action.attacker_character.is_alive():
        # Check if ability needs an enabler
        var needs_enabler_effect = null
        for effect in action.attacker_ability.effects:
            if effect.type == "Damage" and effect.has("needs_enabler"):
                needs_enabler_effect = effect
                break

        if needs_enabler_effect:
            var enabler_name = needs_enabler_effect.needs_enabler
            var is_enabled = false

            for effect in action.attacker_character.active_effects:
                if effect.has("enabled_abilities") and effect.name == enabler_name:
                    is_enabled = true
                    break

            if not is_enabled:
                add_to_history("%s tried to use %s but it requires %s to be active." % [
                    action.attacker_character.name,
                    action.attacker_ability.name,
                    enabler_name
                ])
                return false

        # Check for heal ability
        var is_heal_ability = false
        for effect in action.attacker_ability.effects:
            if effect.type == "Heal":
                is_heal_ability = true
                break

        if is_heal_ability:
            var target = action.target_character
            if target.is_at_max_hp():
                add_to_history("%s is already at max HP." % target.name)
                return false

        add_to_history("%s used %s on %s!" % [
            action.attacker_character.name,
            action.attacker_ability.name,
            action.target_character.name
        ])

        # Consume specific chakras
        for chakra in action.attacker_ability.required_chakra:
            if chakra != "Random":
                action.attacker_player.consume_chakra(chakra)

        # Handle random chakras for AI
        var random_chakra_count = 0
        for chakra in action.attacker_ability.required_chakra:
            if chakra == "Random":
                random_chakra_count += 1

        if random_chakra_count > 0 and action.attacker_player == player2:
            var available_chakras = action.attacker_player.chakras.duplicate()

            for i in range(random_chakra_count):
                if available_chakras.size() > 0:
                    var random_index = randi() % available_chakras.size()
                    var chakra_to_consume = available_chakras[random_index]
                    action.attacker_player.consume_chakra(chakra_to_consume)
                    available_chakras.remove_at(random_index)

        # Apply ability effect
        action.attacker_ability.apply_effect(
            action.attacker_character,
            action.attacker_ability,
            action.target_character,
            self
        )

        notify_state_change()
        return true

    return false

# Execute entire turn
func execute_turn():
    var actions = action_queue.duplicate()

    if actions.size() == 0:
        add_to_history("No actions to execute.")
        return

    # Execute all actions in queue
    for i in range(actions.size()):
        execute_action(i)

    # Switch turns
    var next_player = player2 if current_player == player1 else player1
    next_turn(next_player)

# AI turn generation
func generate_ai_actions() -> Array[SelectedAction]:
    var actions: Array[SelectedAction] = []

    # Simple AI: use random abilities on random targets
    for character in player2.characters:
        if character.is_alive():
            var available_abilities = character.get_available_abilities()
            if available_abilities.size() > 0:
                var random_ability = available_abilities[randi() % available_abilities.size()]
                var target = get_random_target(player1)

                var action = SelectedAction.new()
                action.attacker_player = player2
                action.attacker_character = character
                action.attacker_ability = random_ability
                action.target_character = target
                action.target_player = player1

                actions.append(action)

    return actions

func get_random_target(player: Player) -> Character:
    var alive_characters = []
    for character in player.characters:
        if character.is_alive():
            alive_characters.append(character)

    if alive_characters.size() > 0:
        return alive_characters[randi() % alive_characters.size()]
    return null

# Execute AI turn
func execute_ai_turn():
    var ai_actions = generate_ai_actions()

    for action in ai_actions:
        add_selected_action(action)

    execute_turn()

# Game over check
func check_game_over() -> bool:
    var player1_alive = false
    var player2_alive = false

    for character in player1.characters:
        if character.is_alive():
            player1_alive = true
            break

    for character in player2.characters:
        if character.is_alive():
            player2_alive = true
            break

    if not player1_alive or not player2_alive:
        var winner = player2.name if not player1_alive else player1.name
        game_over.emit(winner)
        return true

    return false

func get_action_history() -> Array[String]:
    return action_history.duplicate()
```

### Next Steps for Phase 1

1. **Create the project structure**:

   ```
   Godot/
   ├── project.godot
   ├── scripts/
   │   ├── game_engine.gd
   │   ├── character.gd
   │   ├── ability.gd
   │   ├── player.gd
   │   └── chakra.gd
   ├── scenes/
   │   ├── main.tscn
   │   ├── character_selection.tscn
   │   └── battle.tscn
   └── assets/
       ├── characters/
       ├── abilities/
       └── ui/
   ```

2. **Migrate remaining core classes**:

   - Character model
   - Ability system
   - Player model
   - Chakra system

3. **Set up basic project configuration**

## Development Environment Setup

### Required Tools

- **Godot 4.x** (latest stable version)
- **Git** (for version control)
- **Text editor** (VS Code with Godot extension recommended)

### Project Configuration

- Use **GDScript** as primary language
- Enable **C#** support (optional, for advanced features)
- Configure **export settings** for target platforms

## Testing Strategy

### Unit Testing

- Use Godot's built-in testing framework
- Test core game logic independently
- Verify ability interactions and combat mechanics

### Integration Testing

- Test complete game flow
- Verify UI interactions
- Test multiplayer functionality

## Performance Considerations

### Optimization Targets

- **60 FPS** for smooth gameplay
- **< 100ms** response time for UI interactions
- **< 50ms** for network operations

### Memory Management

- Use Godot's built-in memory management
- Implement proper object pooling for frequently created objects
- Monitor memory usage during gameplay

## Deployment Strategy

### Target Platforms

1. **Desktop**: Windows, macOS, Linux
2. **Web**: HTML5 export
3. **Mobile**: Android, iOS (future consideration)

### Build Process

1. Configure export settings for each platform
2. Set up automated build pipeline
3. Implement version management
4. Configure deployment scripts

---

_This migration document will be updated as the project progresses through each phase._
