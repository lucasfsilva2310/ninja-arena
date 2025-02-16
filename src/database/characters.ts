import { Ability } from "../models/ability.model";
import { Character } from "../models/character.model";

export const availableCharacters = [
  new Character("Naruto", [
    new Ability("Rasengan", 30, ["Ninjutsu"]),
    new Ability("Clone das Sombras", 10, ["Random"]),
  ]),
  new Character("Sasuke", [
    new Ability("Chidori", 35, ["Ninjutsu", "Taijutsu"]),
    new Ability("Sharingan", 15, ["Genjutsu"]),
  ]),
  new Character("Sakura", [
    new Ability("Soco de Chakra", 20, ["Taijutsu"]),
    new Ability("Cura", -10, ["Random"]),
  ]),
  new Character("Kakashi", [
    new Ability("Raikiri", 40, ["Ninjutsu", "Taijutsu"]),
    new Ability("Mangekyou Sharingan", 25, ["Genjutsu"]),
  ]),
];
