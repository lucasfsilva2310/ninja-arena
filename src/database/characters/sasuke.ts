import { Ability } from "../../models/ability.model";
import { Character } from "../../models/character.model";
import { kawarimi } from "../abilities/kawarimi";

const fireball = new Ability(
  "fireball",
  (name: string, value: number | undefined) =>
    `${name} throws a fireball jutsu, dealing ${value} damage.`,
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

const chidori = new Ability(
  "chidori",
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

export const sasuke = new Character("Sasuke", [fireball, chidori, kawarimi]);
