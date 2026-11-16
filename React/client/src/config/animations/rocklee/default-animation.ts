import { AbilityAnimation, generateSpritePaths } from "../animations.config";

export const rockleeDefaultAnimation: AbilityAnimation = {
  attacker: {
    sprites: generateSpritePaths("rocklee", "idle", 6),
    phases: ["attack"],
  },
  target: {
    damaged: {
      sprites: generateSpritePaths("rocklee", "damaged", 7),
      phases: ["idle", "damaged"],
    },
    recover: {
      sprites: generateSpritePaths("rocklee", "recover", 5),
      phases: ["recover"],
    },
  },
  effects: [],
  requiresTargetAnimation: true,
};
