import "./ActionsAndEffects.css";
import React from "react";
import { Character } from "../../../models/character.model";
import { SelectedAction } from "../Battle";

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
          action.target === character && (
            <div
              key={actionIndex}
              className="effect-icon-container"
              onClick={() => removeSelectedAction(actionIndex)}
            >
              <img
                src={`/abilities/${action.character.name
                  .split(" ")
                  .join("")
                  .toLowerCase()}/${action.ability.name
                  .split(" ")
                  .join("")
                  .toLowerCase()}.png`}
                alt={action.ability.name}
                className="effect-icon"
                onError={(e) => {
                  e.currentTarget.src = "/abilities/default.png";
                }}
              />
              <div className="effect-tooltip">
                <h4>{action.ability.name}</h4>
                <p>{action.ability.description}</p>
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
