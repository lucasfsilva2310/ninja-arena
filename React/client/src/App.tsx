import "./styles/reset.css";
import "./App.css";

import { useState, useEffect, useCallback } from "react";
import { GameEngine } from "./models/game-engine";
import { Character } from "./models/character/character.model";
import { Player } from "./models/player.model";
import { AICharacters } from "./database/ai-characters";

import CharacterSelection from "./components/CharacterSelection/CharacterSelection";
import Battle from "./components/Battle/Battle";

function App() {
  const [selectedCharacters, setSelectedCharacters] = useState<Character[]>([]);
  const [game, setGame] = useState<GameEngine | null>(null);
  const [gameResult, setGameResult] = useState<string | null>(null);

  // Handle game over with useEffect to control when alerts appear
  useEffect(() => {
    if (gameResult) {
      alert(gameResult);
      setGameResult(null);
    }
  }, [gameResult]);

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

  // Use useCallback to memoize this function
  const startGame = useCallback(() => {
    if (selectedCharacters.length !== 3) {
      alert("Escolha exatamente 3 personagens para iniciar o jogo!");
      return;
    }

    const player = new Player(
      "You",
      selectedCharacters.map((char) => {
        return new Character(
          char.name,
          char.abilities.map((a) => a.clone())
        );
      })
    );

    // Create fresh AI player
    const aiPlayer = new Player(
      "AI",
      AICharacters.slice(0, 3).map((char) => {
        return new Character(
          char.name,
          char.abilities.map((a) => a.clone())
        );
      })
    );

    // Create new game engine
    const newGame = new GameEngine(player, aiPlayer);
    newGame.startGame();
    setGame(newGame);
  }, [selectedCharacters]);

  const handleGameOver = (text: string) => {
    // Set game result without immediate alert
    setGameResult(text);

    // Clear game state completely
    setGame(null);
    setSelectedCharacters([]);
  };

  return (
    <div className="root">
      {!game ? (
        <CharacterSelection
          selectedCharacters={selectedCharacters}
          startGame={startGame}
          toggleCharacterSelection={toggleCharacterSelection}
        />
      ) : (
        <Battle game={game} onGameOver={handleGameOver} />
      )}
    </div>
  );
}

export default App;
