import "./Battle.css";

import React, { useState, useEffect } from "react";
import { GameEngine } from "../../models/game-engine";
import { Ability } from "../../models/ability.model";
import { Character } from "../../models/character.model";
import { ChakraType } from "../../models/chakra.model";
import { Player } from "../../models/player.model";
import ExchangeRandomChakraFinalModal from "./Modals/ExchangeRandomChakra/ExchangeRandomChakraFinalModal";
import ChakraTransformModal from "./Modals/ChakraTransform/ChakraTransformModal";

import AbilityFooter from "./AbilityFooter/AbilityFooter";

interface BattleProps {
  game: GameEngine;
  onGameOver: (winner: string) => void;
}

interface SelectedAction {
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
  const [selectedCharacterForAbilities, setSelectedCharacterForAbilities] =
    useState<Character | null>(null);
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

  const clearStates = () => {
    setSelectedCharacter(null);
    setSelectedAbility(null);
    setSelectedActions([]);
    setPossibleTargets([]);
    setChakrasToSwitchFromRandom([]);
    setSelectedChakras([]);
    setShowExchangeRandomFinalModal(false);
    setSelectedCharacterForAbilities(null);
  };

  useEffect(() => {
    if (game.checkGameOver()) {
      onGameOver(game.player1.isDefeated() ? "IA venceu!" : "Você venceu!");
    }
  }, [onGameOver, game, selectedActions]);

