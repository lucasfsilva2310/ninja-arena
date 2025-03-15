import { AbilityAnimation, generateSpritePaths } from "../animation-config";

export const narutoEscapeCloneAnimation: AbilityAnimation = {
  attacker: {
    sprites: generateSpritePaths("naruto", "escapeclone", 5),
  },
  target: {
    sprites: [], // Will use default damage sprites from SpriteAnimator
  },
  effects: [],
};
