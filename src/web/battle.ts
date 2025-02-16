import { GameEngine } from "./game-engine";
import { Ability } from "./models/ability.model";
import { chakraTypes, initialChakraObj } from "./models/chakra.model";
import { Character } from "./models/character.model";
import { Player } from "./models/player.model";

let game: GameEngine;
let selectedActions: {
  character: Character;
  ability: Ability;
  target: Character;
}[] = [];

/**
 * Inicializa o painel de batalha e exibe a interface do turno.
 */
export function startBattle(engine: GameEngine) {
  game = engine;
  updateBattleUI();
}

/**
 * Atualiza a interface de batalha com informações do turno.
 */
function updateBattleUI() {
  const battleContainer = document.getElementById("battle")!;

  const chakras = game.player1.chakras.reduce((acc, chakra) => {
    acc[chakra] = (acc[chakra] || 0) + 1;
    return acc;
  }, initialChakraObj);

  battleContainer.innerHTML = `
    <h2>Turno ${game.turn}</h2>
    <div id="player-chakra">Chakras: ${Object.keys(chakraTypes)
      .map((chakra) => `${chakra}: ${chakras[chakra]}`)
      .join(" | ")}</div>

    <h3>Seu Time</h3>
    <div id="player-team">${renderTeam(game.player1)}</div>

    <h3>Time Inimigo</h3>
    <div id="enemy-team">${renderEnemyTeam(game.player2)}</div>

    <button id="end-turn" ${selectedActions.length > 0 ? "" : "disabled"}>
      Finalizar Turno
    </button>
  `;

  document.getElementById("end-turn")!.addEventListener("click", executeTurn);
}

/**
 * Renderiza o time do jogador com botões para selecionar habilidades e alvos.
 */
function renderTeam(player: Player): string {
  return player.characters
    .map(
      (char, index) => `
      <div class="character">
        <h3>${char.name} (HP: ${char.hp})</h3>
        ${char.abilities
          .map(
            (ability) =>
              `<button class="ability-btn" data-char="${index}" data-ability="${
                ability.name
              }" 
              ${ability.canUse(game.player1.chakras) ? "" : "disabled"}>
                ${ability.name} (${ability.requiredChakra.join(", ")})
              </button>`
          )
          .join("")}
      </div>
    `
    )
    .join("");
}

/**
 * Renderiza o time inimigo para seleção de alvos.
 */
function renderEnemyTeam(player: Player): string {
  return player.characters
    .map(
      (char) => `
      <div class="enemy-character">
        <h3>${char.name} (HP: ${char.hp})</h3>
      </div>
    `
    )
    .join("");
}

/**
 * Lida com a seleção de habilidades.
 */
document.addEventListener("click", (event) => {
  const target = event.target as HTMLElement;

  if (target.classList.contains("ability-btn")) {
    const charIndex = parseInt(target.getAttribute("data-char")!);
    const abilityName = target.getAttribute("data-ability")!;

    const character = game.player1.characters[charIndex];
    const ability = character.abilities.find((a) => a.name === abilityName)!;

    selectTarget(character, ability);
  }
});

/**
 * Seleciona um alvo para a habilidade escolhida.
 */
function selectTarget(character: Character, ability: Ability) {
  const battleContainer = document.getElementById("battle")!;
  battleContainer.innerHTML += `<h3>Selecione um alvo:</h3>`;

  battleContainer.innerHTML += game.player2.characters
    .map(
      (char, index) => `
      <button class="target-btn" data-char="${index}">
        ${char.name} (HP: ${char.hp})
      </button>
    `
    )
    .join("");

  document.querySelectorAll(".target-btn").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      const targetIndex = parseInt(
        (event.target as HTMLElement).getAttribute("data-char")!
      );
      const target = game.player2.characters[targetIndex];

      selectedActions.push({ character, ability, target });
      updateBattleUI();
    });
  });
}

/**
 * Executa as ações do turno.
 */
function executeTurn() {
  // Player 1 executa suas ações
  game.executeTurn(selectedActions);
  selectedActions = [];

  // Player 2 (IA) escolhe ações aleatórias
  executeAITurn();

  // Verifica se o jogo acabou
  if (game.checkGameOver()) {
    displayWinner();
    return;
  }

  // Novo turno começa
  game.nextTurn();
  updateBattleUI();
}

/**
 * IA escolhe habilidades aleatórias para atacar o jogador.
 */
function executeAITurn() {
  const aiActions: {
    character: Character;
    ability: Ability;
    target: Character;
  }[] = [];

  game.player2.characters.forEach((character) => {
    if (character.hp > 0) {
      const availableAbilities = character.abilities.filter((ability) =>
        ability.canUse(game.player2.chakras)
      );
      if (availableAbilities.length > 0) {
        const randomAbility =
          availableAbilities[
            Math.floor(Math.random() * availableAbilities.length)
          ];
        const target =
          game.player1.characters[
            Math.floor(Math.random() * game.player1.characters.length)
          ];
        aiActions.push({ character, ability: randomAbility, target });
      }
    }
  });

  game.executeTurn(aiActions);
}

/**
 * Exibe o vencedor do jogo.
 */
function displayWinner() {
  const battleContainer = document.getElementById("battle")!;
  const winner = game.player1.isDefeated() ? "IA venceu!" : "Você venceu!";
  battleContainer.innerHTML = `<h2>${winner}</h2>`;
}
