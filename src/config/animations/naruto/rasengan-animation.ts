import { chakraTypes } from "../../../models/chakra.model";
import { generateSpritePaths } from "../animations.config";

export const narutoRasenganAnimation = {
  attacker: {
    sprites: generateSpritePaths("naruto", "rasengan", 12),
  },
  effects: [],
  // chakraColor: chakraTypes.Ninjutsu,
  // sound: "sounds/rasengan.mp3",
  // camera: {
  //   shake: true,
  //   duration: 500,
  // },
};
