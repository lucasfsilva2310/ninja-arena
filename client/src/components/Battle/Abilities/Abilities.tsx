import "./Abilities.css";
import React from "react";
import { Character } from "../../../models/character/character.model";
import { Ability } from "../../../models/ability/ability.model";
import { ChakraType } from "../../../models/chakra/chakra.model";
import { SelectedAction } from "../../../models/game-engine";
import { getCharacterAbility } from "../../../utils/getCharacterAbility";
import { getCharacterDefaultAbility } from "../../../utils/getCharacterDefaultAbility";

interface AbilitiesProps {
  character: Character;
  activeChakras: ChakraType[];
  selectedActions: SelectedAction[];
  handleAbilityClick: (character: Character, ability: Ability) => void;
  isPlayerTurn?: boolean;
  usableAbilities?: Ability[];
  isEnemy?: boolean;
}

export const Abilities: React.FC<AbilitiesProps> = ({
  character,
  activeChakras,
  selectedActions,
  handleAbilityClick,
  isPlayerTurn = true,
  usableAbilities,
  isEnemy = false,
}) => {
  // Helper function to check if an ability needs an enabler that isn't active
  const needsInactiveEnabler = (ability: Ability): boolean => {
    // Check if any effect has a needsEnabler property
    const needsEnablerEffect = ability.effects.find(
      (effect) => effect.needsEnabler
    );

    if (needsEnablerEffect) {
      const enablerName = needsEnablerEffect.needsEnabler;
      // Check if the character has an active effect that enables this ability
      const isEnabled = character.activeEffects.some(
        (effect) =>
          effect.name === enablerName ||
          (effect.enabledAbilities &&
            effect.enabledAbilities.abilityNames.includes(ability.name))
      );

      return !isEnabled;
    }

    return false;
  };

  return (
    <div className="abilities-container">
      {character.abilities.map((ability) => {
        const isInUsableAbilities =
          !usableAbilities || usableAbilities.includes(ability);

        const isAbilityDisabled =
          !isPlayerTurn ||
          !ability.canUse(character, activeChakras) ||
          selectedActions.some(
            (action) => action.attackerCharacter === character
          ) ||
          ability.isOnCooldown() ||
          !isInUsableAbilities;

        const isLocked = needsInactiveEnabler(ability);

        return (
          <div
            key={ability.name}
            className={`ability-icon-container ${isEnemy ? "enemy" : "player"}`}
            onClick={() =>
              !isAbilityDisabled && handleAbilityClick(character, ability)
            }
          >
            <img
              src={getCharacterAbility({ character, ability })}
              alt={ability.name}
              className={`ability-icon ${
                isAbilityDisabled ? "ability-inactive" : "ability-active"
              }`}
              onError={(e) => {
                e.currentTarget.src = getCharacterDefaultAbility();
              }}
            />
            {ability.currentCooldown > 0 && (
              <div className="ability-cooldown-overlay">
                {ability.currentCooldown}
              </div>
            )}
            {isLocked && (
              <div className="ability-cooldown-overlay">
                <img
                  src="/assets/lock-icon.png"
                  alt="Locked"
                  style={{
                    width: "20px",
                    height: "20px",
                    objectFit: "contain",
                  }}
                  onError={(e) => {
                    // If lock icon not found, display a text lock symbol
                    e.currentTarget.outerHTML = "🔒";
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
