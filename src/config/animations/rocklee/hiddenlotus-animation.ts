import { chakraTypes } from "../../../models/chakra.model";
import { AbilityAnimation, generateSpritePaths } from "../animations.config";

export const rockleeHiddenLotusAnimation: AbilityAnimation = {
  attacker: {
    sprites: generateSpritePaths("rocklee", "hiddenlotus", 44),
  },

  effects: [],
  //   chakraColor: chakraTypes.Ninjutsu,
  //   sound: "sounds/fireball.mp3",
};
