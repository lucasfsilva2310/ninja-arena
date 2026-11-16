#!/usr/bin/env bash
set -u

GODOT="${GODOT:-/mnt/c/Users/User/Desktop/Code/Godot_v4.7.2-stable_win64_console.exe}"
PROJ="$(wslpath -w "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)")"
OUT="$(mktemp)"
trap 'rm -f "$OUT"' EXIT

EXTRA=()
if [ -n "${DRIVE_SHOTS:-}" ]; then
	EXTRA+=(--shots "$(wslpath -w "$DRIVE_SHOTS")")
fi
if [ -n "${DRIVE_FAST:-}" ]; then
	EXTRA+=(--fast)
fi
if [ -n "${DRIVE_SEED:-}" ]; then
	EXTRA+=(--seed "$DRIVE_SEED")
fi

"$GODOT" --path "$PROJ" res://tools/drive_game.tscn -- "${EXTRA[@]}" > "$OUT" 2>&1
CODE=$?
tr -d '\r' < "$OUT" | tail -n +3
echo "== drive exit: $CODE =="

STATUS=0
if [ "$CODE" != "0" ]; then
	STATUS=1
fi
if grep -qE 'SCRIPT ERROR|ERROR:|DRIVE FAIL' "$OUT"; then
	echo "drive_game.sh: output contains an error line"
	STATUS=1
fi
if ! grep -q 'DRIVE OK' "$OUT"; then
	echo "drive_game.sh: no DRIVE OK line"
	STATUS=1
fi
exit "$STATUS"
