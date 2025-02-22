import React, { useState, useEffect } from "react";
import { GameEngine } from "../../models/game-engine";
import { Ability } from "../../models/ability.model";
import { Character } from "../../models/character.model";
import Modal from "./Modal";
import "./Battle.css";

interface BattleProps {
  game: GameEngine;
  onGameOver: (winner: string) => void;
}

interface SelectedAction {
  character: Character;
  ability: Ability;
  target: Character;
}

export default function Battle({ game, onGameOver }: BattleProps) {
  const [selectedActions, setSelectedActions] = useState<SelectedAction[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(
    null
  );
  const [selectedAbility, setSelectedAbility] = useState<Ability | null>(null);
  const [possibleTargets, setPossibleTargets] = useState<Character[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [randomChakraCount, setRandomChakraCount] = useState(0);

  useEffect(() => {
    if (game.checkGameOver()) {
      onGameOver(game.player1.isDefeated() ? "IA venceu!" : "Você venceu!");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onGameOver]);
  console.log(selectedAbility);
  console.log(selectedCharacter);
  console.log(possibleTargets);
  const handleAbilityClick = (character: Character, ability: Ability) => {
    if (selectedAbility === ability) {
      setSelectedCharacter(null);
      setSelectedAbility(null);
      setPossibleTargets([]);
      return;
    }

    setSelectedCharacter(character);
    setSelectedAbility(ability);
    let targets: Character[] = [];

    switch (ability.target) {
      case "Enemy":
        targets = game.player2.characters.filter((char) => char.hp > 0);
        break;
      case "AllEnemies":
        targets = game.player2.characters;
        break;
      case "Ally":
        targets = game.player1.characters.filter((char) => char.hp > 0);
        break;
      case "AllAllies":
        targets = game.player1.characters;
        break;
      case "Self":
        targets = [character];
        break;
    }

    setPossibleTargets([...targets]);
  };
  const handleTargetClick = (target: Character) => {
    if (!possibleTargets.includes(target)) {
      return;
    }

    if (selectedAbility) {
      setSelectedActions([
        ...selectedActions,
        {
          character: selectedCharacter || target,
          ability: selectedAbility,
          target,
        },
      ]);
      setSelectedAbility(null);
      setPossibleTargets([]);
    }
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
      setShowModal(true);
      return;
    }

    finalizeTurn();
  };
  const finalizeTurn = () => {
    // TODO: implementar sistema de exibir efeitos ativos no turno
    // E aplicar active effects no execute turn
    game.executeTurn(selectedActions);
    setSelectedActions([]);
    setShowModal(false);

    // AI Action
    executeAITurn();

    game.nextTurn();
  };

  // TODO: Randomized AI Turn
  const executeAITurn = () => {
    const aiActions: {
      character: Character;
      ability: Ability;
      target: Character;
    }[] = [];

    game.player2.characters.forEach((char) => {
      if (char.hp > 0) {
        const availableAbilities = char.abilities.filter((ability) =>
          ability.canUse(game.player2.chakras)
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
            aiActions.push({ character: char, ability: randomAbility, target });
          }
        }
      }
    });

    game.executeTurn(aiActions);
  };

  return (
    <div className="battle-container">
      <h2 className="battle-header">Turno {game.turn}</h2>

      <div className="chakra-container">
        <h3 className="chakra-title">Chakra Disponível</h3>
        <div className="flex gap-2">
          {Object.entries(game.player1.getChakraCount()).map(
            ([chakra, count]) => (
              <span key={chakra} className="chakra-item">
                {chakra}: {count}
              </span>
            )
          )}
        </div>
      </div>

      <div className="teams-container">
        <div className="team-container">
          <h3 className="team-title">Seu Time</h3>
          {game.player1.characters.map((char, index) => (
            <>
              <div
                key={char.name + index}
                className="character-card"
                onClick={() => handleTargetClick(char)}
              >
                <PlayerCharacterName
                  character={char}
                  possibleTargets={possibleTargets}
                  selectedActions={selectedActions}
                />
              </div>
              <div className="flex gap-2">
                {char.abilities.map((ability) => (
                  <button
                    key={ability.name}
                    onClick={() => handleAbilityClick(char, ability)}
                    disabled={!ability.canUse(game.player1.chakras)}
                    className={`ability-button ${
                      ability.canUse(game.player1.chakras)
                        ? "ability-active"
                        : "ability-inactive"
                    }`}
                  >
                    {ability.name} ({ability.requiredChakra.join(", ")})
                  </button>
                ))}
              </div>
              <Effects character={char} />
            </>
          ))}
        </div>

        <div className="team-container">
          <h3 className="team-title">Time Inimigo</h3>
          {game.player2.characters.map((char) => (
            <>
              <div
                key={char.name}
                className={`enemy-card ${
                  possibleTargets.includes(char) ? "enemy-selected" : ""
                } enemy-hover`}
                onClick={() => handleTargetClick(char)}
              >
                <EnemyCharacterName character={char} />
                {selectedActions.find((action) => action.target === char) && (
                  <p className="ability-selected">
                    {
                      selectedActions.find((action) => action.target === char)
                        ?.ability.name
                    }
                  </p>
                )}
              </div>
              <Effects character={char} />
            </>
          ))}
        </div>
      </div>
      <button onClick={executeTurn} className="turn-button">
        Finalizar Turno
      </button>

      {showModal && (
        <Modal
          availableChakras={game.player1.chakras}
          requiredRandomCount={randomChakraCount}
          onConfirm={finalizeTurn}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

const Effects = ({ character }: { character: Character }) => {
  return (
    <p className="active-effects">
      {character.activeEffects.length > 0 && (
        <span className="text-red-500" key="effects">
          Efeitos:{" "}
          {character.activeEffects.map((effect, index) => (
            <>
              {effect.name && (
                <p key={effect.name + index}>
                  {effect.name}- {effect.description}
                </p>
              )}
            </>
          ))}
        </span>
      )}
    </p>
  );
};

const PlayerCharacterName = ({
  character,
  possibleTargets,
  selectedActions,
}: {
  character: Character;
  possibleTargets: Character[];
  selectedActions: SelectedAction[];
}) => {
  return (
    <h4
      className={`character-name ${
        character.hp > 0 ? "character-alive" : "character-dead"
      } ${possibleTargets.includes(character) ? "character-selected" : ""}`}
    >
      {character.name} (HP: {character.hp})
      {selectedActions.find((action) => action.target === character) && (
        <p className="ability-selected">
          {
            selectedActions.find((action) => action.target === character)
              ?.ability.name
          }
        </p>
      )}
    </h4>
  );
};

const EnemyCharacterName = ({ character }: { character: Character }) => {
  return (
    <h4 className="font-medium">
      {character.name} (HP: {character.hp})
    </h4>
  );
};
