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
import HealthBar from "../components/HealthBar/HealthBar";

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
    "/backgrounds/default.png"
  );

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

  useEffect(() => {
    if (game.checkGameOver()) {
      onGameOver(game.player1.isDefeated() ? "IA venceu!" : "Você venceu!");
    }
  }, [onGameOver, game, selectedActions]);

  useEffect(() => {
    // List of available backgrounds
    const backgrounds = [
      "forest.png",
      "training.png",
      "akatsuki.png",
      "waterfall.png",
      // Add more background filenames as needed
    ];

    // Select random background
    const randomBackground =
      backgrounds[Math.floor(Math.random() * backgrounds.length)];
    setBackground(`/backgrounds/${randomBackground}`);
  }, []); // Empty dependency array means this runs once when component mounts

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

          <div className="end-turn-button-container">
            <button onClick={executeTurn} className="end-turn-button">
              Finalizar Turno
            </button>
          </div>

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
                    <div className="character-info-abilities-container">
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

const CurrentActions = ({
  character,
  selectedActions,
  removeSelectedAction,
}: {
  character: Character;
  selectedActions: SelectedAction[];
  removeSelectedAction: (index: number) => void;
}) => {
  return (
    <div className="current-actions">
      {selectedActions.map(
        (action, actionIndex) =>
          action.target === character && (
            <div
              key={action.ability.name + actionIndex}
              className="effect-icon-container"
              onClick={() => removeSelectedAction(actionIndex)}
            >
              <img
                src={`/abilities/${action.character.name
                  .split(" ")
                  .join("")
                  .toLowerCase()}/${action.ability.name
                  .split(" ")
                  .join("")
                  .toLowerCase()}.png`}
                alt={action.ability.name}
                className="effect-icon"
                onError={(e) => {
                  e.currentTarget.src = "/abilities/default.png";
                }}
              />
              <div className="effect-tooltip">
                <h4>{action.ability.name}</h4>
                <p>{action.ability.description}</p>
                <div className="effect-duration">
                  <span>Will be applied this turn</span>
                </div>
              </div>
            </div>
          )
      )}
    </div>
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
  return (
    <div className="current-actions">
      {selectedActions.map(
        (action, actionIndex) =>
          action.target === character && (
            <div
              key={actionIndex}
              className="effect-icon-container"
              onClick={() => removeSelectedAction(actionIndex)}
            >
              <img
                src={`/abilities/${action.character.name
                  .split(" ")
                  .join("")
                  .toLowerCase()}/${action.ability.name
                  .split(" ")
                  .join("")
                  .toLowerCase()}.png`}
                alt={action.ability.name}
                className="effect-icon"
                onError={(e) => {
                  e.currentTarget.src = "/abilities/default.png";
                }}
              />
              <div className="effect-tooltip">
                <h4>{action.ability.name}</h4>
                <p>{action.ability.description}</p>
                <div className="effect-duration">
                  <span>Will be applied this turn</span>
                </div>
              </div>
            </div>
          )
      )}
    </div>
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
    <div className="abilities-container">
      {character.abilities.map((ability) => {
        const isAbilityDisabled =
          !ability.canUse(character, activeChakras) ||
          selectedActions.some((action) => action.character === character) ||
          ability.isOnCooldown();

        return (
          <div
            key={ability.name}
            className={`ability-icon-container`}
            onClick={() =>
              !isAbilityDisabled && handleAbilityClick(character, ability)
            }
          >
            <img
              src={`/abilities/${character.name
                .split(" ")
                .join("")
                .toLowerCase()}/${ability.name
                .split(" ")
                .join("")
                .toLowerCase()}.png`}
              alt={ability.name}
              className={`ability-icon ${
                isAbilityDisabled ? "ability-inactive" : "ability-active"
              }`}
              onError={(e) => {
                e.currentTarget.src = "/abilities/default.png";
              }}
            />
            {ability.currentCooldown > 0 && (
              <div className="ability-cooldown-overlay">
                {ability.currentCooldown}
              </div>
            )}
            <div className="ability-tooltip">
              <h4>{ability.name}</h4>
              <p>{ability.description}</p>
              <div className="ability-details">
                <span>Chakra: {ability.requiredChakra.join(", ")}</span>
                {ability.currentCooldown > 0 && (
                  <span className="cooldown">
                    Cooldown: {ability.currentCooldown}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const ActiveEffects = ({ character }: { character: Character }) => {
  return (
    <div className="active-effects">
      {character.activeEffects.map((effect, index) => {
        const duration =
          effect.damageReduction?.remainingTurns ||
          effect.buff?.remainingTurns ||
          effect.transformation?.remainingTurns;

        return (
          <div key={effect.name + index} className="effect-icon-container">
            <img
              src={`/abilities/${character.name
                .split(" ")
                .join("")
                .toLowerCase()}/${effect.name
                .split(" ")
                .join("")
                .toLowerCase()}.png`}
              alt={effect.name}
              className="effect-icon"
              onError={(e) => {
                e.currentTarget.src = "/abilities/default.png";
              }}
            />
            <div className="effect-tooltip">
              <h4>{effect.name}</h4>
              <p>{effect.description}</p>
              {duration && (
                <div className="effect-duration">
                  <span>
                    {duration === 1
                      ? "1 turn remaining"
                      : `${duration} turns remaining`}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
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
    <div className="character-name-container">
      <div className="character-portrait">
        <img
          src={`/characters/${character.name
            .split(" ")
            .join("")
            .toLowerCase()}/${character.name
            .split(" ")
            .join("")
            .toLowerCase()}.png`}
          alt={character.name}
          className="character-image"
          onError={(e) => {
            // Fallback to default image if character image doesn't exist
            e.currentTarget.src = "/characters/default.png";
          }}
        />
      </div>
      <div className="character-details">
        <h4
          className={`character-name ${
            character.hp > 0 ? "character-alive" : "character-dead"
          } ${possibleTargets.includes(character) ? "character-selected" : ""}`}
        >
          {character.name}
        </h4>
        <HealthBar currentHP={character.hp} />
      </div>
    </div>
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
    <div className="character-name-container enemy">
      <div className="character-details">
        <HealthBar currentHP={character.hp} />
        <h4
          className={`character-name ${
            character.hp > 0 ? "character-alive" : "character-dead"
          } ${possibleTargets.includes(character) ? "character-selected" : ""}`}
        >
          {character.name}
        </h4>
      </div>
      <div className="character-portrait">
        <img
          src={`/characters/${character.name.toLowerCase()}/${character.name.toLowerCase()}.png`}
          alt={character.name}
          className="character-image"
          onError={(e) => {
            // Fallback to default image if character image doesn't exist
            e.currentTarget.src = "/characters/default.png";
          }}
        />
      </div>
    </div>
  );
};
