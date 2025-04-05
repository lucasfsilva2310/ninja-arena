import { Ability } from "./ability/ability.model";
import { ChakraType } from "./chakra/chakra.types";
import { Character } from "./character/character.model";
import { GameEngine } from "./game-engine";
import {
  CharacterEffect,
  DamageReductionCharacterEffect,
  TransformationCharacterEffect,
  BuffCharacterEffect,
  EnableAbilityCharacterEffect,
} from "./character/character.types";
import { Chakra } from "./chakra/chakra.model";

export class Player {
  chakras: ChakraType[] = [];

  constructor(public name: string, public characters: Character[] = []) {}

  receiveChakra(turn: number, gameEngine?: GameEngine) {
    const aliveCharacters = this.characters.filter((character) =>
      character.isAlive()
    );

    const isStartOfGame = turn === 1;

    if (isStartOfGame) {
      this.chakras = [new Chakra().type];
      if (gameEngine)
        gameEngine.addToHistory(`${this.name} received initial chakra`);
      return;
    }

    const newChakras = aliveCharacters.map(() => new Chakra().type);
    if (gameEngine)
      gameEngine.addToHistory(
        `${this.name} received ${newChakras.length} new chakra`
      );

    this.chakras = [...this.chakras, ...newChakras];
  }

  consumeChakra(chakra: ChakraType) {
    const index = this.chakras.indexOf(chakra);
    if (index !== -1) {
      this.chakras.splice(index, 1);
    }
  }

  transformChakras(
    chakrasToTransform: ChakraType[],
    targetChakra: ChakraType,
    gameEngine?: GameEngine
  ) {
    chakrasToTransform.forEach((chakra) => this.consumeChakra(chakra));
    this.chakras.push(targetChakra);

    if (gameEngine)
      gameEngine.addToHistory(
        `${this.name} transformed ${chakrasToTransform.length} chakras into ${targetChakra}`
      );
  }

  getChakraCount() {
    return this.chakras.reduce(
      (acc, chakra: string) => {
        const key = chakra as ChakraType;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {
        Ninjutsu: 0,
        Taijutsu: 0,
        Genjutsu: 0,
        Bloodline: 0,
      } as Record<ChakraType, number>
    );
  }

  processActiveEffects(gameEngine?: GameEngine) {
    this.characters.forEach((character) => {
      character.activeEffects = character.activeEffects.filter((effect) => {
        if (isDamageReductionEffect(effect)) {
          if (!effect.damageReduction.applied) {
            effect.damageReduction.applied = true;
            return true;
          }
          effect.damageReduction.remainingTurns--;
          if (gameEngine) {
            gameEngine.addToHistory(
              `${character.name}'s damage reduction from ${effect.name} has ${effect.damageReduction.remainingTurns} turns remaining`
            );
          }
          return effect.damageReduction.remainingTurns > 0;
        }
        if (isTransformationEffect(effect)) {
          if (!effect.transformation.applied) {
            character.applyTransformation(
              effect.transformation.originalAbility,
              effect.transformation.newAbility,
              effect.transformation.remainingTurns,
              gameEngine
            );
            effect.transformation.applied = true;
          } else {
            effect.transformation.remainingTurns--;
            if (effect.transformation.remainingTurns === 0) {
              character.revertTransformation(
                effect.transformation.newAbility,
                gameEngine
              );
              return false;
            }
            if (gameEngine) {
              gameEngine.addToHistory(
                `${character.name}'s transformation has ${effect.transformation.remainingTurns} turns remaining`
              );
            }
          }
          return true;
        }
        if (isBuffEffect(effect)) {
          if (!effect.buff.applied) {
            effect.buff.applied = true;
            return true;
          }
          effect.buff.remainingTurns--;
          if (gameEngine) {
            gameEngine.addToHistory(
              `${character.name}'s buff from ${effect.name} has ${effect.buff.remainingTurns} turns remaining`
            );
          }
          return effect.buff.remainingTurns > 0;
        }
        if (isEnableAbilityEffect(effect)) {
          if (!effect.enabledAbilities.applied) {
            effect.enabledAbilities.applied = true;
            return true;
          }
          effect.enabledAbilities.remainingTurns--;
          if (gameEngine) {
            gameEngine.addToHistory(
              `${
                character.name
              }'s enabling effect for ${effect.enabledAbilities.abilityNames.join(
                ", "
              )} has ${effect.enabledAbilities.remainingTurns} turns remaining`
            );
          }
          return effect.enabledAbilities.remainingTurns > 0;
        }

        return true;
      });
    });
  }

  processCooldowns(gameEngine?: GameEngine) {
    this.characters.forEach((character) => {
      character.abilities.forEach((ability) => {
        if (ability.isOnCooldown()) {
          ability.currentCooldown--;
          if (ability.currentCooldown === 0 && gameEngine) {
            gameEngine.addToHistory(
              `${character.name}'s ability ${ability.name} is now ready`
            );
          }
        }
      });
    });
  }

  chooseAbility(character: Character): Ability | null {
    const availableAbilities = character.abilities.filter((ability) =>
      ability.canUse(character, this.chakras)
    );

    return availableAbilities.length > 0 ? availableAbilities[0] : null;
  }

  isDefeated(): boolean {
    return this.characters.every((character) => !character.isAlive());
  }
}

// Type guard functions
function isDamageReductionEffect(
  effect: CharacterEffect
): effect is DamageReductionCharacterEffect {
  return "damageReduction" in effect;
}

function isTransformationEffect(
  effect: CharacterEffect
): effect is TransformationCharacterEffect {
  return "transformation" in effect;
}

function isBuffEffect(effect: CharacterEffect): effect is BuffCharacterEffect {
  return "buff" in effect;
}

function isEnableAbilityEffect(
  effect: CharacterEffect
): effect is EnableAbilityCharacterEffect {
  return "enabledAbilities" in effect;
}
