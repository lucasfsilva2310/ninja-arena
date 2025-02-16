import { Ability } from "./ability.model";
import { Chakra, ChakraType } from "./chakra.model";
import { Character } from "./character.model";

export class Player {
  chakras: ChakraType[] = [];

  constructor(public name: string, public characters: Character[] = []) {}

  receiveChakra() {
    this.chakras = [new Chakra().type, new Chakra().type, new Chakra().type];
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
