import { Ability } from "./ability.model";
import { Character } from "./character.model";
import { Player } from "./player.model";

export class GameEngine {
  turn: number = 0;

  constructor(public player1: Player, public player2: Player) {}

  startGame() {
    console.log(`🎮 Jogo iniciado!`);
    this.nextTurn();
  }

  nextTurn() {
    this.turn++;
    this.player1.receiveChakra();
    this.player2.receiveChakra();
    this.processActiveEffects();
  }

  executeTurn(
    actions: { character: Character; ability: Ability; target: Character }[]
  ) {
    actions.forEach((action) => {
      if (action.character.isAlive()) {
        console.log(
          `${action.character.name} usou ${action.ability.name} em ${action.target.name}!`
        );
        action.ability.applyEffect(
          action.character,
          action.ability,
          action.target
        );
      }
    });

    this.checkGameOver();
  }

  processActiveEffects() {
    [this.player1, this.player2].forEach((player) => {
      player.characters.forEach((character) => {
        character.activeEffects = character.activeEffects.filter((effect) => {
          if (effect.damageReduction) {
            if (!effect.damageReduction.applied) {
              effect.damageReduction.applied = true;
              return true;
            }
            effect.damageReduction.duration--;
            return effect.damageReduction.duration > 0;
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
                character.revertTransformation(
                  effect.transformation.newAbility
                );
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

          return true;
        });
      });
    });
  }

  checkGameOver(): boolean {
    return this.player1.isDefeated() || this.player2.isDefeated();
  }
}
