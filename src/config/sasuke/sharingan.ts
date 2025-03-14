import { AbilityAnimation, generateSpritePaths } from "../animationConfig";

export const sasukeSharinganAnimation: AbilityAnimation = {
  attacker: {
    sprites: generateSpritePaths("sasuke", "sharingan", 8),
  },
  target: {
    sprites: [], // Will use default damage sprites from SpriteAnimator
  },
  effects: [],
};
