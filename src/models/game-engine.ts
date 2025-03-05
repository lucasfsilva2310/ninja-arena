import { Ability } from "./ability.model";
import { Character } from "./character.model";
import { Player } from "./player.model";

export class GameEngine {
  turn: number = 0;
  currentPlayer: Player;
  actionHistory: string[] = [];

  constructor(public player1: Player, public player2: Player) {
    this.currentPlayer = player1;
  }

  addToHistory(message: string) {
    const formattedMessage = `Turn ${this.turn}: ${message}`;
    console.log(formattedMessage);
    this.actionHistory.push(formattedMessage);
  }

  startGame() {
    this.addToHistory(`🎮 Game started! ${this.player1.name}'s turn`);
    this.nextTurn(this.player1);
  }

  nextTurn(player: Player) {
    this.turn++;
    this.currentPlayer = player;
    this.addToHistory(
      `🎮 Turn ${this.turn}! It's ${this.currentPlayer.name}'s turn`
    );
    player.receiveChakra(this.turn, this);
    player.processCooldowns(this);
    player.processActiveEffects(this);
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
        this.addToHistory(
          `${action.character.name} used ${action.ability.name} on ${action.target.name}!`
        );
        action.ability.applyEffect(
          action.character,
          action.ability,
          action.target,
          this
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

  getActionHistory(): string[] {
    return this.actionHistory;
  }
}
