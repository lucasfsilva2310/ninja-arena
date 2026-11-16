#!/usr/bin/env bash
set -u

if [ "$#" -lt 2 ]; then
	echo "usage: capture.sh res://ui/some_scene.tscn out.png [frames]"
	exit 2
fi

GODOT="${GODOT:-/mnt/c/Users/User/Desktop/Code/Godot_v4.7.2-stable_win64_console.exe}"
PROJ="$(wslpath -w "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)")"
SCENE="$1"
OUT_DIR="$(cd "$(dirname "$2")" && pwd)"
OUT="$(wslpath -w "$OUT_DIR")\\$(basename "$2")"
FRAMES="${3:-3}"

SIZE_ARGS=()
if [ -n "${CAPTURE_SIZE:-}" ]; then
	SIZE_ARGS=(--resolution "$CAPTURE_SIZE")
fi

"$GODOT" --path "$PROJ" "${SIZE_ARGS[@]}" --script res://tools/capture.gd -- "$SCENE" "$OUT" "$FRAMES" "${@:4}"
