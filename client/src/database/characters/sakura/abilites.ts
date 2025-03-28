import { Ability } from "../../../models/ability.model";

export const angerPunch = new Ability(
  "Anger Punch",
  "Sakura throws a anger punch with all her strength, dealing 15 damage to the enemy.",
  ["Taijutsu"],
  0,
  [{ type: "Damage", value: 15 }],
  "Enemy"
);

export const healing = new Ability(
  "Heal",
  "Sakura chose an ally to heal it's wounds, healing 15 health.",
  ["Ninjutsu"],
  0,
  [{ type: "Heal", value: 15 }],
  "Ally"
);

export const innerStrength = new Ability(
  "Inner Strength",
  "Sakura uses her inner strength to increase her attack power by 5 and gaining 10 damage reduction for 3 turns.",
  ["Random"],
  4,
  [
    {
      type: "DamageReduction",
      damageReduction: {
        amount: 10,
        duration: 3,
        description: "This character has 10 damage reduction.",
      },
    },
    {
      type: "Buff",
      value: 10,
      buff: {
        description: 'Increases attack power for "Anger Punch" by 10.',
        buffedAbilites: ["Anger Punch"],
        remainingTurns: 3,
        buffType: "Damage",
      },
    },
  ],
  "Self"
);
