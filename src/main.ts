import { renderCharacterSelection, startGame } from "./web/ui";

document.addEventListener("DOMContentLoaded", () => {
  renderCharacterSelection();
  document.getElementById("start-game")!.addEventListener("click", startGame);
});
