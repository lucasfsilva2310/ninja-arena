import "./ActionsAndEffects.css";
import React from "react";
import { Character } from "../../../models/character/character.model";
import { SelectedAction } from "../../../models/game-engine";
import { getCharacterDefaultAbility } from "../../../utils/getCharacterDefaultAbility";
import { getCharacterAbility } from "../../../utils/getCharacterAbility";

interface CurrentActionsProps {
  character: Character;
  selectedActions: SelectedAction[];
  removeSelectedAction: (index: number) => void;
  isEnemy?: boolean;
}

export const CurrentActions: React.FC<CurrentActionsProps> = ({
  character,
  selectedActions,
  removeSelectedAction,
  isEnemy = false,
}) => {
  return (
    <div className="current-actions">
      {selectedActions.map(
        (action, actionIndex) =>
          action.targetCharacter === character && (
            <div
              key={action.attackerAbility.name + actionIndex}
              className={`effect-icon-container ${
                isEnemy ? "enemy" : "player"
              }`}
              onClick={() => removeSelectedAction(actionIndex)}
            >
              <img
                src={getCharacterAbility({
                  character: action.attackerCharacter,
                  ability: action.attackerAbility,
                })}
                alt={action.attackerAbility.name}
                className="effect-icon"
                onError={(e) => {
                  e.currentTarget.src = getCharacterDefaultAbility();
                }}
              />
              <div className="effect-tooltip">
                <h4>{action.attackerAbility.name}</h4>
                <p>{action.attackerAbility.description}</p>
                <div className="effect-duration">
                  <span>Will be applied this turn</span>
                </div>
              </div>
            </div>
          )
      )}
    </div>
  );
};
