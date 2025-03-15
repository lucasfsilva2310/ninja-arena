import { chakraTypes } from "../../../models/chakra.model";
import { AbilityAnimation, generateSpritePaths } from "../animation-config";

export const sasukeChidoriAnimation: AbilityAnimation = {
  attacker: {
    sprites: generateSpritePaths("sasuke", "chidori", 34),
  },
  target: {
    sprites: [], // Will use default damage sprites from SpriteAnimator
  },
  effects: [],
  //   chakraColor: chakraTypes.Ninjutsu,
  //   sound: "sounds/chidori.mp3",
};
