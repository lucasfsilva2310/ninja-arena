import { AbilityAnimation, generateSpritePaths } from "../animationConfig";

export const sakuraInnerStrengthAnimation: AbilityAnimation = {
  attacker: {
    sprites: generateSpritePaths("sakura", "innerstrength", 9),
  },
  target: {
    sprites: [], // Will use default damage sprites from SpriteAnimator
  },
  effects: [],
};
