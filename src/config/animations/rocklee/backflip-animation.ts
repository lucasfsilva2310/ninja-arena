import { AbilityAnimation, generateSpritePaths } from "../animations.config";

export const rockleeBackflipAnimation: AbilityAnimation = {
  attacker: {
    sprites: generateSpritePaths("rocklee", "backflip", 13),
  },

  effects: [],
};
