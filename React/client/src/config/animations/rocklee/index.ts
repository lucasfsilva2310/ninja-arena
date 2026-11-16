import { rockleeBackflipAnimation } from "./backflip-animation";
import { rockleeDefaultAnimation } from "./default-animation";
import { rockleeHiddenLotusAnimation } from "./hiddenlotus-animation";
import { rockleeKonohaSenpuAnimation } from "./konohasenpu-animation";
import { rockleePrimaryLotusAnimation } from "./primarylotus-animation";
import { rockleeReleaseWeightsAnimation } from "./releaseweights-animation";

export const rockleeAnimations = {
  default: rockleeDefaultAnimation,
  primarylotus: rockleePrimaryLotusAnimation,
  hiddenlotus: rockleeHiddenLotusAnimation,
  konohasenpu: rockleeKonohaSenpuAnimation,
  releaseweights: rockleeReleaseWeightsAnimation,
  backflip: rockleeBackflipAnimation,
};
