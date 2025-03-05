import "./PlayerBoard.css";
import { Ability } from "../../../models/ability.model";
import { ChakraType } from "../../../models/chakra.model";
import { Character } from "../../../models/character.model";
import { GameEngine } from "../../../models/game-engine";
import { Player } from "../../../models/player.model";
import { SelectedAction } from "../Battle";
import { CurrentActions } from "../ActionsAndEffects/CurrentActions";
import { CurrentActionsOnEnemy } from "../ActionsAndEffects/CurrentActionsOnEnemy";
import { Abilities } from "../Abilities/Abilities";
import { ActiveEffects } from "../ActionsAndEffects/ActiveEffects";
import { PlayerCharacterName } from "../PlayerCharacterInfo/PlayerCharacterInfo";
import { EnemyCharacterName } from "../PlayerCharacterInfo/EnemyCharacterInfo";

interface PlayerBoardProps {
  game: GameEngine;
  handleTargetClick: (player: Player, target: Character) => void;
  possibleTargets: Character[];
  selectedActions: SelectedAction[];
  removeSelectedAction: (index: number) => void;
  handleAbilityClick?: (character: Character, ability: Ability) => void;
  playerActiveChakras?: ChakraType[];
  isEnemy?: boolean;
}

export const PlayerBoard: React.FC<PlayerBoardProps> = ({
  game,
  handleTargetClick,
  possibleTargets,
  selectedActions,
  removeSelectedAction,
  handleAbilityClick,
  playerActiveChakras,
  isEnemy = false,
}) => {
  const player = isEnemy ? game.player2 : game.player1;
  const CharacterNameComponent = isEnemy
    ? EnemyCharacterName
    : PlayerCharacterName;
  const ActionsComponent = isEnemy ? CurrentActionsOnEnemy : CurrentActions;

  return player.characters.map((char, charIndex) => (
    <div
      className={`character-card ${isEnemy ? "enemy-card" : ""}`}
      key={`${char.name}-${charIndex}${isEnemy ? "-enemy" : ""}`}
    >
      <div className="character-info-container">
        {!isEnemy ? (
          <>
            <div className="character-name-box">
              <div
                className="character-actions"
                onClick={() => handleTargetClick(player, char)}
              >
                <CharacterNameComponent
                  character={char}
                  possibleTargets={possibleTargets}
                />
              </div>
            </div>
            <div className="character-info-abilities-container">
              <div className="character-actions">
                <ActionsComponent
                  character={char}
                  selectedActions={selectedActions}
                  removeSelectedAction={removeSelectedAction}
                />
              </div>
              <div className="character-effects">
                <ActiveEffects character={char} />
              </div>
              {handleAbilityClick && playerActiveChakras && (
                <Abilities
                  character={char}
                  activeChakras={playerActiveChakras}
                  selectedActions={selectedActions}
                  handleAbilityClick={handleAbilityClick}
                />
              )}
            </div>
          </>
        ) : (
          <>
            <div className="character-info-abilities-container">
              <div className="character-effects">
                <ActiveEffects character={char} />
              </div>
              <div className="character-actions">
                <ActionsComponent
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
                onClick={() => handleTargetClick(player, char)}
              >
                <CharacterNameComponent
                  character={char}
                  possibleTargets={possibleTargets}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  ));
};
