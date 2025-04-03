import { Ability } from "../../models/ability.model";

export const kawarimi = new Ability(
  "Kawarimi",
  "Swap places with a log, becoming invunerable for the next turn.",
  ["Random"],
  1,
  [
    {
      type: "DamageReduction",
      damageReduction: {
        description: "This character is invunerable.",
        amount: Infinity,
        duration: 1,
      },
    },
  ],
  "Self"
);
