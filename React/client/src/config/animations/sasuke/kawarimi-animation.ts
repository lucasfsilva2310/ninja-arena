import { AbilityAnimation, generateSpritePaths } from "../animations.config";

export const sasukeKawarimiAnimation: AbilityAnimation = {
  attacker: {
    sprites: generateSpritePaths("sasuke", "kawarimi", 8),
  },

  effects: [
    {
      type: "dispertion",
      path: "smoke",
      sprites: generateSpritePaths("sasuke", "kawarimi/effects/smoke", 6),
      start: "attacker",
      startTime: 300,
      duration: 500,
      scale: 1.5,
      color: "#FF5722",
    },
  ],
  requiresTargetAnimation: false,
};
