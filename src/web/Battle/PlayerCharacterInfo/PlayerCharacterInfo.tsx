import "./CharacterInfo.css";
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

  const normalizedCharacterName = `${character.name
    .split(" ")
    .join("")
    .toLowerCase()}`;

  // Check if this character should use MP4
  const isVideoCharacter = normalizedCharacterName === "rocklee";

  const characterImagePath = `/characters/${normalizedCharacterName}/${normalizedCharacterName}.png`;
  const characterVideoPath = `/characters/${normalizedCharacterName}/${normalizedCharacterName}.mp4`;
  const characterDefaultImagePath = "/characters/default.png";
  const characterDeadImagePath = "/characters/dead.png";

  return (
    <div className="character-name-container">
      <div className="character-portrait">
        {isDeathAnimationComplete && character.hp <= 0 ? (
          <img
            src={characterDeadImagePath}
            alt={character.name}
            className="character-image"
          />
        ) : isVideoCharacter ? (
          <video
            src={characterVideoPath}
            className={`character-image ${
              character.hp <= 0 ? "character-dying" : ""
            }`}
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
            }`}
            onError={(e) => {
              // Fallback to default image if character image doesn't exist
              e.currentTarget.src = characterDefaultImagePath;
            }}
          />
        )}
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
