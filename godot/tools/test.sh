#!/usr/bin/env bash
set -u

GODOT="${GODOT:-/mnt/c/Users/User/Desktop/Code/Godot_v4.7.2-stable_win64_console.exe}"
PROJ="$(wslpath -w "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)")"
OUT="$(mktemp)"
trap 'rm -f "$OUT"' EXIT

{
	"$GODOT" --headless --path "$PROJ" --import 2>&1
	echo "== import exit: $? =="
	"$GODOT" --headless --path "$PROJ" -s res://tools/test_runner.gd 2>&1
	echo "== run exit: $? =="
} | tr -d '\r' | tee "$OUT"

IMPORT_CODE="$(grep -o '== import exit: [0-9]* ==' "$OUT" | grep -o '[0-9]*')"
RUN_CODE="$(grep -o '== run exit: [0-9]* ==' "$OUT" | grep -o '[0-9]*')"

STATUS=0
if [ "$IMPORT_CODE" != "0" ] || [ "$RUN_CODE" != "0" ]; then
	echo "test.sh: Godot exit code non-zero (import=$IMPORT_CODE run=$RUN_CODE)"
	STATUS=1
fi
if grep -qE 'SCRIPT ERROR|ERROR:' "$OUT"; then
	echo "test.sh: output contains SCRIPT ERROR or ERROR:"
	STATUS=1
fi
if ! grep -q '^Tests: ' "$OUT"; then
	echo "test.sh: no test summary found"
	STATUS=1
fi
exit "$STATUS"
