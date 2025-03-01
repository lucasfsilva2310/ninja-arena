import "./AbilityDescriptionFooter.css";

import React, { useEffect, useState } from "react";

import { Ability } from "../../../models/ability.model";
import { Character } from "../../../models/character.model";

interface AbilityFooterProps {
  selectedCharacter: Character | null;
  currentSelectedAbility: Ability | null;
}

const getChakraColor = (chakraType: string): string => {
  switch (chakraType) {
    case "Taijutsu":
      return "#22c55e"; // Green
    case "Ninjutsu":
      return "#3b82f6"; // Blue
    case "Genjutsu":
      return "#ffffff"; // White
    case "Bloodline":
      return "#ef4444"; // Red
    case "Random":
      return "#000000"; // Black
    default:
      return "#94a3b8"; // Default gray
  }
};

const ChakraText = ({ chakra }: { chakra: string }) => (
  <span style={{ color: getChakraColor(chakra), fontWeight: "bold" }}>
    {chakra}
  </span>
);

const AbilityFooter: React.FC<AbilityFooterProps> = ({
  selectedCharacter,
  currentSelectedAbility,
}) => {
  useEffect(() => {
    if (selectedCharacter) {
      if (currentSelectedAbility) {
        setSelectedAbility(currentSelectedAbility);
      } else {
        setSelectedAbility(null);
      }
    }
  }, [selectedCharacter?.name, currentSelectedAbility?.name]);

  const [selectedAbility, setSelectedAbility] = useState<Ability | null>(
    currentSelectedAbility || null
  );

  const handleAbilityDescriptionClick = (ability: Ability) => {
    setSelectedAbility(ability);
  };

  if (!selectedCharacter)
    return (
      <div className="ability-footer">
        <div className="ability-preview-container empty">
          <p>Select a character or ability to see details</p>
        </div>
      </div>
    );

  return (
    <div className="ability-footer">
      <div className="ability-preview-container">
        <div className="abilities-list">
          {selectedCharacter.abilities.map((ability) => {
            return (
              <button
                key={ability.name}
                onClick={() => handleAbilityDescriptionClick(ability)}
                className={`ability-preview-button ${
                  selectedAbility?.name === ability.name ? "selected" : ""
                }`}
              >
                <img
                  src={`/abilities/${selectedCharacter.name
                    .split(" ")
                    .join("")
                    .toLowerCase()}/${ability.name
                    .split(" ")
                    .join("")
                    .toLowerCase()}.png`}
                  alt={ability.name}
                  className="ability-preview-icon"
                  onError={(e) => {
                    e.currentTarget.src = "/abilities/default.png";
                  }}
                />
              </button>
            );
          })}
        </div>

        {selectedAbility && (
          <div className="ability-description-container">
            <div className="ability-description-content">
              <div className="ability-image-container">
                <img
                  src={`/abilities/${selectedCharacter.name
                    .split(" ")
                    .join("")
                    .toLowerCase()}/${selectedAbility.name
                    .split(" ")
                    .join("")
                    .toLowerCase()}.png`}
                  alt={selectedAbility.name}
                  className="ability-image"
                  onError={(e) => {
                    e.currentTarget.src = "/abilities/default.png";
                  }}
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
                    <span className="ability-info-title">Cooldown:</span>{" "}
                    {selectedAbility.defaultCooldown} turns
                  </span>
                  <span className="ability-type">
                    <span className="ability-info-title">Target: </span>{" "}
                    {selectedAbility.target}
                  </span>
                  <span className="ability-chakra">
                    <span className="ability-info-title">Cost:</span>{" "}
                    {selectedAbility.requiredChakra.length} (
                    {selectedAbility.requiredChakra.map((chakra, index) => (
                      <React.Fragment key={index}>
                        {index > 0 && ", "}
                        <ChakraText chakra={chakra} />
                      </React.Fragment>
                    ))}
                    )
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AbilityFooter;
