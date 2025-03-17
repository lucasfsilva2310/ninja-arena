import { AbilityAnimation, generateSpritePaths } from "../animations.config";

export const narutoKickAnimation: AbilityAnimation = {
  attacker: {
    sprites: generateSpritePaths("naruto", "narutokick", 10),
  },

  effects: [],
};
