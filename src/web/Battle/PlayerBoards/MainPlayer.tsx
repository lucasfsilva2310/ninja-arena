import "./Board.css";
import { Ability } from "../../../models/ability.model";
import { ChakraType } from "../../../models/chakra.model";
import { Character } from "../../../models/character.model";
import { GameEngine } from "../../../models/game-engine";
import { Player } from "../../../models/player.model";
import { SelectedAction } from "../Battle";
import { CurrentActions } from "../ActionsAndEffects/CurrentActions";
import { Abilities } from "../Abilities/Abilities";
import { ActiveEffects } from "../ActionsAndEffects/ActiveEffects";
import { PlayerCharacterName } from "../PlayerNames/PlayerCharacterName";

export const MainPlayer = ({
  game,
  handleTargetClick,
  possibleTargets,
  selectedActions,
  removeSelectedAction,
  handleAbilityClick,
  playerActiveChakras,
}: {
  game: GameEngine;
  handleTargetClick: (player: Player, target: Character) => void;
  possibleTargets: Character[];
  selectedActions: SelectedAction[];
  removeSelectedAction: (index: number) => void;
  handleAbilityClick: (character: Character, ability: Ability) => void;
  playerActiveChakras: ChakraType[];
}) => {
  return game.player1.characters.map((char, charIndex) => (
    <div className="character-card" key={char.name + charIndex}>
      <div className="character-info-container">
        <div className="character-name-box">
          <div
            className="character-actions"
            onClick={() => handleTargetClick(game.player1, char)}
          >
            <PlayerCharacterName
              character={char}
              possibleTargets={possibleTargets}
            />
          </div>
        </div>
        <div className="character-info-abilities-container">
          <div className="character-actions">
            <CurrentActions
              character={char}
              selectedActions={selectedActions}
              removeSelectedAction={removeSelectedAction}
            />
          </div>
          <div className="character-effects">
            <ActiveEffects character={char} />
          </div>
          <Abilities
            character={char}
            activeChakras={playerActiveChakras}
            selectedActions={selectedActions}
            handleAbilityClick={handleAbilityClick}
          />
        </div>
      </div>
    </div>
  ));
};
