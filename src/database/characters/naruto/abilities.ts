import { Ability } from "../../../models/ability.model";

export const narutoKick = new Ability(
  "Naruto Kick",
  "Naruto throws a kick with his clones, dealing 20 damage. If Kage Bunshin is active, it deals 30 damage.",
  ["Taijutsu", "Random"],
  0,
  [{ type: "Damage", value: 20 }],
  "Enemy"
);

export const rasengan = new Ability(
  "Rasengan",
  "Naruto throws a rasengan, dealing 35 damage. It can only be used if Kage Bunshin is active.",
  ["Ninjutsu", "Random"],
  1,
  [
    {
      type: "Damage",
      value: 35,
      needsEnabler: "Kage Bunshin", //TODO: find way to add kagebunshin.name
    },
  ],
  "Enemy"
);

export const escapeClone = new Ability(
  "Escape Clone",
  "Naruto creates an clone to be used as a distraction, becoming invunerable for the next turn.",
  ["Random"],
  1,
  [
    {
      type: "DamageReduction",
      damageReduction: {
        description: "This character is invunerable.",
        amount: Infinity,
        duration: 1,
      },
    },
  ],
  "Self"
);

export const kagebunshin = new Ability(
  "Kage Bunshin",
  "Naruto creates clones, gaining 15% damage reduction for three turns. Naruto Kick now deals 30 damage. Rasengan now can be used.",
  ["Random"],
  5,
  [
    {
      type: "DamageReduction",
      damageReduction: {
        amount: 15,
        duration: 3,
        isPercent: true,
        description: "This character has 15% damage reduction.",
      },
    },
    {
      type: "Buff",
      value: 10,
      buff: {
        buffedAbilites: [narutoKick.name],
        buffType: "Damage",
        remainingTurns: 3,
        description: `This character has 10 damage increase on "${narutoKick.name}".`,
      },
    },
    {
      type: "EnableAbility",
      enabledAbilities: [rasengan.name],
      duration: 3,
      description: "This character can now use Rasengan.",
    },
  ],
  "Self"
);
