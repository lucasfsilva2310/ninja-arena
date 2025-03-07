import "./Sprites.css";

import React, { useState, useEffect } from "react";

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
}

export const SpriteAnimator: React.FC<SpriteAnimatorProps> = ({
  characterName,
  isEnemy = false,
  abilityName = "idle",
  isDamaged = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Add debugging
  const [error, setError] = useState<string | null>(null);

  const speed = 150; //ms
  const width = 40;
  const height = 40;

  const characterNameLower = characterName
    .toLowerCase()
    .replace(/\s+/g, "") // Replace all spaces, not just the first one
    .trim();

  // Build image paths based on ability name
  let imagePaths = [];

  // If showing damage animation, use that instead of the ability
  if (isDamaged) {
    imagePaths = [
      `characters/${characterNameLower}/sprites/damage/${characterNameLower}-sprites-0.png`,
      `characters/${characterNameLower}/sprites/damage/${characterNameLower}-sprites-1.png`,
      `characters/${characterNameLower}/sprites/damage/${characterNameLower}-sprites-2.png`,
      `characters/${characterNameLower}/sprites/damage/${characterNameLower}-sprites-3.png`,
    ];
  } else {
    // Normal ability animation
    imagePaths = [
      `characters/${characterNameLower}/sprites/${abilityName}/${characterNameLower}-sprites-0.png`,
      `characters/${characterNameLower}/sprites/${abilityName}/${characterNameLower}-sprites-1.png`,
      `characters/${characterNameLower}/sprites/${abilityName}/${characterNameLower}-sprites-2.png`,
      `characters/${characterNameLower}/sprites/${abilityName}/${characterNameLower}-sprites-3.png`,
      `characters/${characterNameLower}/sprites/${abilityName}/${characterNameLower}-sprites-4.png`,
      `characters/${characterNameLower}/sprites/${abilityName}/${characterNameLower}-sprites-5.png`,
    ];

    // Add more frames for non-idle abilities
    if (abilityName !== "idle") {
      imagePaths.push(
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

  // Reset animation when props change
  useEffect(() => {
    setCurrentIndex(0);
  }, [abilityName, isDamaged, characterName]);

  // Animation loop
  useEffect(() => {
    if (!imagePaths || imagePaths.length === 0) {
      setError("No image paths available");
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
  }, [imagePaths.join(","), speed]); // Use a stable dependency

  // Function to handle image load errors
  const handleImageError = () => {
    setError(`Failed to load image: ${imagePaths[currentIndex]}`);
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
      {error && <div className="sprite-error">{error}</div>}
    </div>
  );
};
