import { Ability } from "../../models/ability.model";
import { Character } from "../../models/character.model";
import { kawarimi } from "../abilities/kawarimi";

export const fireball = new Ability(
  "fireball",

  "Sasuke throws a fireball jutsu, dealing 25 damage.",
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

export const chidori = new Ability(
  "Chidori",
  "Sasuke creates lighting chakra around his hand, dealing 35 damage. If Sharingan is active, it will deal 10 more damage",
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

export const sharingan = new Ability(
  "Sharingan",
  "Sasuke uses the Sharingan, receiving 15 damage reduction. If chidori is used it will deal 10 more damage",
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
