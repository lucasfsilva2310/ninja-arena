import { Ability } from "../../models/ability.model";
import { Character } from "../../models/character.model";

export const hiddenLotus = new Ability(
  "Hidden Lotus",
  (name: string) => `${name} open its 5th chakra gate, dealing 40 damage.`,
  ["Taijutsu", "Random"],
  0,
  [{ type: "Damage", value: 40 }],
  "Enemy"
);
export const primaryLotus = new Ability(
  "Primary Lotus",
  (name: string, value?: number | undefined) =>
    `${name} extends its arm bandages around its opponent, dealing ${value} damage. This ability becomes Hidden Lotus for the next turn`,
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
  (name: string, value?: number | undefined) =>
    `${name}  encourage itself, healing ${value} health.`,
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

export const backflip = new Ability(
  "Backflip",
  (name: string) =>
    `${name} do a big backflip avoiding all danger, becoming invunerable for the next turn.`,
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
  primaryLotus,
  powerOfYouth,
  backflip,
]);
