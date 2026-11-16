import { AbilityAnimation, generateSpritePaths } from "../animations.config";

export const sakuraDefaultAnimation: AbilityAnimation = {
  attacker: {
    sprites: generateSpritePaths("sakura", "idle", 6),
    phases: ["attack"],
  },
  target: {
    damaged: {
      sprites: generateSpritePaths("sakura", "damaged", 7),
      phases: ["idle", "damaged"],
    },
    recover: {
      sprites: generateSpritePaths("sakura", "recover", 5),
      phases: ["recover"],
    },
  },
  effects: [],
  requiresTargetAnimation: true,
};
