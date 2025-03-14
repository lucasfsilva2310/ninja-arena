import { AbilityAnimation, generateSpritePaths } from "../animationConfig";

export const narutoDefaultAnimation: AbilityAnimation = {
  attacker: {
    sprites: generateSpritePaths("naruto", "idle", 3),
    phases: ["attack"],
  },
  target: {
    sprites: generateSpritePaths("naruto", "damaged", 9),
    phases: ["idle", "damaged"],
  },
  effects: [],
};
