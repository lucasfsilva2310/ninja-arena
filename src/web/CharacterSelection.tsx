import React, { useState } from "react";
import { GameEngine } from "../models/game-engine";
import { Character } from "../models/character.model";
import { Player } from "../models/player.model";
import { AICharacters, availableCharacters } from "../database/characters";
import Battle from "./Battle/Battle";

export default function CharacterSelection() {
  const [selectedCharacters, setSelectedCharacters] = useState<Character[]>([]);
  const [game, setGame] = useState<GameEngine | null>(null);

  const toggleCharacterSelection = (character: Character) => {
    setSelectedCharacters((prev) => {
      if (prev.includes(character)) {
        return prev.filter((c) => c !== character);
      }
      if (prev.length < 3) {
        return [...prev, character];
      }
      return prev;
    });
  };

  const startGame = () => {
    if (selectedCharacters.length !== 3) {
      alert("Escolha exatamente 3 personagens para iniciar o jogo!");
      return;
    }
    const player = new Player("Você", selectedCharacters);
    const aiPlayer = new Player(
      "Inteligência Artificial",
      AICharacters.slice(0, 3)
    );
    const newGame = new GameEngine(player, aiPlayer);
    newGame.startGame();
    setGame(newGame);
  };

  const handleGameOver = () => {
    setGame(null);
    setSelectedCharacters([]);
  };

  return (
    <div className="character-selection-container">
      {!game ? (
        <>
          <h2>Selecione 3 personagens</h2>
          <div className="characters-list">
            {availableCharacters.map((char) => (
              <button
                key={char.name}
                className={`char-btn ${
                  selectedCharacters.includes(char) ? "selected" : ""
                }`}
                onClick={() => toggleCharacterSelection(char)}
              >
                {char.name}
              </button>
            ))}
          </div>
          <div className="selected-characters">
            <h3>Personagens Selecionados:</h3>
            <p>
              {selectedCharacters.map((c) => c.name).join(", ") || "Nenhum"}
            </p>
          </div>
          <button
            className="start-game-btn"
            onClick={startGame}
            disabled={selectedCharacters.length !== 3}
          >
            Iniciar Jogo
          </button>
        </>
      ) : (
        <Battle game={game} onGameOver={handleGameOver} />
      )}
    </div>
  );
}
