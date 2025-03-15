import { Character } from "../models/character.model";

export const getCharacterAvatar = (character: Character) => {
  return `/characters/${character.name
    .split(" ")
    .join("")
    .toLowerCase()}/avatar/${character.name
    .split(" ")
    .join("")
    .toLowerCase()}.png`;
};
