import "./PlayerBoard.css";
import { Ability } from "../../../models/ability.model";
import { ChakraType } from "../../../models/chakra.model";
import { Character } from "../../../models/character.model";
import { GameEngine, SelectedAction } from "../../../models/game-engine";
import { Player } from "../../../models/player.model";
import { CurrentActions } from "../ActionsAndEffects/CurrentActions";
import { CurrentActionsOnEnemy } from "../ActionsAndEffects/CurrentActionsOnEnemy";
import { Abilities } from "../Abilities/Abilities";
import { ActiveEffects } from "../ActionsAndEffects/ActiveEffects";
import { PlayerCharacterName } from "../PlayerCharacterInfo/PlayerCharacterInfo";
import { EnemyCharacterName } from "../PlayerCharacterInfo/EnemyCharacterInfo";
import { SelectedAbility } from "../SelectedAbility/SelectedAbility";

interface PlayerBoardProps {
  game: GameEngine;
  handleTargetClick: (player: Player, target: Character) => void;
  possibleTargets: Character[];
  selectedActions: SelectedAction[];
  removeSelectedAction: (index: number) => void;
  handleAbilityClick?: (character: Character, ability: Ability) => void;
  playerActiveChakras?: ChakraType[];
  isPlayerTurn: boolean;
  isEnemy: boolean;
  getUsableAbilities?: (character: Character) => Ability[];
}

export const PlayerBoard: React.FC<PlayerBoardProps> = ({
  game,
  handleTargetClick,
  possibleTargets,
  selectedActions,
  removeSelectedAction,
  handleAbilityClick,
  playerActiveChakras,
  isPlayerTurn,
  isEnemy,
  getUsableAbilities,
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
      <div className={`character-info-container`}>
        {!isEnemy ? (
          <>
            <div
              className="character-stats-container"
              onClick={() => handleTargetClick(player, char)}
            >
              <CharacterNameComponent
                character={char}
                possibleTargets={possibleTargets}
              />
            </div>
            <SelectedAbility
              character={char}
              selectedActions={selectedActions}
              removeSelectedAction={removeSelectedAction}
            />
            <div className={`character-info-abilities-container player`}>
              <div className={`character-actions`}>
                <ActionsComponent
                  character={char}
                  selectedActions={selectedActions}
                  removeSelectedAction={removeSelectedAction}
                  isEnemy={false}
                />
              </div>
              <div className="character-effects">
                <ActiveEffects character={char} isEnemy={false} />
              </div>
              {handleAbilityClick && playerActiveChakras && (
                <Abilities
                  character={char}
                  activeChakras={playerActiveChakras}
                  selectedActions={selectedActions}
                  handleAbilityClick={handleAbilityClick}
                  isPlayerTurn={!isEnemy && isPlayerTurn}
                  usableAbilities={
                    getUsableAbilities
                      ? getUsableAbilities(char)
                      : char.abilities
                  }
                  isEnemy={isEnemy}
                />
              )}
            </div>
          </>
        ) : (
          <>
            <div className="character-info-abilities-container enemy">
              <div className="character-actions enemy">
                <ActionsComponent
                  character={char}
                  selectedActions={selectedActions}
                  removeSelectedAction={removeSelectedAction}
                  isEnemy={true}
                />
              </div>
              <div className="character-effects enemy">
                <ActiveEffects character={char} isEnemy={true} />
              </div>
            </div>
            <div className="character-name-box enemy">
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
