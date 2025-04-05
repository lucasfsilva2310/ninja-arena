import { ChakraType } from "../chakra/chakra.types";
import { Character } from "../character/character.model";
import { GameEngine } from "../game-engine";
import { AbilityEffect, TargetType } from "./ability.types";
import { EnableAbilityCharacterEffect } from "../character/character.types";

export class Ability {
  public currentCooldown: number = 0;

  constructor(
    public name: string,
    public description: string,
    public requiredChakra: ChakraType[],
    public defaultCooldown: number,
    public effects: AbilityEffect[],
    public target: TargetType,
    public isPermanent: boolean = false,
    public isStacking: boolean = false
  ) {
    this.effects = this.effects.map((effect) => ({
      ...effect,
      name: effect.name || this.name,
      description: effect.description || this.description,
    }));
  }

  canUse(char: Character, chakras: ChakraType[]): boolean {
    if (this.isOnCooldown()) return false;
    if (!char.isAlive()) return false;

    // Check if this ability needs an enabler
    const needsEnablerEffect = this.effects.find(
      (
        effect
      ): effect is AbilityEffect & { type: "Damage"; needsEnabler: string } =>
        effect.type === "Damage" && effect.needsEnabler !== undefined
    );
    if (needsEnablerEffect) {
      const enablerName = needsEnablerEffect.needsEnabler;
      // Check if the character has an active effect that enables this ability
      const isEnabled = char.activeEffects.some(
        (effect): effect is EnableAbilityCharacterEffect =>
          "enabledAbilities" in effect &&
          (effect.name === enablerName ||
            effect.enabledAbilities.abilityNames.includes(this.name))
      );

      if (!isEnabled) return false;
    }

    // Map with availableChakras
    const availableChakras: Record<ChakraType, number> = chakras.reduce(
      (acc, chakra) => {
        acc[chakra] = (acc[chakra] || 0) + 1;
        return acc;
      },
      {} as Record<ChakraType, number>
    );

    // Map with needed Chakras
    const requiredChakras: Record<ChakraType, number> =
      this.requiredChakra.reduce((acc, chakra) => {
        acc[chakra] = (acc[chakra] || 0) + 1;
        return acc;
      }, {} as Record<ChakraType, number>);

    // Check if has enough chakra
    for (const [chakra, requiredAmount] of Object.entries(requiredChakras)) {
      if (chakra === "Random") continue; //Ignore random

      const availableAmount = availableChakras[chakra as ChakraType] || 0;
      if (availableAmount < requiredAmount) return false;
    }

    // Deal with random
    const totalRequiredChakras = this.requiredChakra.length;
    const totalAvailableChakras = chakras.length;

    return totalAvailableChakras >= totalRequiredChakras;
  }

  applyEffect(
    character: Character,
    ability: Ability,
    target: Character,
    gameEngine?: GameEngine
  ) {
    this.effects.forEach((effect) => {
      switch (effect.type) {
        case "Damage": {
          let increasedDamage = 0;
          character.activeEffects.forEach((activeEffect) => {
            if (
              "buff" in activeEffect &&
              activeEffect.buff.buffedAbilites.includes(ability.name)
            ) {
              increasedDamage += activeEffect.buff.value;
            }
          });
          target.takeDamage(effect.value, increasedDamage, gameEngine);
          break;
        }
        case "Heal": {
          target.heal(effect.value, gameEngine);
          break;
        }
        case "DamageReduction": {
          target.addDamageReduction(
            ability,
            effect.damageReduction.description,
            effect.damageReduction.reducedAmount,
            effect.damageReduction.duration,
            effect.damageReduction.isPercent || false,
            gameEngine
          );
          break;
        }
        case "Transform": {
          if (effect.value && effect.value > 0) {
            target.takeDamage(effect.value, 0, gameEngine);
          }
          character.applyTransformation(
            ability,
            effect.transformation,
            effect.duration || 1,
            gameEngine
          );
          break;
        }
        case "Buff": {
          character.applyBuff(ability, effect.buff, effect.value, gameEngine);
          break;
        }
        case "EnableAbility": {
          if (effect.duration) {
            character.applyEnableAbility(
              ability,
              effect.enabledAbilities,
              effect.duration,
              gameEngine
            );
          }
          break;
        }
      }

      if (!this.isOnCooldown()) {
        // Add one because processCooldown from game-engine already subtracts 1 after executing the turn
        this.currentCooldown = this.defaultCooldown + 1;
      }

      if (this.currentCooldown === 0) {
        character.removeActiveEffect(effect);
      }
    });
  }

  isOnCooldown(): boolean {
    return this.currentCooldown > 0;
  }

  public clone(): Ability {
    return new Ability(
      this.name,
      this.description,
      [...this.requiredChakra],
      this.defaultCooldown,
      this.effects,
      this.target,
      this.isPermanent,
      this.isStacking
    );
  }
}
