import { rockleeBackflipAnimation } from "./backflip";
import { rockleeDefaultAnimation } from "./default";
import { rockleeHiddenLotusAnimation } from "./hiddenlotus";
import { rockleeKonohaSenpuAnimation } from "./konohasenpu";
import { rockleePrimaryLotusAnimation } from "./primarylotus";
import { rockleeReleaseWeightsAnimation } from "./releaseweights";

export const rockleeAnimations = {
  default: rockleeDefaultAnimation,
  primarylotus: rockleePrimaryLotusAnimation,
  hiddenlotus: rockleeHiddenLotusAnimation,
  konohasenpu: rockleeKonohaSenpuAnimation,
  releaseweights: rockleeReleaseWeightsAnimation,
  backflip: rockleeBackflipAnimation,
};
