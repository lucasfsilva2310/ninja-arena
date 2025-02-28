import "./reset.css";
import "./App.css";

import { useState } from "react";
import CharacterSelection from "./web/CharacterSelection/CharacterSelection";
import { GameEngine } from "./models/game-engine";
import { Character } from "./models/character.model";
import { Player } from "./models/player.model";
import { AICharacters } from "./database/ai-characters";
import Battle from "./web/Battle/Battle";

function App() {
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

  const handleGameOver = (text: string) => {
    alert(text);
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
