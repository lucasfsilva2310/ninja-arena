import { AbilityAnimation, generateSpritePaths } from "../animation-config";

export const sakuraDefaultAnimation: AbilityAnimation = {
  attacker: {
    sprites: generateSpritePaths("sakura", "idle", 6),
    phases: ["attack"],
  },
  target: {
    sprites: generateSpritePaths("sakura", "damaged", 11),
    phases: ["idle", "damaged"],
  },
  effects: [],
};
