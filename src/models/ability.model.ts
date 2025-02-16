import { ChakraType } from "./chakra.model";

export class Ability {
  constructor(
    public name: string,
    public damage: number,
    public requiredChakra: ChakraType[]
  ) {}

  canUse(chakras: ChakraType[]): boolean {
    return this.requiredChakra.every((req) => chakras.includes(req));
  }
}
