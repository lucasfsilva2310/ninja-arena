import { AbilityAnimation, generateSpritePaths } from "../animationConfig";

export const narutoKickAnimation: AbilityAnimation = {
  attacker: {
    sprites: generateSpritePaths("naruto", "narutokick", 10),
  },
  target: {
    sprites: [], // Will use default damage sprites from SpriteAnimator
  },
  effects: [],
};
