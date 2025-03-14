import { AbilityAnimation, generateSpritePaths } from "../animationConfig";

export const sakuraAngerPunchAnimation: AbilityAnimation = {
  attacker: {
    sprites: generateSpritePaths("sakura", "angerpunch", 9),
  },
  target: {
    sprites: [], // Will use default damage sprites from SpriteAnimator
  },
  effects: [],
};
