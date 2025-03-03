import "./PlayerNames.css";
import React from "react";
import { Character } from "../../../models/character.model";
import { HealthBar } from "../HealthBar/HealthBar";

interface PlayerCharacterNameProps {
  character: Character;
  possibleTargets: Character[];
}

export const PlayerCharacterName: React.FC<PlayerCharacterNameProps> = ({
  character,
  possibleTargets,
}) => {
  return (
    <div className="character-name-container">
      <div className="character-portrait">
        <img
          src={`/characters/${character.name
            .split(" ")
            .join("")
            .toLowerCase()}/${character.name
            .split(" ")
            .join("")
            .toLowerCase()}.png`}
          alt={character.name}
          className="character-image"
          onError={(e) => {
            // Fallback to default image if character image doesn't exist
            e.currentTarget.src = "/characters/default.png";
          }}
        />
      </div>
      <div className="character-details">
        <h4
          className={`character-name ${
            character.hp > 0 ? "character-alive" : "character-dead"
          } ${possibleTargets.includes(character) ? "character-selected" : ""}`}
        >
          {character.name}
        </h4>
        <HealthBar currentHP={character.hp} />
      </div>
    </div>
  );
};
