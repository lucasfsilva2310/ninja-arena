import { AbilityAnimation } from "../animation-config";

import { generateSpritePaths } from "../animation-config";

export const rockleeKonohaSenpuAnimation: AbilityAnimation = {
  attacker: {
    sprites: generateSpritePaths("rocklee", "konohasenpu", 24),
  },
  target: {
    sprites: [], // Will use default damage sprites from SpriteAnimator
  },
  effects: [],
};
