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
}

export const SpriteAnimator: React.FC<SpriteAnimatorProps> = ({
  characterName,
  isEnemy = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1); // 1 for forward, -1 for backward

  const speed = 150; //ms
  const width = 40;
  const height = 40;

  const characterNameLower = characterName
    .toLowerCase()
    .replace(" ", "")
    .trim();

  const images = [
    `characters/${characterNameLower}/sprites/idle/${characterNameLower}-sprites_0-0.png`,
    `characters/${characterNameLower}/sprites/idle/${characterNameLower}-sprites_0-1.png`,
    `characters/${characterNameLower}/sprites/idle/${characterNameLower}-sprites_0-2.png`,
    `characters/${characterNameLower}/sprites/idle/${characterNameLower}-sprites_0-3.png`,
    `characters/${characterNameLower}/sprites/idle/${characterNameLower}-sprites_0-4.png`,
    `characters/${characterNameLower}/sprites/idle/${characterNameLower}-sprites_0-5.png`,
  ];
  console.log(characterNameLower === "rocklee" && images);

  useEffect(() => {
    if (!images || images.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        let nextIndex = prevIndex + direction;

        // If we've reached the end, reverse direction
        if (nextIndex >= images.length - 1) {
          setDirection(-1);
          return images.length - 1;
        }

        // If we've reached the beginning, reverse direction
        if (nextIndex <= 0) {
          setDirection(1);
          return 0;
        }

        return nextIndex;
      });
    }, speed);

    return () => clearInterval(interval);
  }, [images, speed, direction]);

  return (
    <img
      className={`${isEnemy ? "sprite-enemy" : "sprite-ally"} sprite-image`}
      src={images[currentIndex]}
      alt={`Sprite frame ${currentIndex + 1}`}
      style={{ ...styles.image, width, height }}
    />
  );
};
