import { Character } from "./character.model";
import { ChakraType } from "./chakra.model";
import { GameEngine } from "./game-engine";

export type EffectType =
  | "Damage"
  | "Heal"
  | "DamageReduction"
  | "Transform"
  | "Persistent"
  | "Stacking"
  | "Buff";

export interface AbilityEffect {
  name?: string;
  description?: string;
  type: EffectType;
  value?: number;

  // Specific Effects
  duration?: number;

  // Stacking
  increment?: number;

  // Transform
  transformation?: Ability;

  // Damage Reduction
  damageReduction?: DamageReductionEffect;

  // Buff
  buff?: BuffEffect;
}

export interface DamageReductionEffect {
  description: string;
  amount: number;
  duration: number;
  isPercent?: boolean;
}

export interface BuffEffect {
  description: string;
  buffedAbilites: string[];
  remainingTurns: number;
  buffType: "Damage" | "Heal";
}

export class Ability {
  public currentCooldown: number = 0;

  constructor(
    public name: string,
    public description: string,
    public requiredChakra: ChakraType[],
    public defaultCooldown: number,
    public effects: AbilityEffect[],
    public target: "Self" | "Ally" | "Enemy" | "AllEnemies" | "AllAllies",
    public isPermanent: boolean = false,
    public isStacking: boolean = false
  ) {
    this.effects.map((effect) => ({
      ...effect,
      name: effect.name || this.name,
      description: effect.description || this.description,
    }));
  }

  canUse(char: Character, chakras: ChakraType[]): boolean {
    if (this.isOnCooldown()) return false;
    if (!char.isAlive()) return false;

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
      let increasedDamage: number = 0;
      switch (effect.type) {
        case "Damage":
          character.activeEffects.forEach((effect) => {
            if (
              effect.buff &&
              effect.buff.buffedAbilites.includes(ability.name)
            ) {
              increasedDamage += effect.buff.value;
            }
          });
          target.takeDamage(effect.value!, increasedDamage, gameEngine);
          break;
        case "Heal":
          target.heal(effect.value!, gameEngine);
          break;
        case "DamageReduction":
          if (effect.damageReduction) {
            target.addDamageReduction(
              ability,
              effect.damageReduction.description,
              effect.damageReduction.amount,
              effect.damageReduction.duration || 1,
              effect.damageReduction.isPercent || false,
              gameEngine
            );
          }
          break;
        case "Transform":
          if (effect.value! > 0) {
            target.takeDamage(effect.value!, 0, gameEngine);
          }
          character.applyTransformation(
            ability,
            effect.transformation!,
            effect.duration || 1,
            gameEngine
          );
          break;
        case "Buff":
          character.applyBuff(ability, effect.buff!, effect.value!, gameEngine);
          break;
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
