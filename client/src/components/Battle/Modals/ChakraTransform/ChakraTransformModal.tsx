import { useState } from "react";
import {
  ChakraType,
  chakraTypesWithoutRandom,
  initialChakraObj,
} from "../../../../models/chakra.model";
import "./ChakraTransformModal.css";
import { getChakraColor } from "../../../../utils/getChakraColor";

interface ChakraTransformModalProps {
  availableChakras: ChakraType[];
  onTransform: (
    selectedChakras: ChakraType[],
    targetChakra: ChakraType
  ) => void;
  onClose: () => void;
}
export default function ChakraTransformModal({
  availableChakras,
  onTransform,
  onClose,
}: ChakraTransformModalProps) {
  const [chakraCounts, setChakraCounts] = useState<Record<ChakraType, number>>(
    chakraTypesWithoutRandom.reduce((acc, chakra) => {
      acc[chakra] = availableChakras.filter((c) => c === chakra).length;
      return acc;
    }, initialChakraObj as Record<ChakraType, number>)
  );

  const [chakrasToRemove, setChakrasToRemove] = useState<ChakraType[]>([]);
  const [targetChakra, setTargetChakra] = useState<ChakraType | null>(null);

  const getChakraImage = (chakraType: string) => {
    return `/chakras/chakra-${chakraType.toLowerCase()}.png`;
  };

  const handleAddChakra = (chakra: ChakraType) => {
    if (chakrasToRemove.length < 5 && chakraCounts[chakra] > 0) {
      setChakrasToRemove((prev) => [...prev, chakra]);
      setChakraCounts((prev) => ({ ...prev, [chakra]: prev[chakra] - 1 }));
    }
  };

  const handleRemoveChakra = (chakra: ChakraType) => {
    const index = chakrasToRemove.lastIndexOf(chakra);
    if (index !== -1) {
      const newChakras = [...chakrasToRemove];
      newChakras.splice(index, 1);
      setChakrasToRemove(newChakras);
      setChakraCounts((prev) => ({ ...prev, [chakra]: prev[chakra] + 1 }));
    }
  };

  const handleTransform = () => {
    if (chakrasToRemove.length === 5 && targetChakra) {
      onTransform(chakrasToRemove, targetChakra);
      onClose();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Exchange Chakra</h3>
        <p>Select exactly 5 chakras to transform:</p>
        <div className="chakra-selection">
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
                disabled={
                  chakrasToRemove.length >= 5 || chakraCounts[chakra] === 0
                }
              >
                +
              </button>
              <button
                className="chakra-action-btn"
                onClick={() => handleRemoveChakra(chakra)}
                disabled={
                  !chakrasToRemove.includes(chakra) ||
                  chakrasToRemove.length === 0
                }
              >
                -
              </button>
            </div>
          ))}
        </div>

        <div className="selected-chakras">
          <h3>Selected Chakras:</h3>
          <div className="chakra-list">
            {chakrasToRemove.map((chakra, index) => (
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
        </div>

        <p>Select the chakra to be formed:</p>
        <div className="chakra-target">
          {chakraTypesWithoutRandom.map((chakra) => (
            <div
              key={chakra}
              className={`chakra-target-option ${
                targetChakra === chakra ? "selected" : ""
              }`}
              onClick={() => setTargetChakra(chakra)}
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

        <div className="modal-actions">
          <div>Total selected: {chakrasToRemove.length}/5</div>
          <div>
            <button
              className="transform-button"
              onClick={handleTransform}
              disabled={chakrasToRemove.length !== 5 || !targetChakra}
            >
              Transform
            </button>
            <button className="cancel-button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
