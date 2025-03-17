import { chakraTypes } from "../../../models/chakra.model";
import { generateSpritePaths } from "../animations.config";

export const rockleePrimaryLotusAnimation = {
  attacker: {
    sprites: generateSpritePaths("rocklee", "primarylotus", 31),
  },

  effects: [],
  //   chakraColor: chakraTypes.Ninjutsu,
  //   sound: "sounds/fireball.mp3",
};
