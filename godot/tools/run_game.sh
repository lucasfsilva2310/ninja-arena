#!/usr/bin/env bash
GODOT="${GODOT:-/mnt/c/Users/User/Desktop/Code/Godot_v4.7.2-stable_win64_console.exe}"
PROJ="$(wslpath -w "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)")"
exec "$GODOT" --path "$PROJ" "$@"
