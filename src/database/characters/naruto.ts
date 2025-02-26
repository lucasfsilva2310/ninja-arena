import { Ability } from "../../models/ability.model";
import { Character } from "../../models/character.model";

export const narutoKick = new Ability(
  "Naruto Kick",
  "Naruto throws a kick with his clones, dealing 20 damage. If Kagebunshin is active, it deals 30 damage.",
  ["Taijutsu", "Random"],
  0,
  [{ type: "Damage", value: 20 }],
  "Enemy"
);

export const rasengan = new Ability(
  "Rasengan",
  "Naruto throws a rasengan",
  ["Ninjutsu", "Random"],
  1,
  [
    {
      type: "Damage",
      value: 30,
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
      value: Infinity,
      duration: 1,
    },
  ],
  "Self"
);

export const kagebunshin = new Ability(
  "Kage Bunshin",
  "Naruto creates clones, gaining 15% damage reduction for three turns. Naruto Kick now deals 30 damage. Rasengan now can be used(add enable logic).",
  ["Random"],
  5,
  [
    {
      type: "DamageReduction",
      damageReduction: { amount: 15, duration: 3, isPercent: true },
    },
    {
      type: "Buff",
      value: 10,
      buff: {
        buffedAbilites: ["Naruto Kick"],
        buffType: "Damage",
        remainingTurns: 3,
      },
    },
  ],
  "Self"
);

export const naruto = new Character("Naruto", [
  kagebunshin,
  narutoKick,
  rasengan,
  escapeClone,
]);
