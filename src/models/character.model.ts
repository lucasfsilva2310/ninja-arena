import { Ability } from "./ability.model";

type EffectType = {
  damageReduction?: { amount: number; duration: number };
  transformation?: { newAbility: Ability; remainingTurns: number };
  persistentEffects?: Ability[];
  stackingEffect?: { baseDamage: number; increment: number };
};

export class Character {
  hp: number = 100;
  activeEffects: EffectType[] = [];

  constructor(public name: string, public abilities: Ability[]) {}

  isAlive(): boolean {
    return this.hp > 0;
  }

  takeDamage(damage: number) {
    let reducedDamage = damage;
    console.log(
      `${this.name} recebeu ${damage} de dano. Dano reduzido: ${reducedDamage}`
    );
    this.activeEffects.forEach((effect) => {
      console.log(effect);
      if (effect.damageReduction) {
        reducedDamage = Math.max(0, damage - effect.damageReduction.amount);
        console.log(
          `${this.name} recebeu ${damage} de dano e ${effect.damageReduction.amount} de dano reduzido. Dano reduzido: ${reducedDamage}`
        );
      }
    });
    console.log(Math.max(0, this.hp - reducedDamage));
    this.hp = Math.max(0, this.hp - reducedDamage);
  }

  heal(amount: number) {
    this.hp = Math.min(100, this.hp + amount);
  }

  addDamageReduction(amount: number, duration: number) {
    this.activeEffects.push({ damageReduction: { amount, duration } });
  }

  applyTransformation(newAbility: Ability, duration: number) {
    this.activeEffects.push({
      transformation: { newAbility, remainingTurns: duration },
    });
  }

  applyPersistentEffect(ability: Ability) {
    this.activeEffects.push({ persistentEffects: [ability] });
  }

  applyStackingEffect(baseDamage: number, increment: number) {
    const existingEffect = this.activeEffects.find(
      (effect) => effect.stackingEffect !== undefined
    );

    if (existingEffect && existingEffect.stackingEffect) {
      existingEffect.stackingEffect.baseDamage += increment;
    } else {
      this.activeEffects.push({ stackingEffect: { baseDamage, increment } });
    }
  }
}
