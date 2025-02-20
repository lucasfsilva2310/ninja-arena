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
  }

  executeTurn(
    actions: { character: Character; ability: Ability; target: Character }[]
  ) {
    actions.forEach((action) => {
      if (action.character.isAlive()) {
        console.log(
          `${action.character.name} usou ${action.ability.name} em ${action.target.name}!`
        );
        action.ability.applyEffect(action.target);
      }
    });

    this.checkGameOver();
  }

  checkGameOver(): boolean {
    return this.player1.isDefeated() || this.player2.isDefeated();
  }
}
