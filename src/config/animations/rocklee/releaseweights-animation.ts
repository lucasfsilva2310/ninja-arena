import { AbilityAnimation, generateSpritePaths } from "../animation-config";

export const rockleeReleaseWeightsAnimation: AbilityAnimation = {
  attacker: {
    sprites: generateSpritePaths("rocklee", "releaseweights", 11),
  },
  target: {
    sprites: [], // Will use default damage sprites from SpriteAnimator
  },
  effects: [],
};
