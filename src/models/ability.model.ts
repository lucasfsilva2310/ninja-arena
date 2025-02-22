import { Character } from "./character.model";
import { ChakraType } from "./chakra.model";

export type EffectType =
  | "Damage"
  | "Heal"
  | "DamageReduction"
  | "Transform"
  | "Persistent"
  | "Stacking";

export interface AbilityEffect {
  type: EffectType;
  value: number;
  increment?: number;
  duration?: number;
  transformation?: Ability;
}

export class Ability {
  constructor(
    public name: string,
    public description: (name: string, value?: number) => string,
    public requiredChakra: ChakraType[],
    public effects: AbilityEffect[],
    public target: "Self" | "Ally" | "Enemy" | "AllEnemies" | "AllAllies",
    public isPermanent: boolean = false,
    public isStacking: boolean = false
  ) {}

  canUse(chakras: ChakraType[]): boolean {
    return this.requiredChakra.every(
      (req) => req === "Random" || chakras.includes(req)
    );
  }

  applyEffect(character: Character, ability: Ability, target: Character) {
    this.effects.forEach((effect) => {
      switch (effect.type) {
        case "Damage":
          target.takeDamage(effect.value);
          break;
        case "Heal":
          target.heal(effect.value);
          break;
        case "DamageReduction":
          target.addDamageReduction(effect.value, effect.duration || 1);
          break;
        case "Transform":
          if (effect.value > 0) {
            target.takeDamage(effect.value);
          }
          character.applyTransformation(
            ability,
            effect.transformation!,
            effect.duration || 1
          );
          break;
        case "Persistent":
          target.applyPersistentEffect(this);
          break;
        case "Stacking":
          target.applyStackingEffect(effect.value, effect.increment!);
          break;
      }
    });
  }
}
