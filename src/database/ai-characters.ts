import { Ability } from "../models/ability.model";
import { Character } from "../models/character.model";
import { kawarimi } from "./abilities/kawarimi";

const narutoKick = new Ability(
  "narutoKick",
  (name: string, value: number | undefined) =>
    `${name} throws a kick with his clones, dealing ${value} damage`,
  ["Taijutsu", "Random"],
  [{ type: "Damage", value: 20 }],
  "Enemy"
);

const rasengan = new Ability(
  "Rasengan",
  (name: string) => `${name} throws a rasengan`,
  ["Ninjutsu", "Random"],
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
  [
    {
      type: "DamageReduction",
      value: Infinity,
      duration: 1,
    },
  ],
  "Self"
);

const fireball = new Ability(
  "fireball",
  (name: string, value: number | undefined) =>
    `${name} throws a fireball jutsu, dealing ${value} damage.`,
  ["Ninjutsu", "Random"],
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
  [
    {
      type: "Damage",
      value: 35,
    },
  ],
  "Enemy"
);

const superPunch = new Ability(
  "Super Punch",
  (name: string) => `${name} throws a super punch`,
  ["Taijutsu"],
  [{ type: "Damage", value: 15 }],
  "Enemy"
);

const healing = new Ability(
  "Heal",
  (name: string) => `${name} chose an ally to use a healing jutsu.`,
  ["Ninjutsu"],
  [{ type: "Heal", value: 15 }],
  "Ally"
);

export const AICharacters = [
  new Character("Naruto", [narutoKick, rasengan, escapeClone]),
  new Character("Sasuke", [fireball, chidori, kawarimi]),
  new Character("Sakura", [superPunch, healing, kawarimi]),
];
