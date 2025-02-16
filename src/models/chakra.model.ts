export const chakraTypes = {
  Ninjutsu: "Ninjutsu",
  Taijutsu: "Taijutsu",
  Genjutsu: "Genjutsu",
  Random: "Random",
};

export const initialChakraObj: InitialChakraObjType = {
  [chakraTypes.Ninjutsu]: 0,
  [chakraTypes.Taijutsu]: 0,
  [chakraTypes.Genjutsu]: 0,
  [chakraTypes.Random]: 0,
};

export type InitialChakraObjType = {
  [key: ChakraType]: number;
};

export type ChakraType = (typeof chakraTypes)[keyof typeof chakraTypes];

export class Chakra {
  type: ChakraType;

  constructor() {
    const types: ChakraType[] = Object.values(chakraTypes);
    this.type = types[Math.floor(Math.random() * types.length)];
  }
}
