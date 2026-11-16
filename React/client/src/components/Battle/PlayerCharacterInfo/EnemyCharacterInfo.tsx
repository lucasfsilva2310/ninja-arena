import "./CharacterInfo.css";
import React, { useState, useEffect } from "react";
import { Character } from "../../../models/character/character.model";
import { HealthBar } from "../HealthBar/HealthBar";
import { getCharacterAvatar } from "../../../utils/getCharacterAvatar";
import { getCharacterDefaultAvatar } from "../../../utils/getCharacterDefaultAvatar";
import { getCharacterDeadAvatar } from "../../../utils/getCharacterDeadAvatar";

interface EnemyCharacterNameProps {
  character: Character;
  possibleTargets: Character[];
}

export const EnemyCharacterName: React.FC<EnemyCharacterNameProps> = ({
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

  const characterImagePath = getCharacterAvatar(character);

  const characterDefaultImagePath = getCharacterDefaultAvatar();
  const characterDeadImagePath = getCharacterDeadAvatar();

  return (
    <div className="character-name-container enemy">
      <div
        className={`character-portrait enemy ${
          possibleTargets.includes(character) ? "character-possible-target" : ""
        }`}
      >
        <img
          src={
            isDeathAnimationComplete && character.hp <= 0
              ? characterDeadImagePath
              : characterImagePath
          }
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
      </div>
      <div
        className={`character-details ${
          character.hp > 0 ? "character-alive" : "character-dead"
        } }`}
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
