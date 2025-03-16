import "./Battle.css";
import "./BattleFooter.css";

import React, { useState, useEffect } from "react";
import { GameEngine, SelectedAction } from "../../models/game-engine";
import { Ability } from "../../models/ability.model";
import { Character } from "../../models/character.model";
import { ChakraType } from "../../models/chakra.model";
import { Player } from "../../models/player.model";
import ExchangeRandomChakraFinalTurnModal from "./Modals/ExchangeRandomChakraFinalTurn/ExchangeRandomChakraFinalTurnModal";
import ChakraTransformModal from "./Modals/ChakraTransform/ChakraTransformModal";
import SurrenderConfirmationModal from "./Modals/SurrenderConfirmation/SurrenderConfirmationModal";
import BattleHistoryModal from "./Modals/BattleHistory/BattleHistoryModal";

import AbilityFooter from "../components/AbilityDescriptionFooter/AbilityDescriptionFooter";
import { AvailableChakra } from "./AvailableChakra/AvailableChakra";
import { PlayerBoard } from "./PlayerBoards/PlayerBoard";
import { PlayerInfo } from "./PlayerInfo/PlayerInfo";
import BattleOptions from "./BattleOptions/BattleOptions";
import { TurnTimer } from "./TurnTimer/TurnTimer";
import { SpritesBoard } from "./Sprites/SpritesBoard";
import { getCharacterDefaultAvatar } from "../../utils/getCharacterDefaultAvatar";

interface BattleProps {
  game: GameEngine;
  onGameOver: (winner: string) => void;
}

