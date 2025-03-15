import "./ActionsAndEffects.css";
import React from "react";
import { Character } from "../../../models/character.model";
import { SelectedAction } from "../../../models/game-engine";
import { getCharacterDefaultAbility } from "../../../utils/getCharacterDefaultAbility";
import { getCharacterAbility } from "../../../utils/getCharacterAbility";

interface CurrentActionsOnEnemyProps {
  character: Character;
  selectedActions: SelectedAction[];
  removeSelectedAction: (index: number) => void;
}

export const CurrentActionsOnEnemy: React.FC<CurrentActionsOnEnemyProps> = ({
  character,
  selectedActions,
  removeSelectedAction,
}) => {
  return (
    <div className="current-actions">
      {selectedActions.map(
        (action, actionIndex) =>
          action.targetCharacter === character && (
            <div
              key={actionIndex}
              className="effect-icon-container enemy"
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
