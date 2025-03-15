import { AbilityAnimation, generateSpritePaths } from "../animation-config";

export const rockleeBackflipAnimation: AbilityAnimation = {
  attacker: {
    sprites: generateSpritePaths("rocklee", "backflip", 13),
  },
  target: {
    sprites: [], // Will use default damage sprites from SpriteAnimator
  },
  effects: [],
};
