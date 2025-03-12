import "./Battle.css";
import "./BattleFooter/BattleFooter.css";

import React, { useState, useEffect } from "react";
import { GameEngine, SelectedAction } from "../../models/game-engine";
import { Ability } from "../../models/ability.model";
import { Character } from "../../models/character.model";
import { ChakraType } from "../../models/chakra.model";
import { Player } from "../../models/player.model";
import ExchangeRandomChakraFinalModal from "./Modals/ExchangeRandomChakra/ExchangeRandomChakraFinalModal";
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
  const [background, setBackground] = useState<string>(
    "/backgrounds/battle/waterfall.png"
  );
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

  // Check if game is over
  useEffect(() => {
    if (game.checkGameOver()) {
      onGameOver(game.player1.isDefeated() ? "IA venceu!" : "Você venceu!");
    }
  }, [onGameOver, game, gameStateVersion]);

  // Calculate active chakras
  useEffect(() => {
    const chakras: ChakraType[] = [];
    const allChakras = [...game.player1.chakras];

    // Count each chakra type
    const chakraCounts: Record<string, number> = {};

    allChakras.forEach((chakra) => {
      chakraCounts[chakra] = (chakraCounts[chakra] || 0) + 1;
    });

    // Subtract selected chakras
    selectedChakras.forEach((chakra) => {
      chakraCounts[chakra] = (chakraCounts[chakra] || 0) - 1;
    });

    // Convert counts back to array
    Object.entries(chakraCounts).forEach(([chakra, count]) => {
      for (let i = 0; i < count; i++) {
        if (count > 0) {
          chakras.push(chakra as ChakraType);
        }
      }
    });

    setMainPlayerActiveChakras(chakras);
  }, [game.player1.chakras, selectedChakras, gameStateVersion]);

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
    setSelectedChakras([]);
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

  // Helper to check if a character can use an ability based on available chakras
  const hasEnoughChakrasForAbility = (ability: Ability): boolean => {
    const availableChakras = [...mainPlayerActiveChakras];
    const requiredChakras = [...ability.requiredChakra];

    // Count how many specific and random chakras are needed
    const specificChakras = requiredChakras.filter((c) => c !== "Random");
    const randomChakraCount = requiredChakras.filter(
      (c) => c === "Random"
    ).length;

    // Check if specific chakras are available
    for (const chakra of specificChakras) {
      const index = availableChakras.indexOf(chakra);
      if (index === -1) return false;
      availableChakras.splice(index, 1);
    }

    // Check if there are enough remaining chakras for the random requirements
    return availableChakras.length >= randomChakraCount;
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
    // Even if no actions were selected, still execute the turn
    executeTurn();
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

    // Clear all states
    clearStates();

    // Change to AI's turn
    game.nextTurn(game.player2);

    // Execute AI turn after a delay
    await executeAITurn();
  };

  const finalizeTurn = () => {
    // This is now just a wrapper around startTurnExecution
    // Kept for compatibility with existing code
    startTurnExecution();
  };

  const executeAITurn = async () => {
    // Set AI turn animation and wait
    const aiActions = game.generateAIActions();

    // Set AI actions in the game engine
    aiActions.forEach((action) => {
      game.addSelectedAction(action);
    });

    // Start executing AI turn
    setIsExecutingTurn(true);
    setCurrentActionIndex(0);

    // Animation and action execution will be handled by the SpritesBoard component
    // and the useEffect hooks monitoring actionCompleted and allActionsCompleted
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

  return (
    <>
      {showExchangeRandomFinalModal && (
        <ExchangeRandomChakraFinalModal
          availableChakras={mainPlayerActiveChakras}
          requiredRandomCount={randomChakraCountAtEndTurn}
          chakrasToSwitchFromRandom={choosenChakrasToUseAsRandom}
          setChakrasToSwitchFromRandom={setChoosenChakrasToUseAsRandom}
          onConfirm={finalizeTurn}
          onClose={() => setShowExchangeRandomFinalModal(false)}
        />
      )}
      {showChakraTransformModal && (
        <ChakraTransformModal
          availableChakras={mainPlayerActiveChakras}
          onClose={() => setChakraTransformModal(false)}
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
              avatar="/characters/default.png"
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
              avatar="/characters/default.png"
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
                selectedChakras={selectedChakras}
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
                showDebug={false}
                onActionAnimationComplete={handleActionAnimationComplete}
                onAllAnimationsComplete={handleAllAnimationsComplete}
                currentActionIndex={currentActionIndex}
              />
            </div>

            <div className="board-section">
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
