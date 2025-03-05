import "./PlayerCharacterInfo.css";
import React, { useState, useEffect } from "react";
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
  const [isDeathAnimationComplete, setIsDeathAnimationComplete] =
    useState(false);

  useEffect(() => {
    if (character.hp > 0) {
      setIsDeathAnimationComplete(false);
    }
  }, [character.hp]);

  const characterImagePath = `/characters/${character.name
    .split(" ")
    .join("")
    .toLowerCase()}/${character.name.split(" ").join("").toLowerCase()}.png`;

  const characterDefaultImagePath = "/characters/default.png";
  const characterDeadImagePath = "/characters/dead.png";

  return (
    <div className="character-name-container">
      <div className="character-portrait">
        <img
          src={
            isDeathAnimationComplete && character.hp <= 0
              ? characterDeadImagePath
              : characterImagePath
          }
          alt={character.name}
          className={`character-image ${
            character.hp <= 0 ? "character-dying" : ""
          }`}
          onError={(e) => {
            // Fallback to default image if character image doesn't exist
            e.currentTarget.src = characterDefaultImagePath;
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
        <HealthBar
          currentHP={character.hp}
          onAnimationComplete={() => {
            if (character.hp <= 0) {
              setIsDeathAnimationComplete(true);
            }
          }}
        />
      </div>
    </div>
  );
};
