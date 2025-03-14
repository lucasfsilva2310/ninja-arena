import { AbilityAnimation, generateSpritePaths } from "../animationConfig";

export const narutoKagebunshinAnimation: AbilityAnimation = {
  attacker: {
    sprites: generateSpritePaths("naruto", "kagebunshin", 5),
  },
  target: {
    sprites: [], // Will use default damage sprites from SpriteAnimator
  },
  effects: [],
};
