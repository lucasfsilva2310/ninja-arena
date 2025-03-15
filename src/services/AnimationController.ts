import { Character } from "../models/character.model";
import { Ability } from "../models/ability.model";
import { Player } from "../models/player.model";
import {
  getAbilityAnimation,
  AbilityAnimation,
  VisualEffect,
} from "../config/animations/animation-config";

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

    return sequence[currentIndex + 1];
  }

  // Get dynamic timeout based on animation data if available
  private getDynamicTimeout(phase: AnimationPhase): number {
    if (!this.context.animationData || !this.context.attackerCharacter) {
      return this.phaseTimeouts[phase];
    }

    const frameSpeed = 150;
    const attackerName = this.context.attackerCharacter.name;
    const abilityName = this.context.attackerAbility?.name || "default";
    const targetName = this.context.targetCharacter?.name || "";

    switch (phase) {
      case "attacking":
        // Use sprite count to determine duration
        return (
          this.context.animationData.attacker.sprites.length * frameSpeed ||
          this.phaseTimeouts[phase]
        );

      case "impact":
        // Use target sprite count
        return (
          this.context.animationData.target.sprites.length * frameSpeed ||
          this.phaseTimeouts[phase]
        );

      case "recovery":
        // For recovery, we can use a fixed time or another sprite set
        return this.phaseTimeouts[phase];

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
