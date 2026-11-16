export const chakraTypes = {
  Ninjutsu: "Ninjutsu",
  Taijutsu: "Taijutsu",
  Genjutsu: "Genjutsu",
  Bloodline: "Bloodline",
  Random: "Random",
} as const;

export const chakraTypesWithoutRandom: ChakraType[] = [
  chakraTypes.Ninjutsu,
  chakraTypes.Taijutsu,
  chakraTypes.Genjutsu,
  chakraTypes.Bloodline,
];

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
