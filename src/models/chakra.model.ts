import { getRandomIndex } from "../utils/getRandomIndex";

export const chakraTypes = {
  Ninjutsu: "Ninjutsu",
  Taijutsu: "Taijutsu",
  Genjutsu: "Genjutsu",
  Bloodline: "Bloodline",
  Random: "Random",
} as const;

export const initialChakraObj: InitialChakraObjType = {
  [chakraTypes.Ninjutsu]: 0,
  [chakraTypes.Taijutsu]: 0,
  [chakraTypes.Genjutsu]: 0,
  [chakraTypes.Bloodline]: 0,
  [chakraTypes.Random]: 0,
};

export type InitialChakraObjType = {
  [key in ChakraType]: number;
};

export type ChakraType = (typeof chakraTypes)[keyof typeof chakraTypes];

export class Chakra {
  type: ChakraType;

  constructor() {
    const types = Object.values(chakraTypes) as ChakraType[];
    this.type = types[getRandomIndex(types)];
  }
}
