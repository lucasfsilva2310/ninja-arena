import React from "react";
import { Character } from "../../../models/character.model";
import { SelectedAction } from "../../../models/game-engine";
import { getCharacterAbility } from "../../../utils/getCharacterAbility";
import { getCharacterDefaultAbility } from "../../../utils/getCharacterDefaultAbility";
import "./SelectedAbility.css";

interface SelectedAbilityProps {
  character: Character;
  selectedActions: SelectedAction[];
  removeSelectedAction: (index: number) => void;
}

export const SelectedAbility: React.FC<SelectedAbilityProps> = ({
  character,
  selectedActions,
  removeSelectedAction,
}) => {
  // Find the action where this character is the attacker
  const characterAction = selectedActions.find(
    (action) => action.attackerCharacter === character
  );

  return (
    <div className="selected-ability-container">
      {characterAction ? (
        <div
          className="selected-ability-icon-container"
          onClick={() => {
            const actionIndex = selectedActions.findIndex(
              (action) => action === characterAction
            );
            if (actionIndex !== -1) {
              removeSelectedAction(actionIndex);
            }
          }}
        >
          <img
            src={getCharacterAbility({
              character: characterAction.attackerCharacter,
              ability: characterAction.attackerAbility,
            })}
            alt={characterAction.attackerAbility.name}
            className="selected-ability-icon"
            onError={(e) => {
              e.currentTarget.src = getCharacterDefaultAbility();
            }}
          />
          <div className="selected-ability-tooltip">
            <h4>{characterAction.attackerAbility.name}</h4>
            <p>{characterAction.attackerAbility.description}</p>
            <div className="selected-ability-duration">
              <span>Will be applied this turn</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="selected-ability-empty" />
      )}
    </div>
  );
};
