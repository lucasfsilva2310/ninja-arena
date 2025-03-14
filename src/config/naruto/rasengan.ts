import { chakraTypes } from "../../models/chakra.model";
import { generateSpritePaths } from "../animationConfig";

export const narutoRasenganAnimation = {
  attacker: {
    sprites: generateSpritePaths("naruto", "rasengan", 11),
  },
  target: {
    sprites: [], // Will use default damage sprites
  },
  effects: [
    {
      type: "aura",
      path: "effects/chakra-swirl",
      start: "attacker",
      startTime: 100,
      duration: 400,
      scale: 1.2,
      color: "#2196F3",
    },
    {
      type: "impact",
      path: "effects/rasengan-impact",
      start: "target",
      startTime: 700,
      duration: 500,
      scale: 1.8,
    },
  ],
  chakraColor: chakraTypes.Ninjutsu,
  sound: "sounds/rasengan.mp3",
  camera: {
    shake: true,
    duration: 500,
  },
};
