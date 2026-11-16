# Ninja Arena (Godot)

Godot 4.7.2, GL Compatibility renderer, 1280x720 base window. The window scales to any size.
The scripts in `tools/` call the Godot console build from WSL.

## How to play

- Pick 3 characters on the select screen. Click a card to pick it. Click a slot to remove it. Press Start.
- Each turn you get chakra. Turn 1 gives 1 chakra. Later turns give 1 chakra per living character.
- Click an ability, then click a highlighted fighter. The action goes to the queue. Each fighter queues 1 action.
- Abilities on yourself, or on all allies or all enemies, queue at once when you click them.
- Click X in the queue to remove an action. Press End Turn to run the queue.
- Cost slots marked "Random" accept any chakra. A window asks which chakra to pay when you have a choice.
- Exchange chakra: pick 5 chakras and 1 type. The 5 become 1 chakra of that type.
- The turn timer is 60 seconds. At zero the turn ends with the queue as it is.
- Surrender ends the battle as a loss. History shows every event. Escape closes a window.
- Speed (top left) switches the animation speed between Normal and Fast.
- Win by defeating all 3 enemies. If both teams fall in one turn, the result is a draw.

## Run

```bash
godot/tools/run_game.sh
```

Or open `godot/project.godot` in the Godot editor and press F5.

The Godot path comes from the `GODOT` variable. The default is:

```bash
GODOT=/mnt/c/Users/User/Desktop/Code/Godot_v4.7.2-stable_win64_console.exe
```

The Windows exe cannot read Linux paths. The scripts convert paths with `wslpath -w`.

## Run the tests

```bash
godot/tools/test.sh
```

The script imports the project, then runs every `res://tests/test_*.gd`. It exits 0 only when all tests pass and the output has no `SCRIPT ERROR` and no `ERROR:` line. Godot itself exits 0 after a parse error, so the output scan is required.

A test file extends `res://tools/test_case.gd`. Each method that starts with `test_` is one test. Helpers: `assert_eq`, `assert_ne`, `assert_true`, `assert_false`, `assert_null`.

## Play the real app by script

```bash
godot/tools/drive_game.sh
```

The driver opens the real app in a window and sends real mouse events. It plays a full game and checks the layout, the locks, the modals, and the sprites after each turn.

| Variable | Effect |
|---|---|
| `DRIVE_FAST=1` | Skip animations. A game takes about 10 seconds. |
| `DRIVE_SEED=n` | Seed of the match. |
| `DRIVE_SHOTS=dir` | Save screenshots in `dir`. |
| `DRIVE_COVER=1` | Play every ability of every character at least once, in as many games as needed. |

## Other tools

```bash
godot/tools/capture.sh res://tools/capture_battle_demo.tscn out.png [frames]   # scene to PNG, CAPTURE_SIZE=1920x1080 sets the window size
godot/tools/gallery.sh                                                           # plays every ability animation
```

The gallery plays 17 animations: 16 content abilities plus Backflip, which Primary Lotus transforms into. Hidden Lotus is the 17th file.

## Project structure

| Folder | Content |
|---|---|
| `rules/` | Game rules. No nodes, no scenes. `Battle`, `Fighter`, `ChakraPool`, `ActionQueue`, `AiPlayer`. Randomness only through `Rng`. |
| `content/` | `.tres` files for 16 abilities and 4 characters. `tools/generate_content.gd` writes them. |
| `anim/` | Sprite frames, `TurnPlayer` and `AnimatedTurnPlayer` (they play the event list), `BattleStage`, `AnimConfig`. |
| `ui/` | Scenes and Control scripts. `battle_view.gd` is the battle screen. `modals/` holds the four modals. |
| `assets/` | Sprites, avatars, backgrounds, icons, fonts. |
| `tests/` | Test files. `builders.gd` and `ui_helpers.gd` are helpers. |
| `tools/` | Test runner, capture, drive and gallery tools. |

Data flow: the UI sends a command to the rules. The rules resolve the whole turn and return an event list. The `TurnPlayer` plays that list. The UI never changes rules state directly.

## Rules decisions that differ from React

See `docs/godot-migration.md`, section "Decided rules".
