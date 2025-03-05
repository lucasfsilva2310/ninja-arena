import React, { useState } from "react";
import {
  ChakraType,
  chakraTypesWithoutRandom,
  initialChakraObj,
} from "../../../../models/chakra.model";
import "./ExchangeRandomChakraFinalModal.css";
import { getChakraColor } from "../../../../utils/getChakraColor";

interface ModalProps {
  availableChakras: ChakraType[];
  requiredRandomCount: number;
  chakrasToSwitchFromRandom: ChakraType[];
  setChakrasToSwitchFromRandom: React.Dispatch<
    React.SetStateAction<ChakraType[]>
  >;
  onConfirm: (chakrasToSwitchFromRandom: ChakraType[]) => void;
  onClose: () => void;
}

export default function ExchangeRandomChakraFinalModal({
  availableChakras,
  requiredRandomCount,
  chakrasToSwitchFromRandom,
  setChakrasToSwitchFromRandom,
  onConfirm,
  onClose,
}: ModalProps) {
  const [chakraCounts, setChakraCounts] = useState<Record<ChakraType, number>>(
    chakraTypesWithoutRandom.reduce((acc, chakra) => {
      acc[chakra] = availableChakras.filter((c) => c === chakra).length;
      return acc;
    }, initialChakraObj as Record<ChakraType, number>)
  );

  const getChakraImage = (chakraType: string) => {
    return `/chakras/chakra-${chakraType.toLowerCase()}.png`;
  };

  const handleAddChakra = (chakra: ChakraType) => {
    if (
      chakrasToSwitchFromRandom.length < requiredRandomCount &&
      chakraCounts[chakra] > 0
    ) {
      setChakrasToSwitchFromRandom([...chakrasToSwitchFromRandom, chakra]);
      setChakraCounts((prev) => ({ ...prev, [chakra]: prev[chakra] - 1 }));
    }
  };

  const handleRemoveChakra = (chakra: ChakraType) => {
    const index = chakrasToSwitchFromRandom.lastIndexOf(chakra);
    if (index !== -1) {
      const newchakrasToSwitchFromRandom = [...chakrasToSwitchFromRandom];
      newchakrasToSwitchFromRandom.splice(index, 1);
      setChakrasToSwitchFromRandom(newchakrasToSwitchFromRandom);
      setChakraCounts((prev) => ({ ...prev, [chakra]: prev[chakra] + 1 }));
    }
  };

  const handleConfirm = () => {
    if (chakrasToSwitchFromRandom.length === requiredRandomCount) {
      onConfirm(chakrasToSwitchFromRandom);
      onClose();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{`Select ${requiredRandomCount} Chakra(s) to exchange with "Random"`}</h2>
        <div className="chakra-options">
          {chakraTypesWithoutRandom.map((chakra) => (
            <div
              key={chakra}
              className="chakra-item"
              style={{ borderColor: getChakraColor(chakra) }}
            >
              <div className="chakra-image-container">
                <img
                  src={getChakraImage(chakra)}
                  alt={`${chakra} chakra`}
                  className="chakra-image"
                  onError={(e) => {
                    e.currentTarget.src = "/chakras/chakra-default.png";
                  }}
                />
              </div>
              <span
                className="chakra-count"
                style={{ color: getChakraColor(chakra) }}
              >
                {chakraCounts[chakra]}
              </span>
              <button
                className="chakra-action-btn"
                onClick={() => handleAddChakra(chakra)}
                disabled={chakraCounts[chakra] === 0}
              >
                +
              </button>
              <button
                className="chakra-action-btn"
                onClick={() => handleRemoveChakra(chakra)}
                disabled={!chakrasToSwitchFromRandom.includes(chakra)}
              >
                -
              </button>
            </div>
          ))}
        </div>
        <div className="selected-chakras">
          <h3>Selected Chakras</h3>
          <div className="chakra-list">
            {chakrasToSwitchFromRandom.map((chakra, index) => (
              <div
                key={index}
                className="chakra-item"
                style={{ borderColor: getChakraColor(chakra) }}
              >
                <div className="chakra-image-container">
                  <img
                    src={getChakraImage(chakra)}
                    alt={`${chakra} chakra`}
                    className="chakra-image"
                    onError={(e) => {
                      e.currentTarget.src = "/chakras/chakra-default.png";
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <h3>
            Total Selected: {chakrasToSwitchFromRandom.length}/
            {requiredRandomCount}
          </h3>
        </div>
        <div className="modal-actions">
          <button
            className="confirm-button"
            onClick={handleConfirm}
            disabled={chakrasToSwitchFromRandom.length < requiredRandomCount}
          >
            Confirm
          </button>
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
