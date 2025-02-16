import { renderCharacterSelection, startGame } from "./ui";

document.addEventListener("DOMContentLoaded", () => {
  renderCharacterSelection();
  document.getElementById("start-game")!.addEventListener("click", startGame);
});
