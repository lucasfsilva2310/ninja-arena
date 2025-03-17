import { AbilityAnimation, generateSpritePaths } from "../animations.config";

export const sakuraHealAnimation: AbilityAnimation = {
  attacker: {
    sprites: generateSpritePaths("sakura", "heal", 5),
    phases: ["attack"],
  },

  effects: [],
};
