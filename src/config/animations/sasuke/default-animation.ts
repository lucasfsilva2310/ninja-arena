import { AbilityAnimation, generateSpritePaths } from "../animations.config";

export const sasukeDefaultAnimation: AbilityAnimation = {
  attacker: {
    sprites: generateSpritePaths("sasuke", "idle", 6),
    phases: ["attack"],
  },
  target: {
    damaged: {
      sprites: generateSpritePaths("sasuke", "damaged", 6),
      phases: ["idle", "damaged"],
    },
    recover: {
      sprites: generateSpritePaths("sasuke", "recover", 5),
    },
  },
  effects: [],
};
