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
};

export type InitialChakraObjType = {
  [key in string]: number;
};

export type ChakraType = (typeof chakraTypes)[keyof typeof chakraTypes];

export class Chakra {
  type: ChakraType;

  constructor() {
    const types = Object.values({
      Ninjutsu: chakraTypes.Ninjutsu,
      Taijutsu: chakraTypes.Taijutsu,
      Genjutsu: chakraTypes.Genjutsu,
      Bloodline: chakraTypes.Bloodline,
    }) as ChakraType[];

    this.type = types[getRandomIndex(types)];
  }
}
