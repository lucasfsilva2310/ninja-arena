import { AbilityAnimation, generateSpritePaths } from "../animations.config";

export const narutoEscapeCloneAnimation: AbilityAnimation = {
  attacker: {
    sprites: generateSpritePaths("naruto", "escapeclone", 5),
  },
  effects: [],
};
