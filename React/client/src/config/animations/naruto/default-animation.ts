import { AbilityAnimation, generateSpritePaths } from "../animations.config";

export const narutoDefaultAnimation: AbilityAnimation = {
  attacker: {
    sprites: generateSpritePaths("naruto", "idle", 3),
    phases: ["attack"],
  },
  target: {
    damaged: {
      sprites: generateSpritePaths("naruto", "damaged", 7),
      phases: ["damaged"],
    },
    recover: {
      sprites: generateSpritePaths("naruto", "recover", 4),
    },
  },
  effects: [],
  requiresTargetAnimation: true,
};
