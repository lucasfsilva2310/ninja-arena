import { Ability } from "../models/ability.model";
import { Character } from "../models/character.model";

const fireball = new Ability(
  "fireball",
  ["Ninjutsu", "Random"],
  [{ type: "Stacking", value: 20, increment: 5 }],
  "Enemy"
);
const narutoKick = new Ability(
  "narutoKick",
  ["Taijutsu", "Random"],
  [{ type: "Damage", value: 20 }],
  "Enemy"
);
const kawarimi = new Ability(
  "Kawarimi",
  ["Random"],
  [{ type: "DamageReduction", value: Infinity, duration: 1 }],
  "Self"
);
const hiddenLotus = new Ability(
  "Hidden Lotus",
  ["Taijutsu", "Random"],
  [{ type: "Damage", value: 40 }],
  "Self"
);
const primaryLotus = new Ability(
  "Primary Lotus",
  ["Taijutsu"],
  [{ type: "Transform", value: 30, duration: 1, transformation: hiddenLotus }],
  "Enemy"
);
const healing = new Ability(
  "Heal",
  ["Ninjutsu"],
  [{ type: "Heal", value: 15 }],
  "Ally"
);

export const availableCharacters = [
  new Character("Naruto", [fireball, narutoKick]),
  new Character("Sasuke", [fireball, kawarimi]),
  new Character("Sakura", [healing, kawarimi]),
  new Character("Rock Lee", [primaryLotus, kawarimi]),
];

export const AICharacters = [
  new Character("Naruto", [fireball, narutoKick]),
  new Character("Sasuke", [fireball, kawarimi]),
  new Character("Rock Lee", [primaryLotus, kawarimi]),
];
