import { AbilityAnimation, generateSpritePaths } from "../animations.config";

export const narutoKagebunshinAnimation: AbilityAnimation = {
  attacker: {
    sprites: generateSpritePaths("naruto", "kagebunshin", 5),
  },

  effects: [],
  requiresTargetAnimation: false,
};
