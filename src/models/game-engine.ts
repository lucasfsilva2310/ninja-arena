import { Ability } from "./ability.model";
import { Character } from "./character.model";
import { ChakraType, chakraTypes } from "./chakra.model";
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

  // Observer pattern for state changes on React components
  subscribe(listener: () => void): () => void {
    this.stateListeners.push(listener);
    return () => {
      this.stateListeners = this.stateListeners.filter((l) => l !== listener);
    };
  }

  // Observer pattern for state changes on React components
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
          // Consume ALL required chakras, both specific and random
          const specificChakraActions =
            action.attackerAbility.requiredChakra.filter(
              (chakra) => chakra !== chakraTypes.Random
            );

          // Consume specific chakras
          specificChakraActions.forEach((chakra) => {
            action.attackerPlayer.consumeChakra(chakra);
          });

          // For random chakras, we need to find available chakras to consume
          const randomChakraCount =
            action.attackerAbility.requiredChakra.filter(
              (chakra) => chakra === chakraTypes.Random
            ).length;

          // If we have random chakra requirements, consume them from what's available
          if (randomChakraCount > 0 && action.attackerPlayer === this.player2) {
            // For AI, automatically select random chakras to consume
            const availableChakras = [...action.attackerPlayer.chakras];

            // Remove the specific chakras we just consumed
            specificChakraActions.forEach((chakra) => {
              const index = availableChakras.indexOf(chakra);
              if (index !== -1) {
                availableChakras.splice(index, 1);
              }
            });

            // Now consume random chakras
            for (let i = 0; i < randomChakraCount; i++) {
              if (availableChakras.length > 0) {
                const randomIndex = Math.floor(
                  Math.random() * availableChakras.length
                );
                const chakraToConsume = availableChakras[randomIndex];
                action.attackerPlayer.consumeChakra(chakraToConsume);
                availableChakras.splice(randomIndex, 1);
              }
            }
          }
          // Note: For player1, random chakras are handled by replaceRandomChakras method

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

  // Method to handle Random chakra replacements
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

  // Completely revised AI action generation with proper chakra tracking
  generateAIActions(): SelectedAction[] {
    const aiActions: SelectedAction[] = [];

    // Create a copy of available chakras to track consumption
    let availableChakras = [...this.player2.chakras];

    // Keep track of characters that have already acted
    const actedCharacters: Character[] = [];

    // Keep trying to find actions until no more can be added
    let actionAdded = true;

    while (actionAdded) {
      actionAdded = false;

      // Try each character that hasn't acted yet
      for (const char of this.player2.characters) {
        // Skip characters that are dead or already acted
        if (!char.isAlive() || actedCharacters.includes(char)) {
          continue;
        }

        // Filter abilities that can be used with current chakra
        const availableAbilities = char.abilities.filter((ability) => {
          // Skip defensive/invulnerability abilities for AI to make game more challenging
          if (
            ability.effects.find(
              (effect) => effect.damageReduction?.amount === Infinity
            )
          ) {
            return false;
          }

          // Check if we have the required chakras (both specific and enough for random)
          const requiredChakras = [...ability.requiredChakra];
          const tempChakras = [...availableChakras];

          // First check specific chakras
          for (const chakra of requiredChakras.filter((c) => c !== "Random")) {
            const index = tempChakras.indexOf(chakra);
            if (index === -1) return false;
            tempChakras.splice(index, 1);
          }

          // Then check if we have enough remaining chakras for random requirements
          const randomCount = requiredChakras.filter(
            (c) => c === "Random"
          ).length;
          return tempChakras.length >= randomCount;
        });

        // If there are available abilities, choose one at random
        if (availableAbilities.length > 0) {
          const randomAbility =
            availableAbilities[
              Math.floor(Math.random() * availableAbilities.length)
            ];

          // Find valid targets for this ability
          let targets: Character[] = [];
          switch (randomAbility.target) {
            case "Enemy":
              targets = this.player1.characters.filter(
                (c) => c.isAlive() && !c.isInvulnerable()
              );
              break;
            case "AllEnemies":
              targets = this.player1.characters.filter(
                (c) => c.isAlive() && !c.isInvulnerable()
              );
              break;
            case "Ally":
              targets = this.player2.characters.filter((c) => c.isAlive());
              break;
            case "AllAllies":
              targets = this.player2.characters.filter((c) => c.isAlive());
              break;
            case "Self":
              targets = [char];
              break;
          }

          // If there are valid targets, create and add an action
          if (targets.length > 0) {
            const target = targets[Math.floor(Math.random() * targets.length)];

            // Create the action
            const action: SelectedAction = {
              attackerPlayer: this.player2,
              attackerCharacter: char,
              attackerAbility: randomAbility,
              targetCharacter: target,
              targetPlayer: this.player1,
            };

            // Add the action
            aiActions.push(action);
            actedCharacters.push(char);

            // IMPORTANT: Now immediately consume the required chakras
            // First consume specific chakras
            randomAbility.requiredChakra
              .filter((chakra) => chakra !== "Random")
              .forEach((chakra) => {
                const index = availableChakras.indexOf(chakra);
                if (index !== -1) {
                  availableChakras.splice(index, 1);
                }
              });

            // Then consume chakras for random requirements
            const randomChakraCount = randomAbility.requiredChakra.filter(
              (chakra) => chakra === "Random"
            ).length;

            for (let i = 0; i < randomChakraCount; i++) {
              if (availableChakras.length > 0) {
                // Take a random chakra from the available pool
                const randomIndex = Math.floor(
                  Math.random() * availableChakras.length
                );
                // This chakra will be used for the "Random" requirement
                availableChakras.splice(randomIndex, 1);
              }
            }

            // We successfully added an action this iteration
            actionAdded = true;

            // Break out of the character loop since we added an action
            break;
          }
        }
      }
    }

    return aiActions;
  }

  // Updated AI turn execution - chakra consumption is now handled during generation
  executeAITurn() {
    const aiActions = this.generateAIActions();

    if (aiActions.length === 0) {
      this.addToHistory(`${this.player2.name} took no action this turn.`);
    } else {
      // Log the actions that will be performed
      this.addToHistory(
        `${this.player2.name} is performing ${aiActions.length} actions.`
      );

      // Process random chakra requirements - this is now handled during generation
      // so we don't need to do it here again

      // Set the action queue and execute turn
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
