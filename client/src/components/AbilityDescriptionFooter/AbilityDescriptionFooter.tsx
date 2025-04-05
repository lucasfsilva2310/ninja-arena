import "./AbilityDescriptionFooter.css";

import React, { useEffect, useState } from "react";

import { Ability } from "../../models/ability/ability.model";
import { Character } from "../../models/character/character.model";
import { chakraTypes } from "../../models/chakra/chakra.model";
import { chakraColors } from "../../constants/chakra-colors";
import { getCharacterAbility } from "../../utils/getCharacterAbility";
import { getCharacterDefaultAbility } from "../../utils/getCharacterDefaultAbility";

interface AbilityFooterProps {
  selectedCharacter: Character | null;
  currentSelectedAbility: Ability | null;
  context?: "battle" | "character-selection";
}

const getChakraColor = (chakraType: string): string => {
  switch (chakraType) {
    case chakraTypes.Taijutsu:
      return chakraColors.GREEN;

    case chakraTypes.Ninjutsu:
      return chakraColors.BLUE;

    case chakraTypes.Genjutsu:
      return chakraColors.WHITE;

    case chakraTypes.Bloodline:
      return chakraColors.RED;

    case chakraTypes.Random:
      return chakraColors.BLACK;

    default:
      return chakraColors.BLACK;
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
  context = "battle",
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
      <div className={`ability-footer ${context}`}>
        <div className="ability-preview-container empty">
          <p>{`Select a character ${
            context === "character-selection" ? "" : "or ability"
          } to see details`}</p>
        </div>
      </div>
    );

  return (
    <div className={`ability-footer ${context}`}>
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
                  src={getCharacterAbility({
                    character: selectedCharacter,
                    ability,
                  })}
                  alt={ability.name}
                  className="ability-preview-icon"
                  onError={(e) => {
                    e.currentTarget.src = getCharacterDefaultAbility();
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
                  src={getCharacterAbility({
                    character: selectedCharacter,
                    ability: selectedAbility,
                  })}
                  alt={selectedAbility.name}
                  className="ability-image"
                  onError={(e) => {
                    e.currentTarget.src = getCharacterDefaultAbility();
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
