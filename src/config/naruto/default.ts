import { chakraTypes } from "../../models/chakra.model";
import { generateSpritePaths } from "../animationConfig";

export const narutoDefaultAnimation = {
  attacker: {
    sprites: generateSpritePaths("naruto", "idle", 6),
    phases: ["attack"],
  },
  target: {
    sprites: generateSpritePaths("naruto", "damaged", 11),
    phases: ["idle", "damaged"],
  },
  effects: [],
};
