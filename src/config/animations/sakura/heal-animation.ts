import { AbilityAnimation, generateSpritePaths } from "../animation-config";

export const sakuraHealAnimation: AbilityAnimation = {
  attacker: {
    sprites: generateSpritePaths("sakura", "heal", 5),
    phases: ["attack"],
  },
  target: {
    sprites: [], // Will use default damage sprites from SpriteAnimator
  },
  effects: [],
};
