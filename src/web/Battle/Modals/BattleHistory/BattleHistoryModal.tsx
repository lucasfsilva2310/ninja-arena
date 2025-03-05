import React from "react";
import "./BattleHistoryModal.css";

interface BattleHistoryModalProps {
  history: string[];
  onClose: () => void;
}

export default function BattleHistoryModal({
  history,
  onClose,
}: BattleHistoryModalProps) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Battle History</h2>
        <div className="history-container">
          {history.length > 0 ? (
            history.map((entry, index) => (
              <div key={index} className="history-entry">
                {entry}
              </div>
            ))
          ) : (
            <div className="no-history">No battle history yet.</div>
          )}
        </div>
        <div className="modal-actions">
          <button className="cancel-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
