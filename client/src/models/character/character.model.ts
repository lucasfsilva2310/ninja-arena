import { Ability } from "../ability/ability.model";
import { AbilityEffect, BuffEffectType } from "../ability/ability.types";
import { GameEngine } from "../game-engine";
import {
  CharacterEffect,
  DamageReductionCharacterEffect,
  TransformationCharacterEffect,
  BuffCharacterEffect,
  EnableAbilityCharacterEffect,
} from "./character.types";

export class Character {
  MAX_HP: number = 100;
  hp: number = this.MAX_HP;
  public abilities: Ability[] = [];
  activeEffects: CharacterEffect[] = [];

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

  getHp(): number {
    return this.hp;
  }

  getMaxHp(): number {
    return this.MAX_HP;
  }

  isAtMaxHp(): boolean {
    return this.hp === this.MAX_HP;
  }

  private setHp(newHp: number) {
    this.hp = Math.min(this.getMaxHp(), newHp);
  }

  isInvulnerable(): boolean {
    return this.activeEffects.some(
      (effect): effect is DamageReductionCharacterEffect =>
        "damageReduction" in effect &&
        effect.damageReduction.reducedAmount === Infinity
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
      if ("damageReduction" in effect) {
        const damageReductionEffect = effect as DamageReductionCharacterEffect;
        if (damageReductionEffect.damageReduction.isPercent) {
          // For percentage reduction, reduce the total damage
          const reduction = Math.floor(
            totalDamage *
              (damageReductionEffect.damageReduction.reducedAmount / 100)
          );
          damageReduction = Math.max(damageReduction, reduction);
        } else {
          // For flat reduction, reduce the total damage
          const reduction = Math.min(
            totalDamage,
            damageReductionEffect.damageReduction.reducedAmount
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
          (effect): effect is DamageReductionCharacterEffect =>
            "damageReduction" in effect
        );
        if (reductionEffect) {
          const reductionType = reductionEffect.damageReduction.isPercent
            ? "%"
            : "";
          message += `, reduced by ${reductionEffect.damageReduction.reducedAmount}${reductionType}`;
        }
      }

      message += `. Final damage: ${finalDamage}`;
      gameEngine.addToHistory(message);
    }

    // Apply final damage
    this.setHp(Math.max(0, this.hp - finalDamage));
  }

  heal(amount: number, gameEngine?: GameEngine) {
    const newHp = Math.min(this.MAX_HP, this.hp + amount);
    if (gameEngine) {
      gameEngine.addToHistory(
        `${this.name} was healed for ${amount}. Current HP: ${newHp}`
      );
    }
    this.setHp(newHp);
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

    const effect: DamageReductionCharacterEffect = {
      name: ability.name,
      description,
      damageReduction: {
        reducedAmount: amount,
        remainingTurns,
        isPercent,
      },
    };

    this.activeEffects.push(effect);
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

    const effect: TransformationCharacterEffect = {
      name: originalAbility.name,
      description: originalAbility.description,
      transformation: {
        originalAbility,
        newAbility,
        remainingTurns: duration,
      },
    };

    this.activeEffects.push(effect);
  }

  revertTransformation(newAbility: Ability, gameEngine?: GameEngine) {
    const transformationEffect = this.activeEffects.find(
      (effect): effect is TransformationCharacterEffect =>
        "transformation" in effect &&
        effect.transformation.newAbility === newAbility
    );

    if (transformationEffect) {
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
    buff: BuffEffectType,
    value: number,
    gameEngine?: GameEngine
  ) {
    if (gameEngine) {
      gameEngine.addToHistory(`${this.name} applied ${buff.buffType} buff`);
    }

    const effect: BuffCharacterEffect = {
      name: ability.name,
      description: buff.description,
      buff: {
        ...buff,
        value,
        remainingTurns: buff.remainingTurns,
      },
    };

    this.activeEffects.push(effect);
  }

  applyEnableAbility(
    ability: Ability,
    abilityNames: string[],
    duration: number,
    gameEngine?: GameEngine
  ) {
    if (gameEngine) {
      gameEngine.addToHistory(
        `${this.name} now enables abilities: ${abilityNames.join(
          ", "
        )} for ${duration} turns`
      );
    }

    const effect: EnableAbilityCharacterEffect = {
      name: ability.name,
      description: `This character can now use ${abilityNames.join(", ")}`,
      enabledAbilities: {
        abilityNames,
        remainingTurns: duration,
      },
    };

    this.activeEffects.push(effect);
  }

  removeActiveEffect(currentEffect: AbilityEffect) {
    this.activeEffects = this.activeEffects.filter(
      (effect) => effect.name !== currentEffect.name
    );
  }
}
