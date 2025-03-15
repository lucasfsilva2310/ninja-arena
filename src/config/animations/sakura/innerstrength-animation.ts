import { AbilityAnimation, generateSpritePaths } from "../animation-config";

export const sakuraInnerStrengthAnimation: AbilityAnimation = {
  attacker: {
    sprites: generateSpritePaths("sakura", "innerstrength", 9),
  },
  target: {
    sprites: [], // Will use default damage sprites from SpriteAnimator
  },
  effects: [],
};
