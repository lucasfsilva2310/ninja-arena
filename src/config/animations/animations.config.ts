import { ChakraType } from "../../models/chakra.model";
import { narutoAnimations } from "./naruto";
import { rockleeAnimations } from "./rocklee";
import { sakuraAnimations } from "./sakura";
import { sasukeAnimations } from "./sasuke";

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
  sprites?: string[]; // Array of sprite image paths
  startTime: number; // When to start the effect (ms from sequence start)
  duration: number; // How long the effect lasts
  scale?: number; // Optional scale for the effect
  rotation?: number; // Optional rotation for the effect
  color?: string; // Optional color tint
}

// Interface for sprite animation data
export interface SpriteAnimationData {
  sprites: string[]; // Array of sprite image paths
  // Only need phases for fallback when no sprites are defined
  phases?: AnimationPhase[]; // Optional sequence of animation phases (fallback)
}

export interface SpriteAnimationDataForTarget {
  damaged: SpriteAnimationData;
  recover: SpriteAnimationData;
}

// Main interface for ability animation data
export interface AbilityAnimation {
  attacker: SpriteAnimationData;
  target?: SpriteAnimationDataForTarget;
  effects: VisualEffect[];
  chakraColor?: ChakraType;
  sound?: string;
  camera?: {
    shake?: boolean;
    zoom?: number;
    duration?: number;
  };
  requiresTargetAnimation?: boolean; // Flag to indicate if target animations are needed
}

// Character ability animations organized by character -> ability
export const characterAbilityAnimations: Record<
  string,
  Record<string, AbilityAnimation>
> = {
  // Default fallback when character/ability not found
  default: {
    default: {
      attacker: {
        sprites: [],
        phases: ["attack"],
      },
      target: {
        damaged: {
          sprites: [],
          phases: ["idle", "damaged"],
        },
        recover: {
          sprites: [],
          phases: ["recover"],
        },
      },
      effects: [],
      requiresTargetAnimation: true, // Default to true for backward compatibility
    },
  },

  // Naruto's abilities
  naruto: {
    default: narutoAnimations.default,
    rasengan: narutoAnimations.rasengan,
    escapeclone: narutoAnimations.escapeclone,
    kagebunshin: narutoAnimations.kagebunshin,
    narutokick: narutoAnimations.narutokick,
  },

  // Sakura's abilities
  sakura: {
    default: sakuraAnimations.default,
    angerpunch: sakuraAnimations.angerpunch,
    innerstrength: sakuraAnimations.innerstrength,
    kawarimi: sakuraAnimations.kawarimi,
    heal: sakuraAnimations.heal,
  },

  // Sasuke's abilities
  sasuke: {
    default: sasukeAnimations.default,
    fireball: sasukeAnimations.fireball,
    chidori: sasukeAnimations.chidori,
    kawarimi: sasukeAnimations.kawarimi,
    sharingan: sasukeAnimations.sharingan,
  },

  // Rock Lee's abilities
  rocklee: {
    default: rockleeAnimations.default,
    primarylotus: rockleeAnimations.primarylotus,
    hiddenlotus: rockleeAnimations.hiddenlotus,
    konohasenpu: rockleeAnimations.konohasenpu,
    releaseweights: rockleeAnimations.releaseweights,
    backflip: rockleeAnimations.backflip,
  },
};

// Helper function to get animation data for an ability
export function getAbilityAnimation(
  characterName: string,
  abilityName: string
): AbilityAnimation {
  const normalizedCharName = characterName.toLowerCase().replace(/\s+/g, "");
  const normalizedAbilityName = abilityName.toLowerCase().replace(/\s+/g, "");

  // Try to get character-specific ability
  const character = characterAbilityAnimations[normalizedCharName];
  if (character) {
    // Try to get specific ability for this character
    const ability = character[normalizedAbilityName];
    if (ability) {
      return ability;
    }

    // Fall back to character default
    if (character.default) {
      return character.default;
    }
  }

  // Global fallback
  return characterAbilityAnimations.default.default;
}

// Helper to calculate animation duration based on sprite count
export function calculateAnimationDuration(
  sprites: string[],
  frameSpeed: number = 150
): number {
  return sprites.length * frameSpeed;
}

// Helper to get animation duration for a character, ability and phase
export function getAnimationDuration(
  characterName: string,
  abilityName: string,
  isAttacker: boolean = true,
  frameSpeed: number = 150
): number {
  const sprites = getSpritePaths(characterName, abilityName, isAttacker);

  // If we have sprites, use their count to determine duration
  if (sprites.length > 0) {
    return sprites.length * frameSpeed;
  }

  // Default fallback durations
  return isAttacker ? 1000 : 500;
}

// Helper to get sprite paths for a character and ability
export function getSpritePaths(
  characterName: string,
  abilityName: string,
  isAttacker: boolean = true,
  isDamaged: boolean = false,
  isRecovering: boolean = false
): string[] {
  const animation = getAbilityAnimation(characterName, abilityName);

  if (isAttacker) {
    return animation.attacker.sprites;
  }

  // Handle target animations
  if (!animation.target) {
    return [];
  }

  if (isDamaged) {
    return animation.target.damaged.sprites;
  }

  if (isRecovering) {
    return animation.target.recover.sprites;
  }

  return [];
}

// Add this utility function to generate sprite paths
export function generateSpritePaths(
  characterName: string,
  abilityName: string,
  frameCount: number,
  startIndex: number = 0
): string[] {
  const normalizedCharName = characterName.toLowerCase().replace(/\s+/g, "");
  const normalizedAbilityName = abilityName.toLowerCase().replace(/\s+/g, "");

  return Array.from(
    { length: frameCount },
    (_, i) =>
      `characters/${normalizedCharName}/sprites/${normalizedAbilityName}/${normalizedCharName}-sprites-${
        i + startIndex
      }.png`
  );
}
