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

import AbilityFooter from "../components/AbilityDescriptionFooter/AbilityDescriptionFooter";
import { AvailableChakra } from "./AvailableChakra/AvailableChakra";
import { PlayerBoard } from "./PlayerBoards/PlayerBoard";
import { PlayerInfo } from "./PlayerInfo/PlayerInfo";
import BattleOptions from "./BattleOptions/BattleOptions";
import { TurnTimer } from "./TurnTimer/TurnTimer";

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
  const [selectedActions, setSelectedActions] = useState<SelectedAction[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(
    null
  );
  const [
    selectedCharacterForAbilitiesPreview,
    setSelectedCharacterForAbilitiesPreview,
  ] = useState<Character | null>(null);
  const [selectedAbility, setSelectedAbility] = useState<Ability | null>(null);
  const [possibleTargets, setPossibleTargets] = useState<Character[]>([]);
  const [showExchangeRandomFinalModal, setShowExchangeRandomFinalModal] =
    useState(false);
  const [showChakraTransformModal, setChakraTransformModal] = useState(false);
  const [randomChakraCount, setRandomChakraCount] = useState(0);
  const [chakrasToSwitchFromRandom, setChakrasToSwitchFromRandom] = useState<
    ChakraType[]
  >([]);
  const [selectedChakras, setSelectedChakras] = useState<ChakraType[]>([]);
  const [background, setBackground] = useState<string>(
    "/backgrounds/battle/default.png"
  );

  const [player1ActiveChakras, setPlayer1ActiveChakras] = useState<
    ChakraType[]
  >([]);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [turnCount, setTurnCount] = useState(1);

  // Recalc active chakras based on selected chakras
  useEffect(() => {
    const chakras: ChakraType[] = [];
    Object.entries(game.player1.getChakraCount()).forEach(([chakra, count]) => {
      const chakraCount =
        count - selectedChakras.filter((c) => c === chakra).length;

      for (let i = 0; i < chakraCount; i++) {
        chakras.push(chakra as ChakraType);
      }
    });
    setPlayer1ActiveChakras(chakras);
  }, [game.player1, selectedChakras]);

  const handleTransformChakras = (
    chakrasToTransform: ChakraType[],
    targetChakra: ChakraType
  ) => {
    game.player1.transformChakras(chakrasToTransform, targetChakra);
  };

  // Check if game is over
  useEffect(() => {
    if (game.checkGameOver()) {
      onGameOver(game.player1.isDefeated() ? "IA venceu!" : "Você venceu!");
    }
  }, [onGameOver, game, selectedActions]);

  // Get random background
  useEffect(() => {
    const backgrounds = [
      "forest.png",
      "training.png",
      "akatsuki.png",
      "waterfall.png",
    ];

    const randomBackground =
      backgrounds[Math.floor(Math.random() * backgrounds.length)];
    setBackground(`/backgrounds/battle/${randomBackground}`);
  }, []);

  const clearStates = () => {
    setSelectedCharacter(null);
    setSelectedAbility(null);
    setSelectedActions([]);
    setPossibleTargets([]);
    setChakrasToSwitchFromRandom([]);
    setSelectedChakras([]);
    setShowExchangeRandomFinalModal(false);
    setSelectedCharacterForAbilitiesPreview(null);
  };

  const clearActionStates = () => {
    setSelectedAbility(null);
    setSelectedActions([]);
    setPossibleTargets([]);
  };

  const handleAbilityClick = (character: Character, ability: Ability) => {
    if (selectedAbility === ability && selectedCharacter === character) {
      clearActionStates();
      return;
    }
    setSelectedCharacterForAbilitiesPreview(character);
    setSelectedCharacter(character);
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

    setPossibleTargets([...targets]);
  };

  const handleTargetClick = (player: Player, target: Character) => {
    setSelectedCharacterForAbilitiesPreview(target);
    setSelectedAbility(null);

    if (!possibleTargets.includes(target)) {
      return;
    }

    if (selectedAbility) {
      setSelectedActions([
        ...selectedActions,
        {
          player,
          character: selectedCharacter || target,
          ability: selectedAbility,
          target,
        },
      ]);

      setSelectedChakras((prevChakras) => [
        ...prevChakras,
        ...selectedAbility.requiredChakra,
      ]);

      setSelectedAbility(null);
      setPossibleTargets([]);
    }
  };

  const removeSelectedAction = (index: number) => {
    setSelectedActions((prevActions) => {
      const updatedActions = [...prevActions];
      const removedAction = updatedActions.splice(index, 1)[0];

      setSelectedChakras((prevChakras) => {
        return prevChakras.filter(
          (_, i) => i >= removedAction.ability.requiredChakra.length
        );
      });

      return updatedActions;
    });
  };

  const handleTimeEnd = () => {
    // Filter out actions that require Random chakra
    const actionsWithoutRandom = selectedActions.filter(
      (action) => !action.ability.requiredChakra.includes("Random")
    );

    // If we removed any actions, update the selected chakras accordingly
    if (actionsWithoutRandom.length !== selectedActions.length) {
      // Keep only chakras from abilities without Random requirements
      setSelectedChakras(
        actionsWithoutRandom.flatMap((action) => action.ability.requiredChakra)
      );

      // Update the actions list to remove abilities with Random
      setSelectedActions(actionsWithoutRandom);
    }

    // Execute the remaining valid actions (or empty list if all had Random)
    executeRemainingActions(actionsWithoutRandom);
  };

  // New function to execute the remaining valid actions
  const executeRemainingActions = (actionsToExecute: SelectedAction[]) => {
    // Skip the random chakra modal entirely
    game.executeTurn(actionsToExecute);
    clearStates();
    game.nextTurn(game.player2);
    setIsPlayerTurn(false);
    setTurnCount((prev) => prev + 1);

    // Continue with AI turn
    executeAITurn();
  };

  const executeTurn = () => {
    const totalRandoms = selectedActions.reduce(
      (count, action) =>
        count +
        action.ability.requiredChakra.filter((c) => c === "Random").length,
      0
    );

    if (totalRandoms > 0) {
      setRandomChakraCount(totalRandoms);
      setShowExchangeRandomFinalModal(true);
      return;
    }

    finalizeTurn();
  };

  const finalizeTurn = async () => {
    chakrasToSwitchFromRandom.forEach((chakra) =>
      game.player1.consumeChakra(chakra)
    );
    game.executeTurn(selectedActions);
    clearStates();
    game.nextTurn(game.player2);
    setIsPlayerTurn(false);
    setTurnCount((prev) => prev + 1);
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
        const availableAbilities = char.abilities.filter((ability) =>
          ability.canUse(char, game.player2.chakras)
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

    await new Promise((resolve) => setTimeout(resolve, 3000));

    game.executeTurn(aiActions);
    game.nextTurn(game.player1);
    setIsPlayerTurn(true);
    setTurnCount((prev) => prev + 1);
  };

  return (
    <>
      {showExchangeRandomFinalModal && (
        <ExchangeRandomChakraFinalModal
          availableChakras={player1ActiveChakras}
          requiredRandomCount={randomChakraCount}
          chakrasToSwitchFromRandom={chakrasToSwitchFromRandom}
          setChakrasToSwitchFromRandom={setChakrasToSwitchFromRandom}
          onConfirm={finalizeTurn}
          onClose={() => setShowExchangeRandomFinalModal(false)}
        />
      )}
      {showChakraTransformModal && (
        <ChakraTransformModal
          availableChakras={player1ActiveChakras}
          onClose={() => setChakraTransformModal(false)}
          onTransform={handleTransformChakras}
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

              <AvailableChakra
                game={game}
                activeChakras={player1ActiveChakras}
                selectedChakras={selectedChakras}
                setChakraTransformModal={setChakraTransformModal}
              />
            </div>

            <PlayerInfo
              name="Player 2"
              rank="Jonin"
              avatar="/characters/default.png"
              isEnemy
            />
          </div>

          <div className="battle-content">
            <div className="end-turn-button-container">
              <button onClick={executeTurn} className="end-turn-button">
                End Turn
              </button>
            </div>

            {/* Player 1 */}
            <div className="teams-container">
              <div className="team-container">
                <PlayerBoard
                  game={game}
                  handleTargetClick={handleTargetClick}
                  possibleTargets={possibleTargets}
                  selectedActions={selectedActions}
                  removeSelectedAction={removeSelectedAction}
                  handleAbilityClick={handleAbilityClick}
                  playerActiveChakras={player1ActiveChakras}
                  isEnemy={false}
                />
              </div>

              {/* Player 2 */}
              <div className="team-container">
                <PlayerBoard
                  game={game}
                  handleTargetClick={handleTargetClick}
                  possibleTargets={possibleTargets}
                  selectedActions={selectedActions}
                  removeSelectedAction={removeSelectedAction}
                  isEnemy={true}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="battle-footer">
          <BattleOptions
            onSurrender={() => {
              /* implement later */
            }}
            onHistory={() => {
              /* implement later */
            }}
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
    </>
  );
}
