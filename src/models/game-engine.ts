import { Ability } from "./ability.model";
import { Character } from "./character.model";
import { Player } from "./player.model";

export class GameEngine {
  turn: number = 0;
  currentPlayer: Player;

  constructor(public player1: Player, public player2: Player) {
    this.currentPlayer = player1;
  }

  startGame() {
    console.log(`🎮 Jogo iniciado! Turno de ${this.player1.name}`);
    this.nextTurn(this.player1);
  }

  nextTurn(player: Player) {
    this.turn++;
    this.currentPlayer = player;
    console.log(`🎮 Turn ${this.turn}! It's ${this.currentPlayer.name} turn.`);
    player.receiveChakra(this.turn);
    player.processCooldowns();
    player.processActiveEffects();
  }

  executeTurn(
    actions: {
      player: Player;
      character: Character;
      ability: Ability;
      target: Character;
    }[]
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
        action.ability.requiredChakra.forEach((chakra) => {
          action.player.consumeChakra(chakra);
        });
      }
    });

    this.checkGameOver();
  }

  processCooldowns() {
    [this.player1, this.player2].forEach((player) => {
      player.characters.forEach((character) => {
        character.abilities.forEach((ability) => {
          if (ability.isOnCooldown()) {
            ability.currentCooldown--;
          }
        });
      });
    });
  }

  checkGameOver(): boolean {
    return this.player1.isDefeated() || this.player2.isDefeated();
  }
}
