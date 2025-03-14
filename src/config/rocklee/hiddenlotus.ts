import { chakraTypes } from "../../models/chakra.model";
import { AbilityAnimation, generateSpritePaths } from "../animationConfig";

export const rockleeHiddenLotusAnimation: AbilityAnimation = {
  attacker: {
    sprites: generateSpritePaths("rocklee", "hiddenlotus", 44),
  },
  target: {
    sprites: [], // Will use default damage sprites from SpriteAnimator
  },
  effects: [],
  //   chakraColor: chakraTypes.Ninjutsu,
  //   sound: "sounds/fireball.mp3",
};
