import { AbilityAnimation, generateSpritePaths } from "../animations.config";

export const rockleeReleaseWeightsAnimation: AbilityAnimation = {
  attacker: {
    sprites: generateSpritePaths("rocklee", "releaseweights", 27),
  },

  effects: [],
  requiresTargetAnimation: false,
};
