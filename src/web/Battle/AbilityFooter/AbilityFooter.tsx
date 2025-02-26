import "./AbilityFooter.css";

import { Ability } from "../../../models/ability.model";
import { ChakraType } from "../../../models/chakra.model";
import { Character } from "../../../models/character.model";

interface AbilityFooterProps {
  selectedAbility: Ability | null;
  selectedCharacter: Character | null;
  onAbilityClick: (ability: Ability) => void;
  activeChakras: ChakraType[];
}

const AbilityFooter: React.FC<AbilityFooterProps> = ({
  selectedAbility,
  selectedCharacter,
  onAbilityClick,
  activeChakras,
}) => {
  if (!selectedCharacter && !selectedAbility) return null;

  return (
    <div className="ability-footer">
      {selectedCharacter && (
        <div className="character-abilities-list">
          {selectedCharacter.abilities.map((ability) => {
            const isAbilityDisabled = !ability.canUse(
              selectedCharacter,
              activeChakras
            );
            return (
              <button
                key={ability.name}
                onClick={() => onAbilityClick(ability)}
                disabled={isAbilityDisabled}
                className={`ability-button ${
                  selectedAbility === ability ? "ability-selected" : ""
                } ${isAbilityDisabled ? "ability-inactive" : "ability-active"}`}
              >
                {ability.name}
              </button>
            );
          })}
        </div>
      )}

      {selectedAbility && (
        <div className="ability-footer-content">
          <div className="ability-image-container">
            <img
              src={`/abilities/${selectedAbility.name.toLowerCase()}.png`}
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
      )}
    </div>
  );
};

export default AbilityFooter;
