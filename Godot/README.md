# Naruto Arena - Godot Migration

This directory contains the Godot version of the Naruto Arena game, migrated from the original React/TypeScript web application.

## Project Structure

```
Godot/
├── project.godot          # Godot project configuration
├── migration.md           # Detailed migration strategy and progress
├── scripts/              # GDScript files
│   ├── game_engine.gd    # Core game logic
│   ├── character.gd      # Character model
│   ├── ability.gd        # Ability system
│   └── player.gd         # Player model
├── scenes/               # Godot scene files (to be created)
├── assets/               # Game assets (to be added)
│   ├── characters/       # Character sprites and data
│   ├── abilities/        # Ability effects and icons
│   └── ui/              # UI elements and themes
└── README.md            # This file
```

## Migration Status

### ✅ Phase 1: Core Game Logic (COMPLETED)

- [x] GameEngine class migrated to GDScript
- [x] Character model migrated to GDScript
- [x] Ability system migrated to GDScript
- [x] Player model migrated to GDScript
- [x] Basic project structure created

### 🔄 Phase 2: UI Development (IN PROGRESS)

- [ ] Create character selection screen
- [ ] Build battle interface
- [ ] Design HUD for game state
- [ ] Implement ability selection UI
- [ ] Add health bars and status indicators

### ⏳ Phase 3: Visual Polish (PENDING)

- [ ] Add character sprites and animations
- [ ] Implement jutsu visual effects
- [ ] Add sound effects and music
- [ ] Create particle effects for abilities
- [ ] Design UI themes and styling

### ⏳ Phase 4: Multiplayer (PENDING)

- [ ] Set up Godot's networking system
- [ ] Implement lobby system
- [ ] Add real-time combat synchronization
- [ ] Create matchmaking system
- [ ] Handle player disconnections

## Getting Started

### Prerequisites

- **Godot 4.x** (latest stable version)
- Basic knowledge of GDScript (similar to Python)

### Setup Instructions

1. **Install Godot 4.x**

   - Download from: https://godotengine.org/download
   - Extract and run the executable

2. **Open the Project**

   - Launch Godot
   - Click "Import" or "Open"
   - Navigate to this `Godot/` folder
   - Select the `project.godot` file

3. **Explore the Code**

   - Open the `scripts/` folder in the FileSystem panel
   - Start with `game_engine.gd` to understand the core logic
   - Review `character.gd` and `ability.gd` for game mechanics

4. **Test the Game Engine**

   - **Option A: Run in Godot Editor**

     - Press F5 or click the "Play" button
     - Check the Output panel for test results

   - **Option B: Run from Command Line**

     ```bash
     cd Godot
     ./run_test.sh
     ```

   - **Option C: Direct Godot Command**
     ```bash
     cd Godot
     godot --script test_runner.gd
     ```

5. **Expected Test Output**
   The test will run 9 different scenarios:

   - Game initialization
   - Action queue management
   - Combat execution
   - Turn progression
   - AI behavior
   - Game over conditions
   - Character abilities
   - Damage/healing mechanics
   - Action history tracking

6. **Alternative Testing (No Godot Required)**
   If you don't have Godot installed, you can still test the code:

   **Syntax Check:**

   ```bash
   python3 test_syntax.py
   ```

   **Logic Test:**

   ```bash
   python3 test_logic.py
   ```

   These scripts verify that the GDScript code is syntactically correct and that the game logic works as expected.

## Key Differences from Web Version

### Architecture Changes

- **React Components** → **Godot Control Nodes**
- **TypeScript** → **GDScript**
- **CSS Styling** → **Godot Theme System**
- **State Management (XState)** → **Godot Signals**

### Language Comparison

**TypeScript (Original):**

```typescript
class GameEngine {
  private turn: number = 0;
  private currentPlayer: Player;

  startGame(): void {
    this.turn++;
    this.addToHistory(`Game started! Turn ${this.turn}`);
  }
}
```

**GDScript (Godot):**

```gdscript
class_name GameEngine
extends Node

var turn: int = 0
var current_player: Player

func start_game():
    turn += 1
    add_to_history("Game started! Turn %d" % turn)
```

## Development Guidelines

### Code Style

- Use **snake_case** for variables and functions (GDScript convention)
- Use **PascalCase** for class names
- Add type hints where possible: `var health: int = 100`
- Use Godot's built-in signals for event handling

### File Organization

- Keep related functionality in the same script file
- Use Godot's scene system for UI components
- Organize assets in appropriate subdirectories

### Performance Considerations

- Use Godot's built-in memory management
- Implement object pooling for frequently created objects
- Monitor performance with Godot's profiler

## Next Steps

1. **Create UI Scenes**

   - Design character selection screen
   - Build battle interface
   - Add HUD elements

2. **Add Visual Assets**

   - Character sprites and portraits
   - Ability icons and effects
   - UI themes and styling

3. **Implement Game Flow**

   - Connect UI to game logic
   - Add input handling
   - Create game state management

4. **Testing and Polish**
   - Test all game mechanics
   - Add sound effects and music
   - Optimize performance

## Resources

- **Godot Documentation**: https://docs.godotengine.org/
- **GDScript Reference**: https://docs.godotengine.org/en/stable/tutorials/scripting/gdscript/
- **Godot Discord**: https://discord.gg/4JBkykG
- **Godot Forums**: https://forum.godotengine.org/

## Contributing

When contributing to this migration:

1. Follow the existing code style and patterns
2. Test your changes thoroughly
3. Update the migration status in `migration.md`
4. Document any new features or changes

## License

This project follows the same license as the original Naruto Arena project.
