#!/bin/bash

# Test script for Naruto Arena Godot Game Engine
# This script will run the game engine tests

echo "=== NARUTO ARENA GAME ENGINE TEST ==="
echo "Running tests..."

# Check if Godot is installed
if ! command -v godot &> /dev/null; then
    echo "Error: Godot is not installed or not in PATH"
    echo "Please install Godot 4.x and add it to your PATH"
    exit 1
fi

# Run the test
echo "Starting Godot test..."
godot --script minimal_test_runner.gd

echo "=== TEST COMPLETED ===" 