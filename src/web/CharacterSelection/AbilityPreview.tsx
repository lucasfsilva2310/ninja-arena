import React from "react";
import { Ability } from "../../models/ability.model";
import { Character } from "../../models/character.model";

interface AbilityPreviewProps {
  character: Character | null;
  selectedAbility: Ability | null;
  onAbilityClick: (ability: Ability) => void;
}

const AbilityPreview: React.FC<AbilityPreviewProps> = ({
  character,
  selectedAbility,
  onAbilityClick,
}) => {
  if (!character) return null;
  return (
    <div className="ability-preview-container">
      <h4>{character.name}</h4>
      <div className="abilities-list">
        {character.baseAbilities.map((ability) => (
          <button
            key={ability.name}
            onClick={() => onAbilityClick(ability)}
            className={`ability-preview-button ${
              selectedAbility === ability ? "selected" : ""
            }`}
          >
            <img
              src={`../abilities/${character.name
                .split(" ")
                .join("")
                .toLowerCase()}/${ability.name
                .split(" ")
                .join("")
                .toLowerCase()}.png`}
              alt={ability.name}
              className="ability-preview-icon"
            />
          </button>
        ))}
      </div>

      {selectedAbility && (
        <div className="ability-description-container">
          <div className="ability-description-content">
            <div className="ability-image-container">
              <img
                src={`../abilities/${character.name
                  .split(" ")
                  .join("")
                  .toLowerCase()}/${selectedAbility.name
                  .split(" ")
                  .join("")
                  .toLowerCase()}.png`}
                alt={selectedAbility.name}
                className="ability-image"
              />
            </div>
            <div className="ability-info">
              <div className="ability-header">
                <h3 className="ability-name">{selectedAbility.name}</h3>
                <p className="ability-description">
                  {selectedAbility.description}
                </p>
              </div>
              <div className="ability-details">
                <span className="ability-cooldown">
                  Cooldown: {selectedAbility.defaultCooldown} turns
                </span>
                <span className="ability-type">
                  Target: {selectedAbility.target}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AbilityPreview;
