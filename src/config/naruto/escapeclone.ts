import { AbilityAnimation, generateSpritePaths } from "../animationConfig";

export const narutoEscapeCloneAnimation: AbilityAnimation = {
  attacker: {
    sprites: generateSpritePaths("naruto", "escapeclone", 5),
  },
  target: {
    sprites: [], // Will use default damage sprites from SpriteAnimator
  },
  effects: [],
};
