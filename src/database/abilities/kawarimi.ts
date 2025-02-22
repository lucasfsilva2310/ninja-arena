import { Ability } from "../../models/ability.model";

export const kawarimi = new Ability(
  "Kawarimi",
  (name: string) =>
    `${name} swap places with a log, becoming invunerable for the next turn.`,
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
