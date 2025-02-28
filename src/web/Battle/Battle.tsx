import "./Battle.css";

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
import { MainPlayer } from "./PlayerBoards/MainPlayer";
import { EnemyPlayer } from "./PlayerBoards/EnemyPlayer";

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
  const finalizeTurn = () => {
    chakrasToSwitchFromRandom.forEach((chakra) =>
      game.player1.consumeChakra(chakra)
    );
    game.executeTurn(selectedActions);
    clearStates();
    game.nextTurn(game.player2);

    // AI Action
    executeAITurn();
  };

  // TODO: Randomized AI Turn
  const executeAITurn = () => {
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

    game.executeTurn(aiActions);
    game.nextTurn(game.player1);
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
          <AvailableChakra
            game={game}
            activeChakras={player1ActiveChakras}
            selectedChakras={selectedChakras}
            setChakraTransformModal={setChakraTransformModal}
          />

          <h2 className="battle-header">Turn {game.turn}</h2>

          <div className="end-turn-button-container">
            <button onClick={executeTurn} className="end-turn-button">
              End Turn
            </button>
          </div>

          <div className="teams-container">
            {/* Player 1 Team */}
            <div className="team-container">
              <h3 className="team-title">Your team</h3>
              <MainPlayer
                game={game}
                handleTargetClick={handleTargetClick}
                possibleTargets={possibleTargets}
                selectedActions={selectedActions}
                removeSelectedAction={removeSelectedAction}
                handleAbilityClick={handleAbilityClick}
                playerActiveChakras={player1ActiveChakras}
              />
            </div>

            {/* Player 2 Team */}
            <div className="team-container">
              <h3 className="team-title">Enemy Team</h3>
              <EnemyPlayer
                game={game}
                handleTargetClick={handleTargetClick}
                possibleTargets={possibleTargets}
                selectedActions={selectedActions}
                removeSelectedAction={removeSelectedAction}
              />
            </div>
          </div>
        </div>
        <AbilityFooter
          selectedCharacter={selectedCharacterForAbilitiesPreview}
          currentSelectedAbility={selectedAbility}
        />
      </div>
    </>
  );
}
