import "./Abilities.css";
import React from "react";
import { Character } from "../../../models/character.model";
import { Ability } from "../../../models/ability.model";
import { ChakraType } from "../../../models/chakra.model";
import { getChakraColor } from "../../../utils/getChakraColor";
import { SelectedAction } from "../../../models/game-engine";

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

        return (
          <div
            key={ability.name}
            className={`ability-icon-container ${isEnemy ? "enemy" : "player"}`}
            onClick={() =>
              !isAbilityDisabled && handleAbilityClick(character, ability)
            }
          >
            <img
              src={`/abilities/${character.name
                .split(" ")
                .join("")
                .toLowerCase()}/${ability.name
                .split(" ")
                .join("")
                .toLowerCase()}.png`}
              alt={ability.name}
              className={`ability-icon ${
                isAbilityDisabled ? "ability-inactive" : "ability-active"
              }`}
              onError={(e) => {
                e.currentTarget.src = "/abilities/default.png";
              }}
            />
            {ability.currentCooldown > 0 && (
              <div className="ability-cooldown-overlay">
                {ability.currentCooldown}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
