import { AbilityAnimation, generateSpritePaths } from "../animations.config";

export const sasukeSharinganAnimation: AbilityAnimation = {
  attacker: {
    sprites: generateSpritePaths("sasuke", "sharingan", 7),
  },

  effects: [],
  requiresTargetAnimation: false,
};
