import { Ability } from "../../models/ability.model";

export const kawarimi = new Ability(
  "Kawarimi",
  (name: string) => `${name} throws a kawarimi jutsu`,
  ["Random"],
  [
    {
      type: "DamageReduction",
      value: Infinity,
      duration: 1,
    },
  ],
  "Self"
);
