import { Ability } from "../../models/ability.model";
import { Character } from "../../models/character.model";

const narutoKick = new Ability(
  "narutoKick",
  (name: string, value: number | undefined) =>
    `${name} throws a kick with his clones, dealing ${value} damage`,
  ["Taijutsu", "Random"],
  0,
  [{ type: "Damage", value: 20 }],
  "Enemy"
);

const rasengan = new Ability(
  "Rasengan",
  (name: string) => `${name} throws a rasengan`,
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

const escapeClone = new Ability(
  "escapeClone",
  (name: string) =>
    `${name} creates an clone to be targeted, becoming invunerable for the next turn.`,
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

export const naruto = new Character("Naruto", [
  narutoKick,
  rasengan,
  escapeClone,
]);
