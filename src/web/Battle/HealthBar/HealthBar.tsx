import { healthColors } from "../../../constants/health-colors";
import "./HealthBar.css";
import React, { useEffect, useState } from "react";

interface HealthBarProps {
  currentHP: number;
  maxHP?: number;
  onAnimationComplete?: () => void;
}

export const HealthBar: React.FC<HealthBarProps> = ({
  currentHP,
  maxHP = 100,
  onAnimationComplete,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [width, setWidth] = useState(currentHP);

  useEffect(() => {
    setIsAnimating(true);
    setWidth(currentHP);

    const animationTimer = setTimeout(() => {
      setIsAnimating(false);
      if (currentHP <= 0 && onAnimationComplete) {
        onAnimationComplete();
      }
    }, 1000);

    return () => clearTimeout(animationTimer);
  }, [currentHP, onAnimationComplete]);

  const getHealthColor = () => {
    if (currentHP > 66) return healthColors.GREEN;
    if (currentHP > 33) return healthColors.YELLOW;
    return healthColors.RED;
  };

  return (
    <div className="health-bar-container">
      <div
        className={`health-bar ${isAnimating ? "animating" : ""}`}
        style={{
          width: `${width}%`,
          backgroundColor: getHealthColor(),
        }}
      />
      <span className="health-text">{`${currentHP}/${maxHP}`}</span>
    </div>
  );
};
