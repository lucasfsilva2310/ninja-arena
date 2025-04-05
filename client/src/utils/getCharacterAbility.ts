import { Ability } from "../models/ability/ability.model";
import { Character } from "../models/character/character.model";

export const getCharacterAbility = ({
  character,
  ability,
  abilityName,
}: {
  character: Character;
  ability?: Ability;
  abilityName?: string;
}) => {
  return `/characters/${character.name
    .split(" ")
    .join("")
    .toLowerCase()}/abilities/${
    ability
      ? ability.name.split(" ").join("").toLowerCase()
      : abilityName?.split(" ").join("").toLowerCase()
  }.png`;
};
