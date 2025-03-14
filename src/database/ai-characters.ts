import { Character } from "../models/character.model";
import { kawarimi } from "./abilities/kawarimi";
import { escapeClone } from "./characters/naruto/abilities";
import { narutoKick, rasengan } from "./characters/naruto/abilities";
import { fireball } from "./characters/sasuke/abilities";
import { healing } from "./characters/sakura/abilites";
import { angerPunch } from "./characters/sakura/abilites";
import { chidori, sharingan } from "./characters/sasuke/abilities";

export const AICharacters = [
  new Character("Naruto", [narutoKick, rasengan, escapeClone]),
  new Character("Sasuke", [fireball, chidori, sharingan, kawarimi]),
  new Character("Sakura", [angerPunch, healing, kawarimi]),
];
