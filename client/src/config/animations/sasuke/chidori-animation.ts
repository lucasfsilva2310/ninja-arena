import { chakraTypes } from "../../../models/chakra.model";
import { AbilityAnimation, generateSpritePaths } from "../animations.config";

export const sasukeChidoriAnimation: AbilityAnimation = {
  attacker: {
    sprites: generateSpritePaths("sasuke", "chidori", 34),
  },

  effects: [],
  requiresTargetAnimation: true,
  //   chakraColor: chakraTypes.Ninjutsu,
  //   sound: "sounds/chidori.mp3",
};
