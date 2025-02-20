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
    console.log(
      `${this.name} recebeu ${amount} de cura. Vida atual: ${Math.min(
        100,
        this.hp + amount
      )}`
    );
    this.hp = Math.min(100, this.hp + amount);
  }

  addDamageReduction(amount: number, duration: number) {
    console.log(
      `${this.name} recebeu ${amount} de redução de dano por ${duration} turnos. `
    );
    this.activeEffects.push({ damageReduction: { amount, duration } });
  }

  applyTransformation(newAbility: Ability, duration: number) {
    console.log(
      `${this.name} trocou habilidade para ${newAbility.name} por ${duration} turnos. `
    );
    this.activeEffects.push({
      transformation: { newAbility, remainingTurns: duration },
    });
  }

  applyPersistentEffect(ability: Ability) {
    console.log(`${this.name} aplicou ${ability.name} persistentemente. `);
    this.activeEffects.push({ persistentEffects: [ability] });
  }

  applyStackingEffect(baseDamage: number, increment: number) {
    const existingEffect = this.activeEffects.find(
      (effect) => effect.stackingEffect !== undefined
    );
    console.log(`${this.name} aplicou efeito stack somando ${increment}. `);

    if (existingEffect && existingEffect.stackingEffect) {
      console.log(`${this.name} incrementou efeito stack ${increment}. `);
      existingEffect.stackingEffect.baseDamage += increment;
    } else {
      console.log(`${this.name} aplicou baseDamage ${baseDamage}. `);
      this.activeEffects.push({ stackingEffect: { baseDamage, increment } });
    }
  }
}
// TODO: Criar sistema de aplicação de efeitos ativos quando finalizar o turno
// iterar pelo array, somando todos os persistentes para devolver o total
// iterar pelo array, somando todos os stackings para devolver o total
// aplica o baseDamage somente na primeira vez, e utiliza o total stacking para a função especifica
// EX: aumentar dano no total stackado
