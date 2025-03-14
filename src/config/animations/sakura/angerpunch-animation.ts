import { AbilityAnimation, generateSpritePaths } from "../animation-config";

export const sakuraAngerPunchAnimation: AbilityAnimation = {
  attacker: {
    sprites: generateSpritePaths("sakura", "angerpunch", 9),
  },
  target: {
    sprites: [], // Will use default damage sprites from SpriteAnimator
  },
  effects: [],
};
