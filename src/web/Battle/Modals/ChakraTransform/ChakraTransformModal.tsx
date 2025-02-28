import { useState } from "react";
import {
  ChakraType,
  chakraTypesWithoutRandom,
  initialChakraObj,
} from "../../../../models/chakra.model";
import "./ChakraTransformModal.css";

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
        <h3>Eschange Chakra</h3>
        <p>Select exactly 5 chakras to transform:</p>
        <div className="chakra-selection">
          {chakraTypesWithoutRandom.map((chakra) => (
            <div key={chakra} className="chakra-item">
              <span>
                {chakra}: {chakraCounts[chakra]}
              </span>
              <button
                onClick={() => handleAddChakra(chakra)}
                disabled={
                  chakrasToRemove.length >= 5 || chakraCounts[chakra] === 0
                }
              >
                +
              </button>
              <button
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
        <p>Select the chakra to be formed:</p>
        <div className="chakra-target">
          {chakraTypesWithoutRandom.map((chakra) => (
            <button
              key={chakra}
              className={targetChakra === chakra ? "selected" : ""}
              onClick={() => setTargetChakra(chakra)}
            >
              {chakra}
            </button>
          ))}
        </div>
        <div className="modal-actions">
          <div>Total selected: {chakrasToRemove.length}</div>
          <button className="cancel-button" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="transform-button"
            onClick={handleTransform}
            disabled={chakrasToRemove.length !== 5 || !targetChakra}
          >
            Transform
          </button>
        </div>
      </div>
    </div>
  );
}
