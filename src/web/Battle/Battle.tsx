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
  // State responsible for tracking selected actions
  const [selectedActions, setSelectedActions] = useState<SelectedAction[]>([]);

  // State responsible for tracking target character
  const [abilityTargetCharacter, setAbilityTargetCharacter] =
    useState<Character | null>(null);

  // State responsible for tracking selected character for abilities preview
  const [
    selectedCharacterForAbilitiesPreview,
    setSelectedCharacterForAbilitiesPreview,
  ] = useState<Character | null>(null);

  // State responsible for tracking selected ability
  const [selectedAbility, setSelectedAbility] = useState<Ability | null>(null);

  // State responsible for tracking possible targets
  const [
    possibleTargetsForSelectedAbility,
    setPossibleTargetsForSelectedAbility,
  ] = useState<Character[]>([]);

  // State responsible for tracking chakra transform modal
  const [showChakraTransformModal, setChakraTransformModal] = useState(false);

  // State responsible for tracking random chakra count at end turn
  const [randomChakraCountAtEndTurn, setRandomChakraCountAtEndTurn] =
    useState(0);

  // State responsible for tracking chakras to switch from random
  const [choosenChakrasToUseAsRandom, setChoosenChakrasToUseAsRandom] =
    useState<ChakraType[]>([]);

  // State responsible for tracking selected chakras
  const [selectedChakras, setSelectedChakras] = useState<ChakraType[]>([]);

  // State responsible for tracking background
  const [background, setBackground] = useState<string>(
    "/backgrounds/battle/default.png"
  );

  // State responsible for tracking main player active chakras
  const [mainPlayerActiveChakras, setMainPlayerActiveChakras] = useState<
    ChakraType[]
  >([]);

  // State responsible for tracking if the player is turn
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);

  // State responsible for tracking turn count
  const [turnCount, setTurnCount] = useState(game.turn);

  // State responsible for tracking chakra transformation and be trigger to re select available chakras
  const [chakraTransformCount, setChakraTransformCount] = useState(0);

  // State responsible for tracking if the turn is being executed
  const [isExecutingTurn, setIsExecutingTurn] = useState(false);

  // Modals

  // Add a new state for the surrender confirmation modal
  const [showSurrenderModal, setShowSurrenderModal] = useState(false);

  // Add a new state for the battle history modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Add a new state for the exchange random final modal
  const [showExchangeRandomFinalModal, setShowExchangeRandomFinalModal] =
    useState(false);

  // Check if game is over
  useEffect(() => {
    if (game.checkGameOver()) {
      onGameOver(game.player1.isDefeated() ? "IA venceu!" : "Você venceu!");
    }
  }, [onGameOver, game, selectedActions]);

  // Check active chakras everytime player1 instance changes, selectedChakras changes or turn changes
  useEffect(() => {
    const chakras: ChakraType[] = [];
    Object.entries(game.player1.getChakraCount()).forEach(([chakra, count]) => {
      const chakraCount =
        count - selectedChakras.filter((c) => c === chakra).length;

      for (let i = 0; i < chakraCount; i++) {
        chakras.push(chakra as ChakraType);
      }
    });
    setMainPlayerActiveChakras(chakras);
  }, [game.player1, selectedChakras, turnCount, chakraTransformCount]);

  const handleTransformChakras = (
    chakrasToTransform: ChakraType[],
    targetChakra: ChakraType
  ) => {
    game.player1.transformChakras(chakrasToTransform, targetChakra, game);
    setChakraTransformCount((prev) => prev + 1);
  };

  // Get random background
  useEffect(() => {
    const backgrounds = [
      // "forest.png",
      // "training.png",
      // "akatsuki.png",
      "waterfall.png",
    ];

    const randomBackground =
      backgrounds[Math.floor(Math.random() * backgrounds.length)];
    setBackground(`/backgrounds/battle/${randomBackground}`);
  }, []);

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

  const handleTimeEnd = () => {
    const actionsWithoutRandom = selectedActions.filter(
      (action) => !action.ability.requiredChakra.includes("Random")
    );

    const actionsWithRandomDiffFromSelectedActions =
      actionsWithoutRandom.length !== selectedActions.length;

    if (actionsWithRandomDiffFromSelectedActions) {
      setSelectedChakras(
        actionsWithoutRandom.flatMap((action) => action.ability.requiredChakra)
      );

      setSelectedActions(actionsWithoutRandom);
    }

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
    // TODO: Temporary solution for animations
    setIsExecutingTurn(true);
    await new Promise((resolve) => setTimeout(resolve, 5000));
    setIsExecutingTurn(false);
    // TODO: think about adding while to wait for isExecutionTurn to be false
    // From SpriteBoard before finalizeTurn

    choosenChakrasToUseAsRandom.forEach((chakra) =>
      game.player1.consumeChakra(chakra)
    );
    game.executeTurn(selectedActions);
    clearStates();
    game.nextTurn(game.player2);
    setIsPlayerTurn(false);
    setTurnCount(game.turn);
    // AI Action
    await executeAITurn();
  };

  // TODO: Randomized AI Turn
  const executeAITurn = async () => {
    const aiActions: {
      player: Player;
      character: Character;
      ability: Ability;
      target: Character;
    }[] = [];

    game.player2.characters.forEach((char) => {
      if (char.hp > 0) {
        const availableAbilities = char.abilities.filter(
          (ability) =>
            ability.canUse(char, game.player2.chakras) &&
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
              targets = game.player1.characters.filter((c) => c.hp > 0);
              break;
            case "AllEnemies":
              targets = game.player1.characters;
              break;
            case "Ally":
              targets = game.player2.characters.filter((c) => c.hp > 0);
              break;
            case "AllAllies":
              targets = game.player2.characters;
              break;
            case "Self":
              targets = [char];
              break;
          }

          if (targets.length > 0) {
            const target = targets[Math.floor(Math.random() * targets.length)];
            aiActions.push({
              player: game.player2,
              character: char,
              ability: randomAbility,
              target,
            });
          }
        }
      }
    });

    await new Promise((resolve) => setTimeout(resolve, 5000));

    game.executeTurn(aiActions);
    game.nextTurn(game.player1);
    setIsPlayerTurn(true);
    setTurnCount((prev) => prev + 1);
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
                game={game}
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
