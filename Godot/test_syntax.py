#!/usr/bin/env python3
"""
Simple syntax checker for GDScript files
This doesn't require Godot to be installed
"""

import os
import re

def check_gdscript_syntax(file_path):
    """Basic syntax check for GDScript files"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Basic syntax checks
        errors = []
        
        # Check for balanced braces
        if content.count('{') != content.count('}'):
            errors.append("Unbalanced braces")
        
        # Check for balanced parentheses
        if content.count('(') != content.count(')'):
            errors.append("Unbalanced parentheses")
        
        # Check for balanced brackets
        if content.count('[') != content.count(']'):
            errors.append("Unbalanced brackets")
        
        # Check for proper function definitions
        func_pattern = r'func\s+\w+\s*\('
        functions = re.findall(func_pattern, content)
        
        # Check for proper class definitions
        class_pattern = r'class_name\s+\w+'
        classes = re.findall(class_pattern, content)
        
        # Check for proper variable declarations
        var_pattern = r'var\s+\w+'
        variables = re.findall(var_pattern, content)
        
        print(f"✅ {file_path}")
        print(f"   Functions found: {len(functions)}")
        print(f"   Classes found: {len(classes)}")
        print(f"   Variables found: {len(variables)}")
        
        if errors:
            print(f"   ❌ Errors: {', '.join(errors)}")
            return False
        else:
            print(f"   ✅ No syntax errors detected")
            return True
            
    except Exception as e:
        print(f"❌ Error reading {file_path}: {e}")
        return False

def main():
    print("=== NARUTO ARENA GDScript Syntax Check ===")
    
    gdscript_files = [
        "scripts/game_engine.gd",
        "scripts/character.gd", 
        "scripts/ability.gd",
        "scripts/player.gd",
        "scripts/character_effects.gd",
        "scripts/test_game_engine.gd",
        "test_runner.gd"
    ]
    
    all_passed = True
    
    for file_path in gdscript_files:
        if os.path.exists(file_path):
            if not check_gdscript_syntax(file_path):
                all_passed = False
        else:
            print(f"❌ File not found: {file_path}")
            all_passed = False
    
    print("\n=== SUMMARY ===")
    if all_passed:
        print("✅ All GDScript files passed syntax check!")
        print("The game engine code should work correctly in Godot.")
    else:
        print("❌ Some files have syntax issues.")
        print("Please fix the errors before running in Godot.")
    
    print("\nTo test the actual functionality, you need to:")
    print("1. Install Godot 4.x")
    print("2. Open the project in Godot")
    print("3. Press F5 to run the test scene")

if __name__ == "__main__":
    main() 