import { Character } from "../../../models/character/character.model";
import { kawarimi } from "../../abilities/kawarimi";
import { chidori, fireball, sharingan } from "./abilities";

export const sasuke = new Character("Sasuke", [
  fireball,
  sharingan,
  chidori,
  kawarimi,
]);
