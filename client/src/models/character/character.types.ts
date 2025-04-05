import { Ability } from "../ability/ability.model";

// Base effect interface with common properties
export interface BaseCharacterEffect {
  name: string;
  description: string;
}

// Specific effect interfaces
export interface DamageReductionCharacterEffect extends BaseCharacterEffect {
  damageReduction: {
    reducedAmount: number;
    remainingTurns: number;
    isPercent?: boolean;
    applied?: boolean;
  };
}

export interface TransformationCharacterEffect extends BaseCharacterEffect {
  transformation: {
    originalAbility: Ability;
    newAbility: Ability;
    remainingTurns: number;
    applied?: boolean;
  };
}

export type BuffTypes = "Damage" | "Heal" | "CooldownReduction";

export interface BuffCharacterEffect extends BaseCharacterEffect {
  buff: {
    buffedAbilites: string[];
    buffType: BuffTypes;
    value: number;
    remainingTurns: number;
    applied?: boolean;
  };
}

export interface EnableAbilityCharacterEffect extends BaseCharacterEffect {
  enabledAbilities: {
    abilityNames: string[];
    remainingTurns: number;
    applied?: boolean;
  };
}

// Union type for all character effects
export type CharacterEffect =
  | DamageReductionCharacterEffect
  | TransformationCharacterEffect
  | BuffCharacterEffect
  | EnableAbilityCharacterEffect;
