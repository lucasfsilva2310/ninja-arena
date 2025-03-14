import { Character } from "../../../models/character.model";
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
