import "./CharacterInfo.css";
import React, { useState, useEffect } from "react";
import { Character } from "../../../models/character.model";
import { HealthBar } from "../HealthBar/HealthBar";
import { getCharacterAvatar } from "../../../utils/getCharacterAvatar";
import { getCharacterDefaultAvatar } from "../../../utils/getCharacterDefaultAvatar";
import { getCharacterDeadAvatar } from "../../../utils/getCharacterDeadAvatar";

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

  const normalizedCharacterName = `${character.name
    .split(" ")
    .join("")
    .toLowerCase()}`;

  const characterImagePath = getCharacterAvatar(character);
  const characterDefaultImagePath = getCharacterDefaultAvatar();
  const characterDeadImagePath = getCharacterDeadAvatar();

  return (
    <div className="character-name-container">
      <div
        className={`character-portrait ${
          possibleTargets.includes(character) ? "character-possible-target" : ""
        }`}
      >
        {isDeathAnimationComplete && character.hp <= 0 ? (
          <img
            src={characterDeadImagePath}
            alt={character.name}
            className={`character-image ${
              possibleTargets.includes(character)
                ? "character-possible-target"
                : ""
            }`}
          />
        ) : (
          <img
            src={characterImagePath}
            alt={character.name}
            className={`character-image ${
              character.hp <= 0 ? "character-dying" : ""
            } ${
              possibleTargets.includes(character)
                ? "character-possible-target"
                : ""
            }`}
            onError={(e) => {
              e.currentTarget.src = characterDefaultImagePath;
            }}
          />
        )}
      </div>
      <div
        className={`character-details ${
          character.hp > 0 ? "character-alive" : "character-dead"
        } `}
      >
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
