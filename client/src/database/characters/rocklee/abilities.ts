import { Ability } from "../../../models/ability.model";

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

export const releaseWeights = new Ability(
  "Release Weights",
  "Rock Lee release his weights, becoming faster and doing more damage. Now Rock lee has 20% chance of dodging all receiving attacks.",
  ["Taijutsu"],
  1,
  [
    {
      type: "DamageReduction",
      value: Infinity,
      duration: 1,
      description: "This character is invunerable.",
    },
  ],
  "Self"
);

export const konohaSenpu = new Ability(
  "Konoha Senpu",
  "Rock Lee do his most famouse move, dealing 20 damage to the selected enemy. This ability stacks and does 5 more damage each time it is used.",
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
      description: "This character is invunerable.",
    },
  ],
  "Self"
);
