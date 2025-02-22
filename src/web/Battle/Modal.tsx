import React, { useState } from "react";
import {
  ChakraType,
  chakraTypesWithoutRandom,
  initialChakraObj,
} from "../../models/chakra.model";

interface ModalProps {
  availableChakras: ChakraType[];
  requiredRandomCount: number;
  selectedChakras: ChakraType[];
  setSelectedChakras: React.Dispatch<React.SetStateAction<ChakraType[]>>;
  onConfirm: (selectedChakras: ChakraType[]) => void;
  onClose: () => void;
}

export default function Modal({
  availableChakras,
  requiredRandomCount,
  selectedChakras,
  setSelectedChakras,
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
      selectedChakras.length < requiredRandomCount &&
      chakraCounts[chakra] > 0
    ) {
      setSelectedChakras([...selectedChakras, chakra]);
      setChakraCounts((prev) => ({ ...prev, [chakra]: prev[chakra] - 1 }));
    }
  };

  const handleRemoveChakra = (chakra: ChakraType) => {
    const index = selectedChakras.lastIndexOf(chakra);
    if (index !== -1) {
      const newSelectedChakras = [...selectedChakras];
      newSelectedChakras.splice(index, 1);
      setSelectedChakras(newSelectedChakras);
      setChakraCounts((prev) => ({ ...prev, [chakra]: prev[chakra] + 1 }));
    }
  };

  const handleConfirm = () => {
    if (selectedChakras.length === requiredRandomCount) {
      onConfirm(selectedChakras);
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
                disabled={!selectedChakras.includes(chakra)}
              >
                -
              </button>
            </div>
          ))}
        </div>
        <div className="selected-chakras">
          <h3>Total Selecionado: {selectedChakras.length}</h3>
        </div>
        <button
          onClick={handleConfirm}
          disabled={selectedChakras.length < requiredRandomCount}
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
