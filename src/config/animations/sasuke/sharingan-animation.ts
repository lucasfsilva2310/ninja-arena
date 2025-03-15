import { AbilityAnimation, generateSpritePaths } from "../animation-config";

export const sasukeSharinganAnimation: AbilityAnimation = {
  attacker: {
    sprites: generateSpritePaths("sasuke", "sharingan", 7),
  },
  target: {
    sprites: [], // Will use default damage sprites from SpriteAnimator
  },
  effects: [],
};
