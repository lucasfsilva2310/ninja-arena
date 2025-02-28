import React, { useState, useEffect, useRef } from "react";
import "./HealthBar.css";

interface HealthBarProps {
  currentHP: number;
  maxHP?: number;
}

export const HealthBar: React.FC<HealthBarProps> = ({
  currentHP,
  maxHP = 100,
}) => {
  const [displayHP, setDisplayHP] = useState(currentHP);
  const [isAnimating, setIsAnimating] = useState(false);
  const previousHP = useRef(currentHP);
  const animationFrameRef = useRef<number>(null);

  const getHealthColor = (hp: number) => {
    const percentage = (hp / maxHP) * 100;
    if (percentage >= 50) return "#22c55e"; // green
    if (percentage >= 25) return "#eab308"; // yellow
    return "#ef4444"; // red
  };

  useEffect(() => {
    if (currentHP !== previousHP.current) {
      setIsAnimating(true);
      const startHP = previousHP.current;
      const endHP = currentHP;
      const duration = 1000; // 1 second animation
      const startTime = performance.now();

      const animateHealth = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);

        const currentValue = Math.round(
          startHP + (endHP - startHP) * easeOutQuart
        );

        setDisplayHP(currentValue);

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animateHealth);
        } else {
          setIsAnimating(false);
          previousHP.current = currentHP;
        }
      };

      animationFrameRef.current = requestAnimationFrame(animateHealth);

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [currentHP, maxHP]);

  const percentage = (displayHP / maxHP) * 100;

  return (
    <div className="health-bar-container">
      <div
        className={`health-bar ${isAnimating ? "animating" : ""}`}
        style={{
          width: `${percentage}%`,
          backgroundColor: getHealthColor(displayHP),
        }}
      />
      <span className="health-text">
        {displayHP}/{maxHP}
      </span>
    </div>
  );
};
