import { Ability } from "./ability.model";
import {
  Chakra,
  ChakraType,
  chakraTypes,
  InitialChakraObjType,
} from "./chakra.model";
import { Character } from "./character.model";

export class Player {
  chakras: ChakraType[] = [];

  constructor(public name: string, public characters: Character[] = []) {}

  receiveChakra(turn: number) {
    const aliveCharacters = this.characters.filter((character) =>
      character.isAlive()
    );

    const isStartOfGame = turn === 1;

    if (isStartOfGame) {
      this.chakras = [new Chakra().type];
      return;
    }

    this.chakras = [
      ...this.chakras,
      ...aliveCharacters.map(() => new Chakra().type),
    ];
  }

  consumeChakra(chakra: ChakraType) {
    const index = this.chakras.indexOf(chakra);
    if (index !== -1) {
      this.chakras.splice(index, 1);
    }
  }

  transformChakras(chakrasToTransform: ChakraType[], targetChakra: ChakraType) {
    chakrasToTransform.forEach((chakra) => this.consumeChakra(chakra));
    this.chakras.push(targetChakra);
  }

  getChakraCount() {
    return this.chakras.reduce(
      (acc, chakra: string) => {
        const key = chakra as ChakraType;

        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {
        [chakraTypes.Ninjutsu]: 0,
        [chakraTypes.Taijutsu]: 0,
        [chakraTypes.Genjutsu]: 0,
        [chakraTypes.Bloodline]: 0,
      } as InitialChakraObjType
    );
  }

  processActiveEffects() {
    this.characters.forEach((character) => {
      character.activeEffects = character.activeEffects.filter((effect) => {
        if (effect.damageReduction) {
          if (!effect.damageReduction.applied) {
            effect.damageReduction.applied = true;
            return true;
          }
          effect.damageReduction.remainingTurns--;
          return effect.damageReduction.remainingTurns > 0;
        }
        if (effect.transformation) {
          if (!effect.transformation.applied) {
            character.applyTransformation(
              effect.transformation.originalAbility,
              effect.transformation.newAbility,
              effect.transformation.remainingTurns
            );
            effect.transformation.applied = true;
          } else {
            effect.transformation.remainingTurns--;
            if (effect.transformation.remainingTurns === 0) {
              character.revertTransformation(effect.transformation.newAbility);
              console.log(
                `${character.name} voltou à sua habilidade original.`
              );
              return false;
            }
          }
          return true;
        }

        if (effect.stackingEffect) {
          effect.stackingEffect.baseDamage = Math.max(
            0,
            effect.stackingEffect.baseDamage
          );
          effect.stackingEffect.baseDamage += effect.stackingEffect.increment;
          console.log(
            `${character.name} teve seu efeito stack aumentado para ${effect.stackingEffect.baseDamage}.`
          );
          return true;
        }

        if (effect.buff) {
          if (!effect.buff.applied) {
            effect.buff.applied = true;
            return true;
          }
          effect.buff.remainingTurns--;
          return effect.buff.remainingTurns > 0;
        }

        return true;
      });
    });
  }

  processCooldowns() {
    this.characters.forEach((character) => {
      character.abilities.forEach((ability) => {
        if (ability.isOnCooldown()) {
          ability.currentCooldown--;
        }
      });
    });
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
