import { chakraTypes } from "../../../models/chakra.model";
import { AbilityAnimation, generateSpritePaths } from "../animation-config";

export const sasukeFireballAnimation: AbilityAnimation = {
  attacker: {
    sprites: generateSpritePaths("sasuke", "fireball", 15),
  },
  target: {
    sprites: [], // Will use default damage sprites
  },
  effects: [
    {
      type: "projectile",
      path: "fireball", // This will be appended to the effects folder path
      sprites: generateSpritePaths("sasuke", "fireball/effects/fireball", 12), // Assuming 8 frames for the fireball effect
      start: "attacker",
      end: "target",
      startTime: 1500, // Start after character begins animation
      duration: 900, // Time to travel from attacker to target
      scale: 1.5,
      color: "#FF5722", // Orange/fire color
    },
  ],
  chakraColor: chakraTypes.Ninjutsu,
  sound: "sounds/fireball.mp3",
};
