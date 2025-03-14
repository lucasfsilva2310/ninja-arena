import { AbilityAnimation, generateSpritePaths } from "../animationConfig";

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
