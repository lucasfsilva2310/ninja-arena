import { startBattle } from "./battle";
import { availableCharacters } from "./database/characters";
import { GameEngine } from "./game-engine";
import { Character } from "./models/character.model";
import { Player } from "./models/player.model";

const player = new Player("Você");
const ai = new Player("Inteligência Artificial", [
  availableCharacters[0],
  availableCharacters[1],
  availableCharacters[2],
]);

let game: GameEngine;

export function renderCharacterSelection() {
  const container = document.getElementById("character-selection")!;
  container.innerHTML = availableCharacters
    .map(
      (char, index) => `
    <button class="char-btn" data-index="${index}">${char.name}</button>
  `
    )
    .join("");

  document.querySelectorAll(".char-btn").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      const index = parseInt(
        (event.target as HTMLElement).getAttribute("data-index")!
      );
      toggleCharacterSelection(availableCharacters[index]);
    });
  });
}

function toggleCharacterSelection(character: Character) {
  if (player.characters.includes(character)) {
    player.characters = player.characters.filter((c) => c !== character);
  } else if (player.characters.length < 3) {
    player.characters.push(character);
  }
  updateSelectionDisplay();
}

function updateSelectionDisplay() {
  const container = document.getElementById("selected-characters")!;
  container.innerHTML = player.characters.map((c) => c.name).join(", ");
}

export function startGame() {
  if (player.characters.length !== 3) {
    alert("Escolha exatamente 3 personagens para iniciar o jogo!");
    return;
  }

  game = new GameEngine(player, ai);
  game.startGame();
  startBattle(game);
}
