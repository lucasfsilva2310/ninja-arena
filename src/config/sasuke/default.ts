import { AbilityAnimation, generateSpritePaths } from "../animationConfig";

export const sasukeDefaultAnimation: AbilityAnimation = {
  attacker: {
    sprites: generateSpritePaths("sasuke", "idle", 6),
    phases: ["attack"],
  },
  target: {
    sprites: generateSpritePaths("sasuke", "damaged", 11),
    phases: ["idle", "damaged"],
  },
  effects: [],
};
