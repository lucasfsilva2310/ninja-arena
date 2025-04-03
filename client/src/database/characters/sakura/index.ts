import { Character } from "../../../models/character.model";
import { kawarimi } from "../../abilities/kawarimi";
import { angerPunch, healing, innerStrength } from "./abilites";

export const sakura = new Character("Sakura", [
  angerPunch,
  healing,
  innerStrength,
  kawarimi,
]);
