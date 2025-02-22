import { Ability } from "./ability.model";

type EffectType = {
  name?: string;
  description?: string;
  damageReduction?: {
    amount: number;
    duration: number;
    applied?: boolean;
  };
  transformation?: {
    originalAbility: Ability;
    newAbility: Ability;
    remainingTurns: number;
    applied?: boolean;
  };
  persistentEffects?: Ability[];
  stackingEffect?: { baseDamage: number; increment: number };
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

  takeDamage(damage: number) {
    let reducedDamage = damage;
    console.log(`${this.name} recebeu ${damage} de dano`);
    this.activeEffects.forEach((effect) => {
      console.log(effect);
      if (effect.damageReduction) {
        reducedDamage = Math.max(0, damage - effect.damageReduction.amount);
        console.log(
          `${this.name} tem ${effect.damageReduction.amount} de dano reduzido. Dano reduzido: ${reducedDamage}`
        );
      }
    });
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

  addDamageReduction(ability: Ability, amount: number, duration: number) {
    console.log(
      `recebeu ${amount} de redução de dano por ${duration} turnos. `
    );
    this.activeEffects.push({
      name: ability.name,
      description: ability.description(this.name, amount),
      damageReduction: { amount, duration },
    });
  }

  applyTransformation(
    originalAbility: Ability,
    newAbility: Ability,
    duration: number
  ) {
    console.log(
      `${this.name} trocou habilidade de ${originalAbility.name} para ${newAbility.name} por ${duration} turnos. `
    );

    this.replaceAbility(originalAbility, newAbility);

    this.activeEffects.push({
      transformation: { originalAbility, newAbility, remainingTurns: duration },
    });
  }

  revertTransformation(newAbility: Ability) {
    const transformationEffect = this.activeEffects.find(
      (effect) =>
        effect.transformation && effect.transformation.newAbility === newAbility
    );

    if (transformationEffect && transformationEffect.transformation) {
      this.replaceAbility(
        transformationEffect.transformation.newAbility,
        transformationEffect.transformation.originalAbility
      );
      console.log(
        `${this.name} reverteu a transformação de ${transformationEffect.transformation.newAbility.name} para ${transformationEffect.transformation.originalAbility.name}.`
      );
      this.activeEffects = this.activeEffects.filter(
        (effect) => effect !== transformationEffect
      );
    }
  }

  replaceAbility(oldAbility: Ability, newAbility: Ability) {
    const abilityIndex = this.abilities.findIndex(
      (ability) => ability === oldAbility
    );
    if (abilityIndex !== -1) {
      this.abilities[abilityIndex] = newAbility;
      console.log(
        `${this.name} substituiu ${oldAbility.name} por ${newAbility.name}.`
      );
    }
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
