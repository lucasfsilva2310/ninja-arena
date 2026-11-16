# Ninja Arena

A 3v3 turn-based ninja card battle. You play against the AI. The game runs in Godot 4.7.2 on the desktop.

- `godot/` is the game. Start here.
- `React/` is the old web version. It stays as a behavior reference. Nobody edits it.
- `docs/` holds the migration plan and the report of each step.

## Play

1. Install Godot 4.7.2 (standard build).
2. Open `godot/project.godot` in the Godot editor and press F5.
   Or run `godot/tools/run_game.sh` from a WSL shell. Set `GODOT` to your Godot path first if it differs from the default in the script.
3. Pick 3 of 4 characters. Press Start.
4. In battle, click an ability, click a target, then press End Turn. Details are in `godot/README.md`.

## Test

```bash
godot/tools/test.sh
```

The script exits 0 only when every test passes and the output has no `SCRIPT ERROR` or `ERROR:` line.
