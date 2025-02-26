import { Ability } from "../../models/ability.model";
import { Character } from "../../models/character.model";
import { kawarimi } from "../abilities/kawarimi";

export const superPunch = new Ability(
  "Super Punch",
  (name: string) => `${name} throws a super punch`,
  ["Taijutsu"],
  0,
  [{ type: "Damage", value: 15 }],
  "Enemy"
);

export const healing = new Ability(
  "Heal",
  (name: string) => `${name} chose an ally to use a healing jutsu.`,
  ["Ninjutsu"],
  0,
  [{ type: "Heal", value: 15 }],
  "Ally"
);

export const sakura = new Character("Sakura", [superPunch, healing, kawarimi]);
