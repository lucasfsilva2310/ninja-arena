import React, { useState, useEffect } from "react";
import { GameEngine } from "../models/game-engine";
import { Ability } from "../models/ability.model";
import { Character } from "../models/character.model";
import Modal from "./Modal";
import "./Battle.css";

interface BattleProps {
  game: GameEngine;
  onGameOver: (winner: string) => void;
}

export default function Battle({ game, onGameOver }: BattleProps) {
  const [selectedActions, setSelectedActions] = useState<
    { character: Character; ability: Ability; target: Character }[]
  >([]);
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

  const handleAbilityClick = (character: Character, ability: Ability) => {
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
    if (selectedAbility) {
      setSelectedActions([
        ...selectedActions,
        { character: target, ability: selectedAbility, target },
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
    game.executeTurn(selectedActions);
    setSelectedActions([]);
    game.nextTurn();
    setShowModal(false);
  };
  console.log(game.player1.chakras);

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
          {game.player1.characters.map((char) => (
            // TODO implementar sistema de exibir efeitos ativos no turno
            // Kawarimi, efeitos stack, efeitos permanentes
            <div
              key={char.name}
              className="character-card"
              onClick={() => handleTargetClick(char)}
            >
              <h4
                className={`character-name ${
                  char.hp > 0 ? "character-alive" : "character-dead"
                } ${
                  possibleTargets.includes(char) ? "character-selected" : ""
                }`}
              >
                {char.name} (HP: {char.hp})
                {selectedActions.find((action) => action.target === char) && (
                  <p className="ability-selected">
                    {
                      selectedActions.find((action) => action.target === char)
                        ?.ability.name
                    }
                  </p>
                )}
              </h4>
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
            </div>
          ))}
        </div>

        <div className="team-container">
          <h3 className="team-title">Time Inimigo</h3>
          {game.player2.characters.map((char) => (
            <div
              key={char.name}
              className={`enemy-card ${
                possibleTargets.includes(char) ? "enemy-selected" : ""
              } enemy-hover`}
              onClick={() => handleTargetClick(char)}
            >
              <h4 className="font-medium">
                {char.name} (HP: {char.hp})
              </h4>
              {selectedActions.find((action) => action.target === char) && (
                <p className="ability-selected">
                  {
                    selectedActions.find((action) => action.target === char)
                      ?.ability.name
                  }
                </p>
              )}
            </div>
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
