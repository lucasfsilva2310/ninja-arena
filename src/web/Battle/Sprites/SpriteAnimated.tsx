import "./Sprites.css";

import React, { useState, useEffect, useMemo } from "react";
import { getSpritePaths } from "../../../config/animations/animations.config";

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
  isRecovering?: boolean;
  showDebug?: boolean;
}

export const SpriteAnimator: React.FC<SpriteAnimatorProps> = ({
  characterName,
  isEnemy = false,
  abilityName = "idle",
  isDamaged = false,
  isRecovering = false,
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
    .replace(/\s+/g, "")
    .trim();

  // Use useMemo to create stable image paths, now using the configuration
  const imagePaths = useMemo(() => {
    let paths: string[] = [];

    // Handle defeated state first
    if (abilityName === "defeated") {
      return [`characters/${characterNameLower}/sprites/defeated/defeated.png`];
    }

    // Get paths from config with new parameters
    const configPaths = getSpritePaths(
      characterName,
      abilityName,
      !isDamaged && !isRecovering,
      isDamaged,
      isRecovering
    );

    if (configPaths.length > 0) {
      paths = configPaths;
    } else {
      // Fallback to default pattern with variable length based on ability
      const frameCount = abilityName === "idle" ? 6 : 11;
      paths = Array.from(
        { length: frameCount },
        (_, i) =>
          `characters/${characterNameLower}/sprites/${abilityName}/${characterNameLower}-sprites-${i}.png`
      );
    }

    return paths;
  }, [characterNameLower, abilityName, isDamaged, isRecovering, characterName]);

  // Reset animation when props change
  useEffect(() => {
    setCurrentIndex(0);
  }, [abilityName, isDamaged, characterName]);

  // Animation loop - only run if not in defeated state
  useEffect(() => {
    if (!imagePaths || imagePaths.length === 0) {
      setError("No image paths available");
      debugLog(
        `No image paths available for ${characterName}, ability: ${abilityName}`
      );
      return;
    }

    // Don't animate if character is defeated
    if (abilityName === "defeated") {
      setCurrentIndex(0);
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
  }, [imagePaths, speed, characterName, abilityName, showDebug]);

  // Function to handle image load errors
  const handleImageError = () => {
    const errorMessage = `Failed to load image: ${imagePaths[currentIndex]}`;
    debugLog(errorMessage);
    setError(errorMessage);
  };

  return (
    <div
      className={`sprite-animator ${isDamaged ? "sprite-damaged" : ""} ${
        isRecovering ? "sprite-recovering" : ""
      }`}
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
