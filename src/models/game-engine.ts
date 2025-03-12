import { Ability } from "./ability.model";
import { Character } from "./character.model";
import { ChakraType } from "./chakra.model";
import { Player } from "./player.model";

// Define the new SelectedAction interface in the GameEngine file
export interface SelectedAction {
  attackerPlayer: Player;
  attackerCharacter: Character;
  attackerAbility: Ability;
  targetCharacter: Character;
  targetPlayer: Player;
}

export class GameEngine {
  turn: number = 0;
  currentPlayer: Player;
  actionHistory: string[] = [];
  // New property for action queue
  private actionQueue: SelectedAction[] = [];
  private stateListeners: Array<() => void> = [];

  constructor(public player1: Player, public player2: Player) {
    this.currentPlayer = player1;
  }

  // Observer pattern for state changes
  subscribe(listener: () => void): () => void {
    this.stateListeners.push(listener);
    return () => {
      this.stateListeners = this.stateListeners.filter((l) => l !== listener);
    };
  }

  private notifyStateChange() {
    this.stateListeners.forEach((listener) => listener());
  }

  // New method to add an action to the queue
  addSelectedAction(action: SelectedAction): void {
    this.actionQueue.push(action);
    this.notifyStateChange();
  }

  // New method to remove an action from the queue
  removeSelectedAction(index: number): void {
    if (index >= 0 && index < this.actionQueue.length) {
      this.actionQueue.splice(index, 1);
      this.notifyStateChange();
    }
  }

  // New method to get the current action queue
  getActionQueue(): SelectedAction[] {
    return [...this.actionQueue];
  }

  // New method to clear the action queue
  clearActionQueue(): void {
    this.actionQueue = [];
    this.notifyStateChange();
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
    // Clear action queue when turn changes
    this.clearActionQueue();
    this.notifyStateChange();
  }

  // Method to handle chakra transformations
  transformChakras(
    player: Player,
    chakrasToTransform: ChakraType[],
    targetChakra: ChakraType
  ) {
    player.transformChakras(chakrasToTransform, targetChakra, this);
    this.notifyStateChange();
  }

  // Updated executeTurn to use the internal action queue
  executeTurn() {
    const actions = [...this.actionQueue];

    if (actions.length === 0) {
      this.addToHistory(`${this.currentPlayer.name} took no action this turn.`);
    } else {
      // Process each action
      actions.forEach((action) => {
        if (action.attackerCharacter.isAlive()) {
          this.addToHistory(
            `${action.attackerCharacter.name} used ${action.attackerAbility.name} on ${action.targetCharacter.name}!`
          );

          // Consume required chakras (non-Random ones)
          action.attackerAbility.requiredChakra
            .filter((chakra) => chakra !== "Random")
            .forEach((chakra) => {
              action.attackerPlayer.consumeChakra(chakra);
            });

          // Apply ability effect
          action.attackerAbility.applyEffect(
            action.attackerCharacter,
            action.attackerAbility,
            action.targetCharacter,
            this
          );
        }
      });
    }

    // Clear the queue after execution
    this.clearActionQueue();
    this.checkGameOver();
    this.notifyStateChange();
  }

  // Method to handle Random chakra replacements - updated for new structure
  replaceRandomChakras(
    player: Player,
    actionsWithRandom: Array<{ attackerAbility: Ability }>,
    replacementChakras: ChakraType[]
  ) {
    // Count total Random chakras needed
    const totalRandomChakras = actionsWithRandom.reduce(
      (count, action) =>
        count +
        action.attackerAbility.requiredChakra.filter((c) => c === "Random")
          .length,
      0
    );

    // Ensure we have enough replacement chakras
    if (replacementChakras.length !== totalRandomChakras) {
      throw new Error(
        `Need ${totalRandomChakras} chakras to replace Random, but got ${replacementChakras.length}`
      );
    }

    // Consume the replacement chakras
    replacementChakras.forEach((chakra) => player.consumeChakra(chakra));
    this.notifyStateChange();

    return true;
  }

  // Update generateAIActions to use the new SelectedAction structure
  generateAIActions(): SelectedAction[] {
    const aiActions: SelectedAction[] = [];

    this.player2.characters.forEach((char) => {
      if (char.hp > 0) {
        const availableAbilities = char.abilities.filter(
          (ability) =>
            ability.canUse(char, this.player2.chakras) &&
            !ability.effects.find(
              (effect) => effect.damageReduction?.amount === Infinity
            )
        );

        if (availableAbilities.length > 0) {
          const randomAbility =
            availableAbilities[
              Math.floor(Math.random() * availableAbilities.length)
            ];
          let targets: Character[] = [];

          switch (randomAbility.target) {
            case "Enemy":
              targets = this.player1.characters.filter((c) => c.hp > 0);
              break;
            case "AllEnemies":
              targets = this.player1.characters;
              break;
            case "Ally":
              targets = this.player2.characters.filter((c) => c.hp > 0);
              break;
            case "AllAllies":
              targets = this.player2.characters;
              break;
            case "Self":
              targets = [char];
              break;
          }

          if (targets.length > 0) {
            const target = targets[Math.floor(Math.random() * targets.length)];
            aiActions.push({
              attackerPlayer: this.player2,
              attackerCharacter: char,
              attackerAbility: randomAbility,
              targetCharacter: target,
              targetPlayer: this.player1,
            });
          }
        }
      }
    });

    return aiActions;
  }

  // Improved AI turn execution - updated for new structure
  executeAITurn() {
    const aiActions = this.generateAIActions();

    if (aiActions.length === 0) {
      this.addToHistory(`${this.player2.name} took no action this turn.`);
    } else {
      // For Random chakras in AI abilities, select random replacements
      aiActions.forEach((action) => {
        const randomChakrasNeeded =
          action.attackerAbility.requiredChakra.filter(
            (c) => c === "Random"
          ).length;
        if (randomChakrasNeeded > 0) {
          // Get available chakras (copy to avoid modifying while iterating)
          const availableChakras = [...this.player2.chakras];

          // Select random chakras as replacements
          for (
            let i = 0;
            i < randomChakrasNeeded && availableChakras.length > 0;
            i++
          ) {
            const randomIndex = Math.floor(
              Math.random() * availableChakras.length
            );
            const selectedChakra = availableChakras[randomIndex];
            // Remove from available to avoid selecting the same twice
            availableChakras.splice(randomIndex, 1);
            // Consume the selected chakra
            this.player2.consumeChakra(selectedChakra);
          }
        }
      });

      // Replace action queue with AI actions and execute
      this.actionQueue = aiActions;
      this.executeTurn();
    }

    // Always move to next turn (back to player1)
    this.nextTurn(this.player1);
  }

  processCooldowns() {
    [this.player1, this.player2].forEach((player) => {
      player.processCooldowns(this);
    });
    this.notifyStateChange();
  }

  checkGameOver(): boolean {
    return this.player1.isDefeated() || this.player2.isDefeated();
  }

  getActionHistory(): string[] {
    return this.actionHistory;
  }
}