export default function Battle({ game, onGameOver }: BattleProps) {
  // State for UI interaction
  const [selectedActions, setSelectedActions] = useState<SelectedAction[]>([]);
  const [abilityTargetCharacter, setAbilityTargetCharacter] =
    useState<Character | null>(null);
  const [
    selectedCharacterForAbilitiesPreview,
    setSelectedCharacterForAbilitiesPreview,
  ] = useState<Character | null>(null);
  const [selectedAbility, setSelectedAbility] = useState<Ability | null>(null);
  const [
    possibleTargetsForSelectedAbility,
    setPossibleTargetsForSelectedAbility,
  ] = useState<Character[]>([]);
  const [showChakraTransformModal, setChakraTransformModal] = useState(false);
  const [randomChakraCountAtEndTurn, setRandomChakraCountAtEndTurn] =
    useState(0);
  const [choosenChakrasToUseAsRandom, setChoosenChakrasToUseAsRandom] =
    useState<ChakraType[]>([]);
  const [selectedChakras, setSelectedChakras] = useState<ChakraType[]>([]);
  const [background, _] = useState<string>("/backgrounds/battle/waterfall.png");
  const [mainPlayerActiveChakras, setMainPlayerActiveChakras] = useState<
    ChakraType[]
  >([]);

  // Animation control states
  const [isExecutingTurn, setIsExecutingTurn] = useState(false);
  const [currentActionIndex, setCurrentActionIndex] = useState(0);
  const [actionCompleted, setActionCompleted] = useState(false);
  const [allActionsCompleted, setAllActionsCompleted] = useState(false);

  // State for game state mirroring
  const [isPlayerTurn, setIsPlayerTurn] = useState(
    game.currentPlayer === game.player1
  );
  const [turnCount, setTurnCount] = useState(game.turn);
  const [gameStateVersion, setGameStateVersion] = useState(0);

  // State for modals
  const [showSurrenderModal, setShowSurrenderModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showExchangeRandomFinalModal, setShowExchangeRandomFinalModal] =
    useState(false);

  // Subscribe to game state changes
  useEffect(() => {
    const unsubscribe = game.subscribe(() => {
      setGameStateVersion((prev) => prev + 1);
      setIsPlayerTurn(game.currentPlayer === game.player1);
      setTurnCount(game.turn);
      // Sync with game engine's action queue
      setSelectedActions(game.getActionQueue());
    });

    return unsubscribe;
  }, [game]);

  // Calculate remaining chakras ONLY for ability availability checks
  const getChakrasForAbilityAvailability = (): ChakraType[] => {
    // Start with all player chakras
    const allChakras = [...game.player1.chakras];

    // Create a map to count chakras by type
    const chakraCounts: Record<string, number> = {};

    // Count each chakra type
    allChakras.forEach((chakra) => {
      chakraCounts[chakra] = (chakraCounts[chakra] || 0) + 1;
    });

    // Track specific chakras used by selected actions
    selectedActions.forEach((action) => {
      const requiredChakras = action.attackerAbility.requiredChakra;

      // Subtract specific chakras first
      requiredChakras.forEach((chakra) => {
        if (chakra !== "Random") {
          chakraCounts[chakra] = (chakraCounts[chakra] || 0) - 1;
        }
      });
    });

    // Calculate how many random chakras are needed
    const totalRandomNeeded = selectedActions.reduce(
      (count, action) =>
        count +
        action.attackerAbility.requiredChakra.filter((c) => c === "Random")
          .length,
      0
    );

    // Calculate total remaining chakras
    let totalRemainingChakras = 0;
    const remainingChakras: ChakraType[] = [];

    // Add remaining chakras to the array
    Object.entries(chakraCounts).forEach(([chakra, count]) => {
      for (let i = 0; i < count; i++) {
        if (count > 0) {
          remainingChakras.push(chakra as ChakraType);
          totalRemainingChakras++;
        }
      }
    });

    // If total random needed is greater than 0, we need to reserve chakras for those random requirements
    if (totalRandomNeeded > 0) {
      // Remove chakras that would be used for random requirements
      remainingChakras.splice(
        0,
        Math.min(totalRandomNeeded, remainingChakras.length)
      );
    }

    return remainingChakras;
  };

  // Calculate ALL active chakras available to the player (for UI display and modal)
  const getAllAvailableChakras = (): ChakraType[] => {
    // Start with all player chakras
    const allChakras = [...game.player1.chakras];

    // Create a map to count chakras by type
    const chakraCounts: Record<string, number> = {};

    // Count each chakra type
    allChakras.forEach((chakra) => {
      chakraCounts[chakra] = (chakraCounts[chakra] || 0) + 1;
    });

    // Track specific chakras used by selected actions
    selectedActions.forEach((action) => {
      const requiredChakras = action.attackerAbility.requiredChakra;

      // Subtract ONLY specific chakras (not Random)
      requiredChakras.forEach((chakra) => {
        if (chakra !== "Random") {
          chakraCounts[chakra] = (chakraCounts[chakra] || 0) - 1;
        }
      });
    });

    // Calculate available chakras
    const availableChakras: ChakraType[] = [];

    // Add remaining chakras to the array
    Object.entries(chakraCounts).forEach(([chakra, count]) => {
      for (let i = 0; i < count; i++) {
        if (count > 0) {
          availableChakras.push(chakra as ChakraType);
        }
      }
    });

    return availableChakras;
  };

  // Helper to check if a character can use an ability based on available chakras
  const hasEnoughChakrasForAbility = (ability: Ability): boolean => {
    // Get the chakras remaining after accounting for already selected actions
    const remainingChakras = getChakrasForAbilityAvailability();
    const requiredChakras = [...ability.requiredChakra];

    // Count how many specific and random chakras are needed for this ability
    const specificChakras = requiredChakras.filter((c) => c !== "Random");
    const randomChakraCount = requiredChakras.filter(
      (c) => c === "Random"
    ).length;

    // Create a copy of remaining chakras to work with
    const availableChakras = [...remainingChakras];

    // Check if specific chakras are available
    for (const chakra of specificChakras) {
      const index = availableChakras.indexOf(chakra);
      if (index === -1) return false;
      availableChakras.splice(index, 1);
    }

    // Check if there are enough remaining chakras for the random requirements
    return availableChakras.length >= randomChakraCount;
  };

  // Calculate active chakras
  useEffect(() => {
    // Update mainPlayerActiveChakras to show ALL available chakras (not accounting for Random reservations)
    const availableChakras = getAllAvailableChakras();
    setMainPlayerActiveChakras(availableChakras);
  }, [game.player1.chakras, selectedActions, gameStateVersion]);

  // Sync selectedChakras with actual chakra usage for UI elements that depend on it
  useEffect(() => {
    // Calculate all used chakras (specific only, not reserving for Random)
    const allUsedChakras: ChakraType[] = [];

    // Add all specific chakras
    selectedActions.forEach((action) => {
      action.attackerAbility.requiredChakra.forEach((chakra) => {
        if (chakra !== "Random") {
          allUsedChakras.push(chakra);
        }
      });
    });

    // Set the selected chakras (used for UI display only)
    setSelectedChakras(allUsedChakras);
  }, [selectedActions]);

  // Handle animation completion
  useEffect(() => {
    if (actionCompleted) {
      // Reset the flag
      setActionCompleted(false);

      // Check if there are more actions
      if (currentActionIndex < selectedActions.length - 1) {
        // Move to the next action
        setCurrentActionIndex((prev) => prev + 1);
      }
    }
  }, [actionCompleted, currentActionIndex, selectedActions]);

  // Handle all actions completed
  useEffect(() => {
    if (allActionsCompleted) {
      // Reset the flag
      setAllActionsCompleted(false);

      // Continue with turn finalization
      finalizeTurnAfterAnimations();
    }
  }, [allActionsCompleted]);

  // Utility functions
  const clearStates = () => {
    setAbilityTargetCharacter(null);
    setSelectedAbility(null);
    // Clear game engine's action queue
    game.clearActionQueue();
    setPossibleTargetsForSelectedAbility([]);
    setChoosenChakrasToUseAsRandom([]);

    setShowExchangeRandomFinalModal(false);
    setSelectedCharacterForAbilitiesPreview(null);
    setRandomChakraCountAtEndTurn(0);
    setCurrentActionIndex(0);
    setActionCompleted(false);
    setAllActionsCompleted(false);
  };

  const clearActionStates = () => {
    setSelectedAbility(null);
    // Clear game engine's action queue
    game.clearActionQueue();
    setPossibleTargetsForSelectedAbility([]);
  };

  // Function to get all usable abilities for a character
  const getUsableAbilities = (character: Character): Ability[] => {
    return character.abilities.filter((ability) =>
      hasEnoughChakrasForAbility(ability)
    );
  };

  // Handle user interactions
  const handleAbilityClick = (character: Character, ability: Ability) => {
    if (selectedAbility === ability && abilityTargetCharacter === character) {
      clearActionStates();
      return;
    }

    setSelectedCharacterForAbilitiesPreview(character);
    setAbilityTargetCharacter(character);
    setSelectedAbility(ability);

    let targets: Character[] = [];
    switch (ability.target) {
      case "Enemy":
        targets = game.player2.characters.filter(
          (char) => char.isAlive() && !char.isInvulnerable()
        );
        break;
      case "AllEnemies":
        targets = game.player2.characters.filter(
          (char) => char.isAlive() && !char.isInvulnerable()
        );
        break;
      case "Ally":
        targets = game.player1.characters.filter((char) => char.isAlive());
        break;
      case "AllAllies":
        targets = game.player1.characters.filter((char) => char.isAlive());
        break;
      case "Self":
        targets = [character];
        break;
    }

    setPossibleTargetsForSelectedAbility([...targets]);
  };

  const handleTargetClick = (player: Player, target: Character) => {
    setSelectedCharacterForAbilitiesPreview(target);

    if (!possibleTargetsForSelectedAbility.includes(target)) {
      setSelectedAbility(null);
      return;
    }

    if (selectedAbility) {
      // Decide attacker from isPlayerTurn
      const attackerPlayer = isPlayerTurn ? game.player1 : game.player2;

      // Target is decided by the function argument
      game.addSelectedAction({
        attackerPlayer: attackerPlayer || player,
        attackerCharacter: abilityTargetCharacter || target,
        attackerAbility: selectedAbility,
        targetCharacter: target,
        targetPlayer: player,
      });

      setSelectedChakras((prevChakras) => [
        ...prevChakras,
        ...selectedAbility.requiredChakra,
      ]);

      setSelectedAbility(null);
      setPossibleTargetsForSelectedAbility([]);
    }
  };

  const removeSelectedAction = (index: number) => {
    // Remove action from game engine's queue
    game.removeSelectedAction(index);

    // Update selected chakras
    const actionToRemove = selectedActions[index];
    if (actionToRemove) {
      setSelectedChakras((prevChakras) => {
        const updatedChakras = [...prevChakras];
        let startIndex = 0;
        for (let i = 0; i < index; i++) {
          startIndex +=
            selectedActions[i].attackerAbility.requiredChakra.length;
        }
        const endIndex =
          startIndex + actionToRemove.attackerAbility.requiredChakra.length;
        updatedChakras.splice(startIndex, endIndex - startIndex);
        return updatedChakras;
      });
    }
  };

  // Handle action animation completion
  const handleActionAnimationComplete = (actionIndex: number) => {
    console.log(
      `Action animation ${actionIndex} complete, executing action effect`
    );

    // Execute the action in the game engine
    game.executeAction(actionIndex);

    // Set the action as completed
    setActionCompleted(true);
  };

  // Handle all animations completed
  const handleAllAnimationsComplete = () => {
    console.log("All action animations completed");
    setAllActionsCompleted(true);
  };

  // Handle when timer ends
  const handleTimeEnd = () => {
    // If there are any actions with Random chakra requirements, remove them
    if (selectedActions.length > 0) {
      // Filter out actions that need Random chakra
      const filteredActions = selectedActions.filter(
        (action) => !action.attackerAbility.requiredChakra.includes("Random")
      );

      // If we actually removed some actions, we need to update the game state
      if (filteredActions.length !== selectedActions.length) {
        console.log(
          `Timer ended - Removed ${
            selectedActions.length - filteredActions.length
          } actions requiring Random chakra`
        );

        // Update the game's action queue with only specific chakra actions
        game.clearActionQueue();
        filteredActions.forEach((action) => game.addSelectedAction(action));

        // Update selected chakras to match the filtered actions
        const updatedChakras: ChakraType[] = [];
        filteredActions.forEach((action) => {
          action.attackerAbility.requiredChakra.forEach((chakra) => {
            if (chakra !== "Random") {
              updatedChakras.push(chakra);
            }
          });
        });

        // Directly set the selected chakras to the updated list
        setSelectedChakras(updatedChakras);
      }

      // If there are no actions left after filtering, just end the turn
      if (filteredActions.length === 0) {
        console.log(
          "No valid actions remain after removing Random chakra requirements"
        );

        // End execution state - no animations needed
        setIsExecutingTurn(false);

        // Clear all states
        clearStates();

        // Change to AI's turn
        game.nextTurn(game.player2);

        // Check for game over
        if (game.checkGameOver()) {
          onGameOver(game.player1.isDefeated() ? "IA venceu!" : "Você venceu!");
          return;
        }

        // Execute AI turn after a delay
        executeAITurn();
        return;
      }

      // Execute turn with remaining actions, bypassing the Random chakra check
      startTimerExpiredTurnExecution();
    } else {
      // No actions, just end the turn
      executeTurn();
    }
  };

  // Special execution for timer expiration - bypasses the Random chakra modal
  const startTimerExpiredTurnExecution = () => {
    // Reset action index and start executing animations immediately
    // No need to check for Random chakra since we've already filtered those actions
    setCurrentActionIndex(0);
    setIsExecutingTurn(true);
  };

  const executeTurn = () => {
    // If no actions were selected, just end the turn
    if (selectedActions.length === 0) {
      console.log("No actions selected, ending turn directly");

      // End execution state - no animations needed
      setIsExecutingTurn(false);

      // Clear all states
      clearStates();

      // Change to AI's turn
      game.nextTurn(game.player2);

      // Check for game over in case player's inaction led to defeat
      if (game.checkGameOver()) {
        onGameOver(game.player1.isDefeated() ? "IA venceu!" : "Você venceu!");
        return;
      }

      // Execute AI turn after a delay
      executeAITurn();
      return;
    }

    // Continue with normal execution if there are actions
    const totalRandoms = selectedActions.reduce(
      (count, action) =>
        count +
        action.attackerAbility.requiredChakra.filter((c) => c === "Random")
          .length,
      0
    );

    if (totalRandoms > 0) {
      setRandomChakraCountAtEndTurn(totalRandoms);
      setShowExchangeRandomFinalModal(true);
      return;
    }

    startTurnExecution();
  };

  // Start the turn execution process
  const startTurnExecution = () => {
    // Handle random chakra replacements if needed
    if (choosenChakrasToUseAsRandom.length > 0) {
      game.replaceRandomChakras(
        game.player1,
        selectedActions.filter((action) =>
          action.attackerAbility.requiredChakra.includes("Random")
        ),
        choosenChakrasToUseAsRandom
      );
    }

    // Reset action index and start executing animations
    setCurrentActionIndex(0);
    setIsExecutingTurn(true);
  };

  // Finalize turn after all animations are complete
  const finalizeTurnAfterAnimations = async () => {
    console.log("Finalizing turn after all animations");

    // Wait for a moment to let animations settle
    await new Promise((resolve) => setTimeout(resolve, 500));

    // End execution state
    setIsExecutingTurn(false);

    // Check for game over after all animations have completed
    if (game.checkGameOver()) {
      onGameOver(game.player1.isDefeated() ? "IA venceu!" : "Você venceu!");
      return; // Don't proceed with turn transition if game is over
    }

    // Check whose turn it was and proceed accordingly
    const isNotAI = game.currentPlayer === game.player1;
    if (isNotAI) {
      // It was player 1's turn, now switch to AI
      // Clear all states
      clearStates();

      // Change to AI's turn
      game.nextTurn(game.player2);

      // Execute AI turn after a delay
      await executeAITurn();
    } else {
      // It was AI's turn, now switch to player 1
      // Clear all states
      clearStates();

      // Change to player 1's turn
      game.nextTurn(game.player1);
    }
  };

  const finalizeTurn = () => {
    // This is now just a wrapper around startTurnExecution
    // Kept for compatibility with existing code
    startTurnExecution();
  };

  const executeAITurn = async () => {
    console.log("Executing AI turn");

    // Generate AI actions
    const aiActions = game.generateAIActions();
    console.log(`AI generated ${aiActions.length} actions`);

    // If AI has no actions, just end its turn
    if (aiActions.length === 0) {
      console.log("AI has no actions, ending turn");

      // Add a message to history
      game.addToHistory(`${game.player2.name} took no action this turn.`);

      // Check for game over in case AI won with no actions
      if (game.checkGameOver()) {
        onGameOver(game.player1.isDefeated() ? "IA venceu!" : "Você venceu!");
        return;
      }

      // Move to player's turn
      game.nextTurn(game.player1);
      return;
    }

    // Set AI actions in the game engine
    aiActions.forEach((action) => {
      game.addSelectedAction(action);
    });

    // Reset animation-related state
    setCurrentActionIndex(0);
    setActionCompleted(false);
    setAllActionsCompleted(false);

    // Important: Set a small delay to ensure React state updates
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Start executing AI turn
    setIsExecutingTurn(true);

    // We'll wait for the allActionsCompleted effect to handle the rest
    // This is triggered by SpritesBoard component through handleAllAnimationsComplete
  };

  const handleTransformChakras = (
    chakrasToTransform: ChakraType[],
    targetChakra: ChakraType
  ) => {
    game.transformChakras(game.player1, chakrasToTransform, targetChakra);
  };

  const handleSurrender = () => {
    setShowSurrenderModal(true);
  };

  const confirmSurrender = () => {
    setShowSurrenderModal(false);
    onGameOver("Você desistiu! IA venceu!");
  };

  const cancelSurrender = () => {
    setShowSurrenderModal(false);
  };

  const handleShowHistory = () => {
    setShowHistoryModal(true);
  };

  const handleCloseExchangeRandomFinalModal = () => {
    setChoosenChakrasToUseAsRandom([]);
    setShowExchangeRandomFinalModal(false);
  };

  const handleCloseChakraTransformModal = () => {
    setChakraTransformModal(false);
  };

  return (
    <>
      {showExchangeRandomFinalModal && (
        <ExchangeRandomChakraFinalTurnModal
          availableChakras={mainPlayerActiveChakras}
          requiredRandomCount={randomChakraCountAtEndTurn}
          chakrasToSwitchFromRandom={choosenChakrasToUseAsRandom}
          setChakrasToSwitchFromRandom={setChoosenChakrasToUseAsRandom}
          onConfirm={finalizeTurn}
          onClose={handleCloseExchangeRandomFinalModal}
        />
      )}
      {showChakraTransformModal && (
        <ChakraTransformModal
          availableChakras={mainPlayerActiveChakras}
          onClose={handleCloseChakraTransformModal}
          onTransform={handleTransformChakras}
        />
      )}
      {showSurrenderModal && (
        <SurrenderConfirmationModal
          onConfirm={confirmSurrender}
          onCancel={cancelSurrender}
        />
      )}
      {showHistoryModal && (
        <BattleHistoryModal
          history={game.getActionHistory()}
          onClose={() => setShowHistoryModal(false)}
        />
      )}
      <div
        className="battle-container"
        style={{
          backgroundImage: `url(${background})`,
          backgroundSize: "100% 100%",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="app-container">
          <div className="header-section">
            <PlayerInfo
              name="Player 1"
              rank="Chunin"
              avatar={getCharacterDefaultAvatar()}
            />

            <div className="header-center">
              <TurnTimer
                isPlayerTurn={isPlayerTurn}
                onTimeEnd={handleTimeEnd}
                turnCount={turnCount}
              />
            </div>

            <PlayerInfo
              name="Player 2"
              rank="Jonin"
              avatar={getCharacterDefaultAvatar()}
              isEnemy
            />
          </div>

          <div className="battle-section">
            <div className="board-section">
              <PlayerBoard
                game={game}
                handleTargetClick={handleTargetClick}
                possibleTargets={possibleTargetsForSelectedAbility}
                selectedActions={selectedActions}
                removeSelectedAction={removeSelectedAction}
                handleAbilityClick={handleAbilityClick}
                playerActiveChakras={mainPlayerActiveChakras}
                isEnemy={false}
                isPlayerTurn={isPlayerTurn}
                getUsableAbilities={getUsableAbilities}
              />
            </div>

            <div className="center-column">
              <AvailableChakra
                activeChakras={mainPlayerActiveChakras}
                setChakraTransformModal={setChakraTransformModal}
              />
              <button
                onClick={executeTurn}
                className="end-turn-button"
                disabled={!isPlayerTurn}
              >
                End Turn
              </button>
              <SpritesBoard
                game={game}
                selectedActions={selectedActions}
                isExecutingTurn={isExecutingTurn}
                onActionAnimationComplete={handleActionAnimationComplete}
                onAllAnimationsComplete={handleAllAnimationsComplete}
                currentActionIndex={currentActionIndex}
              />
            </div>

            <div className="board-section enemy">
              <PlayerBoard
                game={game}
                handleTargetClick={handleTargetClick}
                possibleTargets={possibleTargetsForSelectedAbility}
                selectedActions={selectedActions}
                removeSelectedAction={removeSelectedAction}
                isEnemy={true}
                isPlayerTurn={isPlayerTurn}
                getUsableAbilities={getUsableAbilities}
              />
            </div>
          </div>

          <div className="battle-footer">
            <BattleOptions
              onSurrender={handleSurrender}
              onHistory={handleShowHistory}
              onExample={() => {
                /* implement later */
              }}
            />
            <AbilityFooter
              selectedCharacter={selectedCharacterForAbilitiesPreview}
              currentSelectedAbility={selectedAbility}
              context="battle"
            />
          </div>
        </div>
      </div>
    </>
  );
}
