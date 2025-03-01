import "./BattleOptions.css";
import React from "react";

interface BattleOptionsProps {
  onSurrender?: () => void;
  onHistory?: () => void;
  onExample?: () => void;
}

export const BattleOptions: React.FC<BattleOptionsProps> = ({
  onSurrender,
  onHistory,
  onExample,
}) => {
  return (
    <div className="battle-options-container">
      <div className="battle-options-content">
        <div className="option-button-section">
          <button
            className="option-action-button surrender"
            onClick={onSurrender}
          >
            Surrender
          </button>
        </div>
        <div className="option-button-section">
          <button className="option-action-button" onClick={onHistory}>
            History
          </button>
        </div>
        <div className="option-button-section">
          <button className="option-action-button" onClick={onExample}>
            Example Button
          </button>
        </div>
      </div>
    </div>
  );
};

export default BattleOptions;
