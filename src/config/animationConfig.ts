import { ChakraType, chakraTypes } from "../models/chakra.model";

// Animation phases that a character can be in
export type AnimationPhase =
  | "idle"
  | "attack"
  | "damaged"
  | "recover"
  | "victory"
  | "defeat";

// Effect types that can be displayed during animations
export type EffectType = "projectile" | "impact" | "aura" | "status";

// Interface for visual effect configuration
export interface VisualEffect {
  type: EffectType;
  path: string; // Path to the effect sprites
  start: "attacker" | "target" | { x: number; y: number }; // Starting position
  end?: "attacker" | "target" | { x: number; y: number }; // Ending position (for projectiles)
  startTime: number; // When to start the effect (ms from sequence start)
  duration: number; // How long the effect lasts
  scale?: number; // Optional scale for the effect
  rotation?: number; // Optional rotation for the effect
  color?: string; // Optional color tint
}

// Interface for character animation sequence
export interface AnimationSequence {
  phases: AnimationPhase[]; // Sequence of animation phases to play
  durations: number[]; // Duration for each phase in ms
  frames?: number[]; // Optional specific number of frames for each phase
}

// Main interface for ability animation data
export interface AbilityAnimation {
  attacker: AnimationSequence;
  target: AnimationSequence;
  effects: VisualEffect[];
  chakraColor?: ChakraType; // Optional chakra color for tinting effects
  sound?: string; // Optional sound effect to play
  camera?: {
    // Optional camera movement
    shake?: boolean;
    zoom?: number;
    duration?: number;
  };
}

// Map of ability animations by ability name
export const abilityAnimations: Record<string, AbilityAnimation> = {
  // Default animation for any ability
  default: {
    attacker: {
      phases: ["attack", "recover"],
      durations: [500, 300],
    },
    target: {
      phases: ["idle", "damaged"],
      durations: [500, 500],
    },
    effects: [],
  },

  // Example specific ability animations
  fireball: {
    attacker: {
      phases: ["attack", "recover"],
      durations: [500, 300],
    },
    target: {
      phases: ["idle", "damaged"],
      durations: [500, 500],
    },
    effects: [
      {
        type: "projectile",
        path: "effects/fireball",
        start: "attacker",
        end: "target",
        startTime: 100,
        duration: 600,
        scale: 1.2,
      },
      {
        type: "impact",
        path: "effects/explosion",
        start: "target",
        startTime: 700,
        duration: 400,
        scale: 1.5,
      },
    ],
    chakraColor: chakraTypes.Ninjutsu,
    sound: "sounds/fireball.mp3",
  },

  rasengan: {
    attacker: {
      phases: ["attack", "recover"],
      durations: [600, 300],
    },
    target: {
      phases: ["idle", "damaged"],
      durations: [600, 600],
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
  },
};

// Helper function to get animation data for an ability
export function getAbilityAnimation(abilityName: string): AbilityAnimation {
  const normalizedName = abilityName.toLowerCase().replace(/\s+/g, "");
  return abilityAnimations[normalizedName] || abilityAnimations.default;
}
