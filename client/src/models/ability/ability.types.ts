import { Ability } from "./ability.model";

// Effect type enum
export type EffectType =
  | "Damage"
  | "Heal"
  | "DamageReduction"
  | "EnableAbility"
  | "Transform"
  | "Persistent"
  | "Stacking"
  | "Buff";

export type TargetType = "Self" | "Ally" | "Enemy" | "AllEnemies" | "AllAllies";

interface BaseEffect {
  name?: string;
  description?: string;
  type: EffectType;
  duration?: number;
  needsEnabler?: string;
}

interface DamageEffect extends BaseEffect {
  type: "Damage";
  value: number;
}

interface HealEffect extends BaseEffect {
  type: "Heal";
  value: number;
}

interface DamageReductionEffect extends BaseEffect {
  type: "DamageReduction";
  damageReduction: {
    description: string;
    reducedAmount: number;
    duration: number;
    isPercent?: boolean;
  };
}

interface TransformEffect extends BaseEffect {
  type: "Transform";
  value?: number;
  transformation: Ability;
}

interface BuffEffect extends BaseEffect {
  type: "Buff";
  value: number;
  buff: {
    description: string;
    buffedAbilites: string[];
    buffType: "Damage" | "Heal";
    remainingTurns: number;
  };
}

interface EnableAbilityEffect extends BaseEffect {
  type: "EnableAbility";
  enabledAbilities: string[];
}

export type AbilityEffect =
  | DamageEffect
  | HealEffect
  | DamageReductionEffect
  | TransformEffect
  | BuffEffect
  | EnableAbilityEffect;

// Extract the buff type from BuffEffect
export type BuffEffectType = Extract<AbilityEffect, { type: "Buff" }>["buff"];
