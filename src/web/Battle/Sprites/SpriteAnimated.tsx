import "./Sprites.css";

import React, { useState, useEffect, useMemo } from "react";

const styles = {
  image: {
    objectFit: "contain" as const,
    display: "block",
  },
};

interface SpriteAnimatorProps {
  characterName: string;
  isEnemy?: boolean;
  abilityName?: string;
  isDamaged?: boolean;
  showDebug?: boolean;
}

export const SpriteAnimator: React.FC<SpriteAnimatorProps> = ({
  characterName,
  isEnemy = false,
  abilityName = "idle",
  isDamaged = false,
  showDebug = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Add debugging
  const [error, setError] = useState<string | null>(null);

  // Debug utility function
  const debugLog = (message: string) => {
    if (showDebug) {
      console.log(message);
    }
  };

  const speed = 150; //ms
  const width = 60;
  const height = 60;

  const characterNameLower = characterName
    .toLowerCase()
    .replace(/\s+/g, "") // Replace all spaces, not just the first one
    .trim();

  // Use useMemo to create stable image paths
  const imagePaths = useMemo(() => {
    let paths = [];

    // If showing damage animation, use that instead of the ability
    if (isDamaged) {
      paths = [
        `characters/${characterNameLower}/sprites/damage/${characterNameLower}-sprites-0.png`,
        `characters/${characterNameLower}/sprites/damage/${characterNameLower}-sprites-1.png`,
        `characters/${characterNameLower}/sprites/damage/${characterNameLower}-sprites-2.png`,
        `characters/${characterNameLower}/sprites/damage/${characterNameLower}-sprites-3.png`,
        `characters/${characterNameLower}/sprites/damage/${characterNameLower}-sprites-4.png`,
        `characters/${characterNameLower}/sprites/damage/${characterNameLower}-sprites-5.png`,
        `characters/${characterNameLower}/sprites/damage/${characterNameLower}-sprites-6.png`,
        `characters/${characterNameLower}/sprites/damage/${characterNameLower}-sprites-7.png`,
        `characters/${characterNameLower}/sprites/damage/${characterNameLower}-sprites-8.png`,
        `characters/${characterNameLower}/sprites/damage/${characterNameLower}-sprites-9.png`,
        `characters/${characterNameLower}/sprites/damage/${characterNameLower}-sprites-10.png`,
      ];
    } else {
      // Normal ability animation
      paths = [
        `characters/${characterNameLower}/sprites/${abilityName}/${characterNameLower}-sprites-0.png`,
        `characters/${characterNameLower}/sprites/${abilityName}/${characterNameLower}-sprites-1.png`,
        `characters/${characterNameLower}/sprites/${abilityName}/${characterNameLower}-sprites-2.png`,
        `characters/${characterNameLower}/sprites/${abilityName}/${characterNameLower}-sprites-3.png`,
        `characters/${characterNameLower}/sprites/${abilityName}/${characterNameLower}-sprites-4.png`,
        `characters/${characterNameLower}/sprites/${abilityName}/${characterNameLower}-sprites-5.png`,
      ];

      // Add more frames for non-idle abilities
      if (abilityName !== "idle") {
        paths.push(
          ...[
            `characters/${characterNameLower}/sprites/${abilityName}/${characterNameLower}-sprites-6.png`,
            `characters/${characterNameLower}/sprites/${abilityName}/${characterNameLower}-sprites-7.png`,
            `characters/${characterNameLower}/sprites/${abilityName}/${characterNameLower}-sprites-8.png`,
            `characters/${characterNameLower}/sprites/${abilityName}/${characterNameLower}-sprites-9.png`,
            `characters/${characterNameLower}/sprites/${abilityName}/${characterNameLower}-sprites-10.png`,
          ]
        );
      }
    }

    return paths;
  }, [characterNameLower, abilityName, isDamaged]);

  // Reset animation when props change
  useEffect(() => {
    setCurrentIndex(0);
  }, [abilityName, isDamaged, characterName]);

  // Animation loop
  useEffect(() => {
    if (!imagePaths || imagePaths.length === 0) {
      setError("No image paths available");
      debugLog(
        `No image paths available for ${characterName}, ability: ${abilityName}`
      );
      return;
    }

    // Force start at first frame
    setCurrentIndex(0);

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        // Simple forward animation without bouncing back
        const nextIndex = (prevIndex + 1) % imagePaths.length;
        return nextIndex;
      });
    }, speed);

    return () => clearInterval(interval);
  }, [imagePaths, speed, characterName, abilityName, showDebug]); // Removed the join operation

  // Function to handle image load errors
  const handleImageError = () => {
    const errorMessage = `Failed to load image: ${imagePaths[currentIndex]}`;
    debugLog(errorMessage);
    setError(errorMessage);
  };

  return (
    <div
      className={`sprite-animator ${isDamaged ? "sprite-damaged" : ""}`}
      data-ability={abilityName}
    >
      <img
        className={`${isEnemy ? "sprite-enemy" : "sprite-ally"} sprite-image`}
        src={imagePaths[currentIndex]}
        alt={`${characterName} sprite frame ${currentIndex + 1}`}
        style={{ ...styles.image, width, height }}
        onError={handleImageError}
      />
      {showDebug && error && <div className="sprite-error">{error}</div>}
    </div>
  );
};
