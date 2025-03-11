import "./Battle.css";
import "./BattleFooter/BattleFooter.css";

import React, { useState, useEffect } from "react";
import { GameEngine } from "../../models/game-engine";
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

export interface SelectedAction {
  player: Player;
  character: Character;
  ability: Ability;
  target: Character;
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
    "/backgrounds/battle/default.png"
  );
  const [mainPlayerActiveChakras, setMainPlayerActiveChakras] = useState<
    ChakraType[]
  >([]);
  const [isExecutingTurn, setIsExecutingTurn] = useState(false);

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

  // Background setup
  useEffect(() => {
    const backgrounds = ["waterfall.png"];
    const randomBackground =
      backgrounds[Math.floor(Math.random() * backgrounds.length)];
    setBackground(`/backgrounds/battle/${randomBackground}`);
  }, []);

  // Utility functions
  const clearStates = () => {
    setAbilityTargetCharacter(null);
    setSelectedAbility(null);
    setSelectedActions([]);
    setPossibleTargetsForSelectedAbility([]);
    setChoosenChakrasToUseAsRandom([]);
    setSelectedChakras([]);
    setShowExchangeRandomFinalModal(false);
    setSelectedCharacterForAbilitiesPreview(null);
    setRandomChakraCountAtEndTurn(0);
  };

  const clearActionStates = () => {
    setSelectedAbility(null);
    setSelectedActions([]);
    setPossibleTargetsForSelectedAbility([]);
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
    setSelectedAbility(null);

    if (!possibleTargetsForSelectedAbility.includes(target)) {
      return;
    }

    if (selectedAbility) {
      setSelectedActions([
        ...selectedActions,
        {
          player,
          character: abilityTargetCharacter || target,
          ability: selectedAbility,
          target,
        },
      ]);

      setSelectedChakras((prevChakras) => [
        ...prevChakras,
        ...selectedAbility.requiredChakra,
      ]);

      setSelectedAbility(null);
      setPossibleTargetsForSelectedAbility([]);
    }
  };

  const removeSelectedAction = (index: number) => {
    setSelectedActions((prevActions) => {
      const updatedActions = [...prevActions];
      const removedAction = updatedActions.splice(index, 1)[0];

      setSelectedChakras((prevChakras) => {
        const updatedChakras = [...prevChakras];
        let startIndex = 0;
        for (let i = 0; i < index; i++) {
          startIndex += prevActions[i].ability.requiredChakra.length;
        }
        const endIndex =
          startIndex + removedAction.ability.requiredChakra.length;
        updatedChakras.splice(startIndex, endIndex - startIndex);
        return updatedChakras;
      });

      return updatedActions;
    });
  };

  // Handle when timer ends
  const handleTimeEnd = () => {
    // Even if no actions were selected, still execute the turn
    executeTurn();
  };

  const executeTurn = () => {
    const totalRandoms = selectedActions.reduce(
      (count, action) =>
        count +
        action.ability.requiredChakra.filter((c) => c === "Random").length,
      0
    );

    if (totalRandoms > 0) {
      setRandomChakraCountAtEndTurn(totalRandoms);
      setShowExchangeRandomFinalModal(true);
      return;
    }

    finalizeTurn();
  };

  const finalizeTurn = async () => {
    // Set executing turn state to show animations
    setIsExecutingTurn(true);

    // Handle random chakra replacements if needed
    if (choosenChakrasToUseAsRandom.length > 0) {
      game.replaceRandomChakras(
        game.player1,
        selectedActions.filter((action) =>
          action.ability.requiredChakra.includes("Random")
        ),
        choosenChakrasToUseAsRandom
      );
    }

    // Execute player actions (even if empty)
    game.executeTurn(selectedActions);

    // Wait for animations
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setIsExecutingTurn(false);

    // Clear UI states
    clearStates();

    // Change to AI's turn
    game.nextTurn(game.player2);

    // Execute AI turn after a delay
    await executeAITurn();
  };

  const executeAITurn = async () => {
    // Set AI turn animation and wait
    setIsExecutingTurn(true);

    try {
      // Execute AI actions
      await new Promise((resolve) => setTimeout(resolve, 3000));
      game.executeAITurn();
    } catch (error) {
      console.error("Error during AI turn:", error);
    } finally {
      // Always end the animation and update state
      setIsExecutingTurn(false);
    }
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
