#!/usr/bin/env bash
set -u

GODOT="${GODOT:-/mnt/c/Users/User/Desktop/Code/Godot_v4.7.2-stable_win64_console.exe}"
PROJ="$(wslpath -w "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)")"
OUT="$(mktemp)"
trap 'rm -f "$OUT"' EXIT

EXTRA=()
if [ -n "${GALLERY_FAST:-}" ]; then
	EXTRA+=(--fast)
fi
if [ -n "${GALLERY_SHOTS:-}" ]; then
	EXTRA+=(--shots "$(wslpath -w "$GALLERY_SHOTS")")
fi
if [ -n "${GALLERY_ONLY:-}" ]; then
	EXTRA+=(--only "$GALLERY_ONLY")
fi

"$GODOT" --path "$PROJ" res://tools/gallery.tscn -- "${EXTRA[@]}" > "$OUT" 2>&1
CODE=$?
tr -d '\r' < "$OUT" | tail -n +3
echo "== gallery exit: $CODE =="

STATUS=0
if [ "$CODE" != "0" ]; then
	STATUS=1
fi
if grep -qE 'SCRIPT ERROR|ERROR:|GALLERY FAIL' "$OUT"; then
	echo "gallery.sh: output contains an error line"
	STATUS=1
fi
if ! grep -q 'GALLERY OK' "$OUT"; then
	echo "gallery.sh: no GALLERY OK line"
	STATUS=1
fi
exit "$STATUS"
