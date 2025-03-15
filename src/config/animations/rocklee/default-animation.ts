import { AbilityAnimation, generateSpritePaths } from "../animation-config";

export const rockleeDefaultAnimation: AbilityAnimation = {
  attacker: {
    sprites: generateSpritePaths("rocklee", "idle", 6),
    phases: ["attack"],
  },
  target: {
    sprites: generateSpritePaths("rocklee", "damaged", 5),
    phases: ["idle", "damaged"],
  },
  effects: [],
};
