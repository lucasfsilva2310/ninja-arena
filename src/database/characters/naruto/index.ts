import { Character } from "../../../models/character.model";
import { escapeClone, rasengan } from "./abilities";
import { narutoKick } from "./abilities";
import { kagebunshin } from "./abilities";

export const naruto = new Character("Naruto", [
  kagebunshin,
  narutoKick,
  rasengan,
  escapeClone,
]);
