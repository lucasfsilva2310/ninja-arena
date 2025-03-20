import { Ability, AbilityEffect, BuffEffect } from "./ability.model";
import { GameEngine } from "./game-engine";

export type EffectType = {
  name: string;
  description: string;
  damageReduction?: {
    amount: number;
    remainingTurns: number;
    isPercent?: boolean;
    applied?: boolean;
  };
  transformation?: {
    originalAbility: Ability;
    newAbility: Ability;
    remainingTurns: number;
    applied?: boolean;
  };
  buff?: {
    buffedAbilites: string[];
    buffType: "Damage" | "Heal" | "CooldownReduction";
    value: number;
    remainingTurns: number;
    applied?: boolean;
  };
};

export class Character {
  hp: number = 100;
  public abilities: Ability[] = [];
  activeEffects: EffectType[] = [];

  constructor(public name: string, public baseAbilities: Ability[]) {
    // Creating ability in memory so it wont conflict with the one in the database
    this.abilities = baseAbilities.map(
      (ability) =>
        new Ability(
          ability.name,
          ability.description,
          [...ability.requiredChakra],
          ability.defaultCooldown,
          [...ability.effects],
          ability.target,
          ability.isPermanent,
          ability.isStacking
        )
    );
  }

  isAlive(): boolean {
    return this.hp > 0;
  }

  isInvulnerable(): boolean {
    return this.activeEffects.some(
      (effect) => effect.damageReduction?.amount === Infinity
    );
  }

  takeDamage(
    damage: number,
    increasedDamage: number = 0,
    gameEngine?: GameEngine
  ) {
    let totalDamage: number = damage + increasedDamage;
    let damageReduction: number = 0;

    // Calculate damage reduction from active effects
    this.activeEffects.forEach((effect) => {
      if (effect.damageReduction) {
        if (effect.damageReduction.isPercent) {
          // For percentage reduction, reduce the total damage
          const reduction = Math.floor(
            totalDamage * (effect.damageReduction.amount / 100)
          );
          damageReduction = Math.max(damageReduction, reduction);
        } else {
          // For flat reduction, reduce the total damage
          const reduction = Math.min(
            totalDamage,
            effect.damageReduction.amount
          );
          damageReduction = Math.max(damageReduction, reduction);
        }
      }
    });

    // Apply damage reduction to total damage
    const finalDamage = Math.max(0, totalDamage - damageReduction);

    // Create history message
    if (gameEngine) {
      let message: string = `${this.name} received ${damage} damage`;

      if (increasedDamage > 0) {
        message += ` with ${increasedDamage} increased damage`;
      }

      if (damageReduction > 0) {
        const reductionEffect = this.activeEffects.find(
          (effect) => effect.damageReduction
        );
        if (reductionEffect?.damageReduction) {
          const reductionType = reductionEffect.damageReduction.isPercent
            ? "%"
            : "";
          message += `, reduced by ${reductionEffect.damageReduction.amount}${reductionType}`;
        }
      }

      message += `. Final damage: ${finalDamage}`;
      gameEngine.addToHistory(message);
    }

    // Apply final damage
    this.hp = Math.max(0, this.hp - finalDamage);
  }

  heal(amount: number, gameEngine?: GameEngine) {
    const newHp = Math.min(100, this.hp + amount);
    if (gameEngine) {
      gameEngine.addToHistory(
        `${this.name} was healed for ${amount}. Current HP: ${newHp}`
      );
    }
    this.hp = newHp;
  }

  addDamageReduction(
    ability: Ability,
    description: string,
    amount: number,
    remainingTurns: number,
    isPercent: boolean,
    gameEngine?: GameEngine
  ) {
    if (gameEngine) {
      gameEngine.addToHistory(
        `${this.name} received ${amount}${
          isPercent ? "%" : ""
        } damage reduction for ${remainingTurns} turns`
      );
    }

    this.activeEffects.push({
      name: ability.name,
      description,
      damageReduction: {
        amount,
        remainingTurns,
        isPercent,
      },
    });
  }

  applyTransformation(
    originalAbility: Ability,
    newAbility: Ability,
    duration: number,
    gameEngine?: GameEngine
  ) {
    if (gameEngine) {
      gameEngine.addToHistory(
        `${this.name} transformed ability from ${originalAbility.name} to ${newAbility.name} for ${duration} turns`
      );
    }

    this.replaceAbility(originalAbility, newAbility);

    this.activeEffects.push({
      name: originalAbility.name,
      description: originalAbility.description,
      transformation: { originalAbility, newAbility, remainingTurns: duration },
    });
  }

  revertTransformation(newAbility: Ability, gameEngine?: GameEngine) {
    const transformationEffect = this.activeEffects.find(
      (effect) =>
        effect.transformation && effect.transformation.newAbility === newAbility
    );

    if (transformationEffect && transformationEffect.transformation) {
      this.replaceAbility(
        transformationEffect.transformation.newAbility,
        transformationEffect.transformation.originalAbility
      );

      if (gameEngine) {
        gameEngine.addToHistory(
          `${this.name} reverted transformation from ${transformationEffect.transformation.newAbility.name} to ${transformationEffect.transformation.originalAbility.name}`
        );
      }

      this.activeEffects = this.activeEffects.filter(
        (effect) => effect !== transformationEffect
      );
    }
  }

  replaceAbility(
    oldAbility: Ability,
    newAbility: Ability,
    gameEngine?: GameEngine
  ) {
    const abilityIndex = this.abilities.findIndex(
      (ability) => ability === oldAbility
    );
    if (abilityIndex !== -1) {
      this.abilities[abilityIndex] = newAbility;
      if (gameEngine) {
        gameEngine.addToHistory(
          `${this.name} replaced ${oldAbility.name} with ${newAbility.name}`
        );
      }
    }
  }

  applyBuff(
    ability: Ability,
    buff: BuffEffect,
    value: number,
    gameEngine?: GameEngine
  ) {
    if (gameEngine) {
      gameEngine.addToHistory(`${this.name} applied ${buff.buffType} buff`);
    }

    this.activeEffects.push({
      name: ability.name,
      description: buff.description,
      buff: { ...buff, value },
    });
  }

  removeActiveEffect(currentEffect: AbilityEffect) {
    this.activeEffects = this.activeEffects.filter(
      (effect) => effect.name !== currentEffect.name
    );
  }
}
