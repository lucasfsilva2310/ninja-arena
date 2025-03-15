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

  // Check if this character should use MP4
  // TEMPORARY: Only Rocklee uses MP4
  const isVideoCharacter = normalizedCharacterName === "rocklee";

  const characterImagePath = getCharacterAvatar(character);
  const characterVideoPath = `/characters/${normalizedCharacterName}/avatar/${normalizedCharacterName}.mp4`;
  const characterDefaultImagePath = getCharacterDefaultAvatar();
  const characterDeadImagePath = getCharacterDeadAvatar();

  return (
    <div className="character-name-container">
      <div className="character-portrait">
        {isDeathAnimationComplete && character.hp <= 0 ? (
          <img
            src={characterDeadImagePath}
            alt={character.name}
            className={`character-image ${
              possibleTargets.includes(character) ? "character-selected" : ""
            }`}
          />
        ) : isVideoCharacter ? (
          <video
            src={characterVideoPath}
            className={`character-image ${
              character.hp <= 0 ? "character-dying" : ""
            } ${possibleTargets.includes(character) ? "character-selected" : ""}
            `}
            autoPlay
            loop
            muted
            playsInline
            onError={(e) => {
              // Create a fallback image element if video fails to load
              const imgElement = document.createElement("img");
              imgElement.src = characterDefaultImagePath;
              imgElement.alt = character.name;
              imgElement.className = `character-image ${
                character.hp <= 0 ? "character-dying" : ""
              }`;
              e.currentTarget.parentNode?.replaceChild(
                imgElement,
                e.currentTarget
              );
            }}
          />
        ) : (
          <img
            src={characterImagePath}
            alt={character.name}
            className={`character-image ${
              character.hp <= 0 ? "character-dying" : ""
            } ${possibleTargets.includes(character) ? "character-selected" : ""}
            `}
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
