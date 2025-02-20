import { Ability } from "./ability.model";
import {
  Chakra,
  ChakraType,
  initialChakraObj,
  InitialChakraObjType,
} from "./chakra.model";
import { Character } from "./character.model";

export class Player {
  chakras: ChakraType[] = [];

  constructor(public name: string, public characters: Character[] = []) {}

  receiveChakra() {
    this.chakras = [
      ...this.chakras,
      new Chakra().type,
      new Chakra().type,
      new Chakra().type,
    ];
  }

  getChakraCount() {
    return this.chakras.reduce(
      (acc, chakra: string) => {
        const key = chakra as ChakraType;

        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      { ...initialChakraObj } as InitialChakraObjType
    );
  }

  chooseAbility(character: Character): Ability | null {
    const availableAbilities = character.abilities.filter((ability) =>
      ability.canUse(this.chakras)
    );

    return availableAbilities.length > 0 ? availableAbilities[0] : null;
  }

  isDefeated(): boolean {
    return this.characters.every((character) => !character.isAlive());
  }
}
