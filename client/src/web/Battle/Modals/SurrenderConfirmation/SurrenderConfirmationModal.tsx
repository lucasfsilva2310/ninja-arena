import React from "react";
import "./SurrenderConfirmationModal.css";

interface SurrenderConfirmationModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export default function SurrenderConfirmationModal({
  onConfirm,
  onCancel,
}: SurrenderConfirmationModalProps) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Are you sure?</h2>
        <p>Do you really want to surrender this battle?</p>
        <div className="modal-actions">
          <button className="confirm-button" onClick={onConfirm}>
            Yes
          </button>
          <button className="cancel-button" onClick={onCancel}>
            No
          </button>
        </div>
      </div>
    </div>
  );
}
