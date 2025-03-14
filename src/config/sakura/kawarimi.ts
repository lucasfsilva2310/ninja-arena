import { AbilityAnimation, generateSpritePaths } from "../animationConfig";

export const sakuraKawarimiAnimation: AbilityAnimation = {
  attacker: {
    sprites: generateSpritePaths("sakura", "kawarimi", 4),
  },
  target: {
    sprites: [], // Will use default damage sprites from SpriteAnimator
  },
  effects: [],
};
