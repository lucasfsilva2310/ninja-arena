import { AbilityAnimation, generateSpritePaths } from "../animationConfig";

export const sasukeKawarimiAnimation: AbilityAnimation = {
  attacker: {
    sprites: generateSpritePaths("sasuke", "kawarimi", 6),
  },
  target: {
    sprites: [], // Will use default damage sprites from SpriteAnimator
  },
  effects: [],
};
