import { AbilityAnimation, generateSpritePaths } from "../animations.config";

export const sakuraHealAnimation: AbilityAnimation = {
  attacker: {
    sprites: generateSpritePaths("sakura", "heal", 8),
    phases: ["attack"],
  },

  effects: [],
  requiresTargetAnimation: false,
};
