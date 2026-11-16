import { Character } from "../models/character/character.model";
import { Ability } from "../models/ability/ability.model";
import { Player } from "../models/player.model";
import {
  getAbilityAnimation,
  AbilityAnimation,
  VisualEffect,
} from "../config/animations/animations.config";

// Define the animation phases
export type AnimationPhase =
  | "idle"
  | "attacking"
  | "impact"
  | "recovery"
  | "completed";

// Interface for animation context
export interface AnimationContext {
  attackerPlayer: Player | null;
  attackerCharacter: Character | null;
  attackerAbility: Ability | null;
  targetPlayer: Player | null;
  targetCharacter: Character | null;
  animationData: AbilityAnimation | null;
  currentPhase: AnimationPhase;
  activeEffects: VisualEffect[];
}

// Class that manages animation state and coordinates with the game engine
export class AnimationController {
  private listeners: Map<string, Function[]> = new Map();
  private context: AnimationContext = {
    attackerPlayer: null,
    attackerCharacter: null,
    attackerAbility: null,
    targetPlayer: null,
    targetCharacter: null,
    animationData: null,
    currentPhase: "idle",
    activeEffects: [],
  };

  private phaseTimeouts: Record<AnimationPhase, number> = {
    idle: 0,
    attacking: 500,
    impact: 500,
    recovery: 300,
    completed: 0,
  };

  private currentTimeout: number | null = null;

  constructor() {
    // Initialize the controller
  }

  // Set the current phase and emit events
  private setPhase(phase: AnimationPhase) {
    // Clear any existing timeout
    if (this.currentTimeout) {
      window.clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }

    // Update the current phase
    this.context.currentPhase = phase;

    // Emit state change event
    this.emit("stateChange", {
      phase: this.context.currentPhase,
      context: this.context,
    });

    // If not completed or idle, automatically progress to next phase
    if (phase !== "completed" && phase !== "idle") {
      const nextPhase = this.getNextPhase(phase);
      const timeout = this.getDynamicTimeout(phase);

      this.currentTimeout = window.setTimeout(() => {
        this.setPhase(nextPhase);
      }, timeout);
    }

    // If completed, emit action complete event
    if (phase === "completed") {
      this.emit("actionComplete", this.context);
    }
  }

  // Get the next phase in the sequence
  private getNextPhase(currentPhase: AnimationPhase): AnimationPhase {
    const sequence: AnimationPhase[] = [
      "attacking",
      "impact",
      "recovery",
      "completed",
    ];

    const currentIndex = sequence.indexOf(currentPhase);
    if (currentIndex === -1 || currentIndex === sequence.length - 1) {
      return "completed";
    }

    // If the ability doesn't require target animations, skip impact and recovery
    if (!this.context.animationData?.requiresTargetAnimation) {
      if (currentPhase === "attacking") {
        return "completed";
      }
      return "completed";
    }

    return sequence[currentIndex + 1];
  }

  // Get dynamic timeout based on animation data if available
  private getDynamicTimeout(phase: AnimationPhase): number {
    const fallbackTimeout = this.phaseTimeouts[phase];

    if (!this.context.animationData || !this.context.attackerCharacter) {
      return fallbackTimeout;
    }

    const frameSpeed = 150;

    // Get the appropriate animation data based on the phase
    let animationData: AbilityAnimation;
    if (phase === "attacking") {
      // For attacking phase, use the attacker's ability animation
      animationData = this.context.animationData;
    } else {
      // For impact and recovery phases, use the target's default animation
      animationData = getAbilityAnimation(
        this.context.targetCharacter?.name || "",
        "default"
      );
    }

    switch (phase) {
      case "attacking":
        return (
          animationData.attacker.sprites.length * frameSpeed || fallbackTimeout
        );

      case "impact":
        // Skip impact phase if ability doesn't require target animations
        if (!this.context.animationData?.requiresTargetAnimation) {
          return 0;
        }
        return animationData.target?.damaged
          ? animationData.target.damaged.sprites.length * frameSpeed
          : fallbackTimeout;

      case "recovery":
        // Skip recovery phase if ability doesn't require target animations
        if (!this.context.animationData?.requiresTargetAnimation) {
          return 0;
        }
        return animationData.target?.recover
          ? animationData.target.recover.sprites.length * frameSpeed
          : fallbackTimeout;

      default:
        return this.phaseTimeouts[phase];
    }
  }

  // Start animating an action
  startAction(
    attackerPlayer: Player,
    attackerCharacter: Character,
    attackerAbility: Ability,
    targetCharacter: Character,
    targetPlayer: Player
  ) {
    // Update context with new action data
    this.context = {
      ...this.context,
      attackerPlayer,
      attackerCharacter,
      attackerAbility,
      targetPlayer,
      targetCharacter,
      animationData: getAbilityAnimation(
        attackerCharacter.name,
        attackerAbility.name
      ),
      currentPhase: "attacking",
      activeEffects: getAbilityAnimation(
        attackerCharacter.name,
        attackerAbility.name
      ).effects,
    };

    // Start the animation sequence directly with attacking
    this.setPhase("attacking");
    this.emit("actionStarted", this.context);
  }

  // Force transition to next phase
  nextPhase() {
    const nextPhase = this.getNextPhase(this.context.currentPhase);
    this.setPhase(nextPhase);
  }

  // Reset the animation controller
  reset() {
    // Clear any existing timeout
    if (this.currentTimeout) {
      window.clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }

    this.context = {
      ...this.context,
      attackerPlayer: null,
      attackerCharacter: null,
      attackerAbility: null,
      targetPlayer: null,
      targetCharacter: null,
      animationData: null,
      currentPhase: "idle",
      activeEffects: [],
    };

    this.setPhase("idle");
    this.emit("reset", this.context);
  }

  // Get current animation state
  getCurrentPhase(): AnimationPhase {
    return this.context.currentPhase;
  }

  // Get the current animation data
  getAnimationData(): AbilityAnimation | null {
    return this.context.animationData;
  }

  // Get active effects
  getActiveEffects(): VisualEffect[] {
    return this.context.activeEffects;
  }

  // Get current animation context
  getCurrentContext(): AnimationContext {
    return this.context;
  }

  // Get character animation phase for a character
  getCharacterPhase(characterName: string, isEnemy: boolean): string {
    if (!this.context.animationData) return "idle";

    // Maps state machine phases to character animation phases
    const phaseMap: Record<AnimationPhase, string> = {
      idle: "idle",
      attacking: "attack",
      impact:
        isEnemy && characterName === this.context.targetCharacter?.name
          ? "damaged"
          : "idle",
      recovery: "recover",
      completed: "idle",
    };

    return phaseMap[this.context.currentPhase] || "idle";
  }

  // Observer pattern: subscribe to events
  on(event: string, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event) || [];
      this.listeners.set(
        event,
        callbacks.filter((cb) => cb !== callback)
      );
    };
  }

  // Emit an event to all listeners
  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach((callback) => callback(data));
  }
}

// Singleton instance
const animationController = new AnimationController();
export default animationController;
