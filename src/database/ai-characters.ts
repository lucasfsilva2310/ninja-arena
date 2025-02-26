import { Character } from "../models/character.model";
import { kawarimi } from "./abilities/kawarimi";
import { escapeClone, narutoKick, rasengan } from "./characters/naruto";
import { healing, superPunch } from "./characters/sakura";
import { chidori, fireball, sharingan } from "./characters/sasuke";

export const AICharacters = [
  new Character("Naruto", [narutoKick, rasengan, escapeClone]),
  new Character("Sasuke", [fireball, chidori, sharingan, kawarimi]),
  new Character("Sakura", [superPunch, healing, kawarimi]),
];
