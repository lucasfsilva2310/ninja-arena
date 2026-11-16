# Ninja Arena (Godot)

Godot 4.7.2, GL Compatibility renderer, 1280x720 window. The scripts call the Windows console build from WSL.

## Godot path

```bash
GODOT=/mnt/c/Users/User/Desktop/Code/Godot_v4.7.2-stable_win64_console.exe
```

The Windows exe cannot read Linux paths. Convert them with `wslpath -w`:

```bash
PROJ="$(wslpath -w /home/lucasfsilva2310/Projects/games/ninja-arena/godot)"
"$GODOT" --headless --path "$PROJ" --import
```

All scripts in `tools/` do this conversion. They read the `GODOT` environment variable and fall back to the path above.

## Run the tests

```bash
godot/tools/test.sh
```

The script imports the project, then runs every `res://tests/test_*.gd`. It exits 0 only when all tests pass and the output has no `SCRIPT ERROR` and no `ERROR:` line. Godot itself exits 0 after a parse error, so the output scan is required.

A test file extends `res://tools/test_case.gd`. Each method that starts with `test_` is one test. Helpers: `assert_eq`, `assert_ne`, `assert_true`, `assert_false`, `assert_null`.

## Capture a scene to a PNG

```bash
godot/tools/capture.sh res://tools/capture_sample.tscn out.png [frames]
```

The script opens the scene in a window, waits `frames` frames (default 3), saves the viewport, and quits.

## Run the game

```bash
godot/tools/run_game.sh
```
