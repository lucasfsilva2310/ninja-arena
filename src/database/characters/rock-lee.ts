import { Ability } from "../../models/ability.model";
import { Character } from "../../models/character.model";

export const hiddenLotus = new Ability(
  "Hidden Lotus",
  "Rock Lee open its 5th chakra gate, dealing 40 damage.",
  ["Taijutsu", "Random"],
  0,
  [{ type: "Damage", value: 40 }],
  "Enemy"
);
export const primaryLotus = new Ability(
  "Primary Lotus",
  "Rock Lee extends its arm bandages around its opponent, dealing 30 damage. This ability becomes Hidden Lotus for the next turn",
  ["Taijutsu"],
  1,
  [
    {
      type: "Transform",
      value: 30,
      duration: 1,
      transformation: hiddenLotus,
    },
  ],
  "Enemy"
);

export const powerOfYouth = new Ability(
  "Power of Youth",
  "Rock Lee encourage itself, healing 15 health.",
  ["Taijutsu"],
  1,
  [
    {
      type: "Heal",
      value: 15,
    },
  ],
  "Self"
);

export const konohaLeafPunch = new Ability(
  "Konoha Leaf Punch",
  "Rock Lee do one of his most famous punches, dealing 20 damage to the selected enemy.",
  ["Taijutsu"],
  1,
  [{ type: "Damage", value: 20 }],
  "Enemy"
);

export const backflip = new Ability(
  "Backflip",
  "Rock Lee do a big backflip avoiding all danger, becoming invunerable for the next turn.",
  ["Random"],
  1,
  [
    {
      type: "DamageReduction",
      value: Infinity,
      duration: 1,
    },
  ],
  "Self"
);

export const rockLee = new Character("Rock Lee", [
  konohaLeafPunch,
  primaryLotus,
  powerOfYouth,
  backflip,
]);
