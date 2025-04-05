import { Character } from "../../../models/character/character.model";
import {
  backflip,
  konohaSenpu,
  primaryLotus,
  releaseWeights,
} from "./abilities";

export const rockLee = new Character("Rock Lee", [
  konohaSenpu,
  primaryLotus,
  releaseWeights,
  backflip,
]);
