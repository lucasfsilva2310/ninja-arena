import { useEffect, useState, useRef } from "react";
import "./TurnTimer.css";

interface TurnTimerProps {
  isPlayerTurn: boolean;
  onTimeEnd: () => void;
  totalTime?: number;
  turnCount: number;
}

export const TurnTimer: React.FC<TurnTimerProps> = ({
  isPlayerTurn,
  onTimeEnd,
  totalTime = 60,
  turnCount,
}) => {
  const [timeLeft, setTimeLeft] = useState(totalTime);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevTurnCountRef = useRef(turnCount);

  // Set up timer when component mounts or when turnCount changes
  useEffect(() => {
    // Check if the turn has actually changed
    if (turnCount !== prevTurnCountRef.current) {
      prevTurnCountRef.current = turnCount;

      // Reset the timer
      setTimeLeft(totalTime);

      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // If no interval is running, start one
    if (!intervalRef.current) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Clear interval when timer hits zero
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            onTimeEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    // Cleanup on unmount or before next effect run
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [turnCount, totalTime, onTimeEnd]);

  // Calculate progress for the bar
  const progressPercentage = (timeLeft / totalTime) * 100;

  return (
    <div className="turn-timer-container">
      <div className="turn-indicator">
        {isPlayerTurn ? "Your turn..." : "Opponent's turn..."}
      </div>
      <div className="timer-bar-container">
        <div
          className="timer-bar-progress"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
};
