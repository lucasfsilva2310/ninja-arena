import { Ability } from "../../models/ability.model";
import { Character } from "../../models/character.model";
import { kawarimi } from "../abilities/kawarimi";

const fireball = new Ability(
  "fireball",
  (name: string, value: number | undefined) =>
    `${name} throws a fireball jutsu, dealing ${value} damage.`,
  ["Ninjutsu"],
  1,
  [
    {
      type: "Damage",
      value: 25,
    },
  ],
  "Enemy"
);

const chidori = new Ability(
  "Chidori",
  (name: string, value: number | undefined) =>
    `${name} creates lighting chakra around his hand, dealing ${value} damage.`,
  ["Ninjutsu", "Random"],
  1,
  [
    {
      type: "Damage",
      value: 35,
    },
  ],
  "Enemy"
);

const sharingan = new Ability(
  "Sharingan",
  (name: string) =>
    `${name} uses the Sharingan, receiving 15 damage reduction. If chidori is used it will deal 10 more damage`,
  ["Bloodline", "Random"],
  4,
  [
    {
      type: "DamageReduction",
      value: 15,
      duration: 2,
    },
    {
      type: "Buff",
      value: 10,
      buff: {
        buffedAbilites: ["Chidori"],
        buffType: "Damage",
        remainingTurns: 2,
      },
    },
  ],
  "Self"
);

export const sasuke = new Character("Sasuke", [
  fireball,
  sharingan,
  chidori,
  kawarimi,
]);
