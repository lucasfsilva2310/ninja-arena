import "./ActionsAndEffects.css";
import React from "react";
import { Character } from "../../../models/character.model";
import { SelectedAction } from "../../../models/game-engine";

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
              className="effect-icon-container"
              onClick={() => removeSelectedAction(actionIndex)}
            >
              <img
                src={`/abilities/${action.attackerCharacter.name
                  .split(" ")
                  .join("")
                  .toLowerCase()}/${action.attackerAbility.name
                  .split(" ")
                  .join("")
                  .toLowerCase()}.png`}
                alt={action.attackerAbility.name}
                className="effect-icon"
                onError={(e) => {
                  e.currentTarget.src = "/abilities/default.png";
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
