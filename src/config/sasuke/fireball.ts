import { chakraTypes } from "../../models/chakra.model";
import { AbilityAnimation, generateSpritePaths } from "../animationConfig";

export const sasukeFireballAnimation: AbilityAnimation = {
  attacker: {
    sprites: generateSpritePaths("sasuke", "fireball", 11),
  },
  target: {
    sprites: [], // Will use default damage sprites
  },
  effects: [],
  //   chakraColor: chakraTypes.Ninjutsu,
  //   sound: "sounds/fireball.mp3",
};
