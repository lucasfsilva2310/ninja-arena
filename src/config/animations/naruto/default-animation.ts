import { AbilityAnimation, generateSpritePaths } from "../animation-config";

export const narutoDefaultAnimation: AbilityAnimation = {
  attacker: {
    sprites: generateSpritePaths("naruto", "idle", 3),
    phases: ["attack"],
  },
  target: {
    sprites: generateSpritePaths("naruto", "damaged", 11),
    phases: ["damaged"],
  },
  effects: [],
};
