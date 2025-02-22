import React, { useState } from "react";
import {
  ChakraType,
  chakraTypesWithoutRandom,
  initialChakraObj,
} from "../../models/chakra.model";

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

export default function Modal({
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
        <h2>{`Selecione ${requiredRandomCount} Chakra(s) para substituir "Random"`}</h2>
        <div className="chakra-options">
          {chakraTypesWithoutRandom.map((chakra) => (
            <div key={chakra} className="chakra-item">
              <span>
                {chakra}: {chakraCounts[chakra]}
              </span>
              <button
                onClick={() => handleAddChakra(chakra)}
                disabled={chakraCounts[chakra] === 0}
              >
                +
              </button>
              <button
                onClick={() => handleRemoveChakra(chakra)}
                disabled={!chakrasToSwitchFromRandom.includes(chakra)}
              >
                -
              </button>
            </div>
          ))}
        </div>
        <div className="selected-chakras">
          <h3>Total Selecionado: {chakrasToSwitchFromRandom.length}</h3>
        </div>
        <button
          onClick={handleConfirm}
          disabled={chakrasToSwitchFromRandom.length < requiredRandomCount}
        >
          Confirmar
        </button>
        <button className="modal-close-btn" onClick={onClose}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
