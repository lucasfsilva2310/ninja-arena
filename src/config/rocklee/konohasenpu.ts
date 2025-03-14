import { AbilityAnimation } from "../animationConfig";

import { generateSpritePaths } from "../animationConfig";

export const rockleeKonohaSenpuAnimation: AbilityAnimation = {
  attacker: {
    sprites: generateSpritePaths("rocklee", "konohasenpu", 24),
  },
  target: {
    sprites: [], // Will use default damage sprites from SpriteAnimator
  },
  effects: [],
};
