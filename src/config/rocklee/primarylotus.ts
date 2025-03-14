import { chakraTypes } from "../../models/chakra.model";
import { generateSpritePaths } from "../animationConfig";

export const rockleePrimaryLotusAnimation = {
  attacker: {
    sprites: generateSpritePaths("rocklee", "primarylotus", 31),
  },
  target: {
    sprites: [], // Will use default damage sprites from SpriteAnimator
  },
  effects: [],
  //   chakraColor: chakraTypes.Ninjutsu,
  //   sound: "sounds/fireball.mp3",
};
