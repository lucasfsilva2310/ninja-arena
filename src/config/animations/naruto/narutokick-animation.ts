import { AbilityAnimation, generateSpritePaths } from "../animation-config";

export const narutoKickAnimation: AbilityAnimation = {
  attacker: {
    sprites: generateSpritePaths("naruto", "narutokick", 10),
  },
  target: {
    sprites: [], // Will use default damage sprites from SpriteAnimator
  },
  effects: [],
};
