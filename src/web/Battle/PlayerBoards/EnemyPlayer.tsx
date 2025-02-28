import "./Board.css";
import { Character } from "../../../models/character.model";
import { GameEngine } from "../../../models/game-engine";
import { Player } from "../../../models/player.model";
import { SelectedAction } from "../Battle";
import { CurrentActionsOnEnemy } from "../ActionsAndEffects/CurrentActionsOnEnemy";
import { ActiveEffects } from "../ActionsAndEffects/ActiveEffects";
import { EnemyCharacterName } from "../PlayerNames/EnemyCharacterName";

export const EnemyPlayer = ({
  game,
  handleTargetClick,
  possibleTargets,
  selectedActions,
  removeSelectedAction,
}: {
  game: GameEngine;
  handleTargetClick: (player: Player, target: Character) => void;
  possibleTargets: Character[];
  selectedActions: SelectedAction[];
  removeSelectedAction: (index: number) => void;
}) => {
  return game.player2.characters.map((char, charIndex) => (
    <div
      className="character-card enemy-card"
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
  ));
};
