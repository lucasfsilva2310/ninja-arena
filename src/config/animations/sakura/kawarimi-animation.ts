import { AbilityAnimation, generateSpritePaths } from "../animations.config";

export const sakuraKawarimiAnimation: AbilityAnimation = {
  attacker: {
    sprites: generateSpritePaths("sakura", "kawarimi", 8),
  },

  effects: [
    {
      type: "dispertion",
      path: "smoke", // This will be appended to the effects folder path
      sprites: generateSpritePaths("sakura", "kawarimi/effects/smoke", 6), // Assuming 8 frames for the fireball effect
      start: "attacker",
      startTime: 300, // Start after character begins animation
      duration: 500, // Time to travel from attacker to target
      scale: 1.5,
      color: "#FF5722", // Orange/fire color
    },
  ],
  requiresTargetAnimation: false,
};