  const handleAbilityClick = (character: Character, ability: Ability) => {
    if (selectedAbility === ability && selectedCharacter === character) {
      clearStates();
      return;
    }

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

  // Logic to get unused chakras
  // TODO: isolate
  const player1ActiveChakras: ChakraType[] = [];

  const getNotUsedChakras = () => {
    Object.entries(game.player1.getChakraCount()).forEach(([chakra, count]) => {
      const chakraCount =
        count - selectedChakras.filter((c) => c === chakra).length;

      for (let i = 0; i < chakraCount; i++) {
        player1ActiveChakras.push(chakra as ChakraType);
      }
    });
  };

  getNotUsedChakras();

  const player1ActiveChakrasComponent = Object.entries(
    game.player1.getChakraCount()
  ).map(([chakra, count]) => (
    <span key={chakra} className="chakra-item">
      {chakra}: {count - selectedChakras.filter((c) => c === chakra).length}
    </span>
  ));

  const handleTransformChakras = (
    chakrasToTransform: ChakraType[],
    targetChakra: ChakraType
  ) => {
    game.player1.transformChakras(chakrasToTransform, targetChakra);
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
      <div className="battle-container">
        <div className="chakra-container">
          <h3 className="chakra-title">Available Chakras</h3>
          <div className="flex gap-2">{player1ActiveChakrasComponent}</div>
          <button
            onClick={() => setChakraTransformModal(true)}
            className="chakra-button"
            disabled={player1ActiveChakras.length < 5}
          >
            Trocar Chakra
          </button>
        </div>

        <h2 className="battle-header">Turn {game.turn}</h2>

        <div className="teams-container">
          {/* Player 1 Team */}
          <div className="team-container">
            <h3 className="team-title">Your team</h3>
            {game.player1.characters.map((char, charIndex) => (
              <div className="character-card" key={char.name + charIndex}>
                <div className="character-info-container">
                  <div className="character-name-box">
                    <div
                      className="character-actions"
                      onClick={() => handleTargetClick(game.player1, char)}
                    >
                      <PlayerCharacterName
                        character={char}
                        possibleTargets={possibleTargets}
                      />
                    </div>
                  </div>
                  <div className="character-info-abilities-container">
                    <div className="character-actions">
                      <CurrentActions
                        character={char}
                        selectedActions={selectedActions}
                        removeSelectedAction={removeSelectedAction}
                      />
                    </div>
                    <div className="character-effects">
                      <ActiveEffects character={char} />
                    </div>
                    <div className="abilities-container">
                      <Abilities
                        character={char}
                        activeChakras={player1ActiveChakras}
                        selectedActions={selectedActions}
                        handleAbilityClick={handleAbilityClick}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Player 2 Team */}
          <div className="team-container">
            <h3 className="team-title">Enemy Team</h3>
            {game.player2.characters.map((char, charIndex) => (
              <div
                className="character-card"
                key={char.name + charIndex + "enemy"}
              >
                <div className="character-info-container">
                  <div className="character-effects">
                    <ActiveEffects character={char} />
                  </div>
                  <div className="character-actions">
                    <CurrentActionsOnEnemy
                      character={char}
                      selectedActions={selectedActions}
                      removeSelectedAction={removeSelectedAction}
                    />
                  </div>
                  <div className="character-name-box">
                    <div
                      className={`enemy-hover ${
                        possibleTargets.includes(char) ? "enemy-selected" : ""
                      }`}
                      onClick={() => handleTargetClick(game.player1, char)}
                    >
                      <EnemyCharacterName
                        character={char}
                        possibleTargets={possibleTargets}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <AbilityFooter
            selectedAbility={selectedAbility}
            selectedCharacter={selectedCharacterForAbilities}
            onAbilityClick={(ability) =>
              handleAbilityClick(selectedCharacterForAbilities!, ability)
            }
            activeChakras={player1ActiveChakras}
          />
        </div>
        <button onClick={executeTurn} className="turn-button">
          Finalizar Turno
        </button>
      </div>
    </>
  );
}

const CurrentActions = ({
  character,
  selectedActions,
  removeSelectedAction,
}: {
  character: Character;
  selectedActions: SelectedAction[];
  removeSelectedAction: (index: number) => void;
}) => {
  return selectedActions.map(
    (action, actionIndex) =>
      action.target === character && (
        <p
          className="ability-selected"
          key={action.ability.name + actionIndex}
          onClick={() => removeSelectedAction(actionIndex)}
        >
          {action.ability.name}
        </p>
      )
  );
};

const CurrentActionsOnEnemy = ({
  character,
  selectedActions,
  removeSelectedAction,
}: {
  character: Character;
  selectedActions: SelectedAction[];
  removeSelectedAction: (index: number) => void;
}) => {
  return selectedActions.map(
    (action, actionIndex) =>
      action.target === character && (
        <p
          key={actionIndex}
          className="ability-selected"
          onClick={() => removeSelectedAction(actionIndex)}
        >
          {action.ability.name}
        </p>
      )
  );
};

const Abilities = ({
  character,
  activeChakras,
  selectedActions,
  handleAbilityClick,
}: {
  character: Character;
  activeChakras: ChakraType[];
  selectedActions: SelectedAction[];
  handleAbilityClick: (character: Character, ability: Ability) => void;
}) => {
  return (
    <div className="flex gap-2">
      {character.abilities.map((ability) => {
        const isAbilitiesDisabled =
          !ability.canUse(character, activeChakras) ||
          selectedActions.some((action) => action.character === character);
        return (
          <button
            key={ability.name}
            onClick={() => handleAbilityClick(character, ability)}
            disabled={isAbilitiesDisabled}
            className={`ability-button ${
              isAbilitiesDisabled ? "ability-inactive" : "ability-active"
            }`}
          >
            {ability.name} ({ability.requiredChakra.join(", ")}){" "}
            {ability.currentCooldown > 0
              ? `Cooldown: ${ability.currentCooldown}`
              : ""}
          </button>
        );
      })}
    </div>
  );
};

const ActiveEffects = ({ character }: { character: Character }) => {
  return (
    <p className="active-effects">
      {/* Validate if the effect is not a transformation to not render empty span */}
      {character.activeEffects.find((effect) => !effect.transformation) &&
        character.activeEffects.length > 0 && (
          <span className="effect-label" key="effects">
            {character.activeEffects.map((effect, index) => {
              if (!effect.name) {
                return null;
              }

              return (
                <span key={effect.name + index} className="effect-item">
                  {effect.name}
                  <span className="tooltip">{effect.description}</span>
                  {index < character.activeEffects.length - 1 && ", "}
                </span>
              );
            })}
          </span>
        )}
    </p>
  );
};

const PlayerCharacterName = ({
  character,
  possibleTargets,
}: {
  character: Character;
  possibleTargets: Character[];
}) => {
  return (
    <h4
      className={`character-name ${
        character.hp > 0 ? "character-alive" : "character-dead"
      } ${possibleTargets.includes(character) ? "character-selected" : ""}`}
    >
      {character.name} (HP: {character.hp})
    </h4>
  );
};

const EnemyCharacterName = ({
  character,
  possibleTargets,
}: {
  character: Character;
  possibleTargets: Character[];
}) => {
  return (
    <h4
      className={`character-name ${
        character.hp > 0 ? "character-alive" : "character-dead"
      } ${possibleTargets.includes(character) ? "character-selected" : ""}`}
    >
      {character.name} (HP: {character.hp})
    </h4>
  );
};
