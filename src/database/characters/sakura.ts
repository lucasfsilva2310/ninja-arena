import { Ability } from "../../models/ability.model";
import { Character } from "../../models/character.model";
import { kawarimi } from "../abilities/kawarimi";

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

export const sakura = new Character("Sakura", [superPunch, healing, kawarimi]);
