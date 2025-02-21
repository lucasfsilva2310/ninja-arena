import React, { useState } from "react";
import { ChakraType } from "../../models/chakra.model";

interface ModalProps {
  availableChakras: ChakraType[];
  requiredRandomCount: number;
  onConfirm: (selectedChakras: ChakraType[]) => void;
  onClose: () => void;
}

export default function Modal({
  availableChakras,
  requiredRandomCount,
  onConfirm,
  onClose,
}: ModalProps) {
  const [selectedChakras, setSelectedChakras] = useState<ChakraType[]>([]);

  const handleChakraSelection = (chakra: ChakraType) => {
    if (selectedChakras.length < requiredRandomCount) {
      setSelectedChakras([...selectedChakras, chakra]);
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
        <h2>Selecione o Chakra para substituir "Random"</h2>
        <div className="chakra-options">
          {availableChakras.map((chakra, index) => (
            <button
              key={index}
              onClick={() => handleChakraSelection(chakra)}
              disabled={selectedChakras.includes(chakra)}
            >
              {chakra}
            </button>
          ))}
        </div>
        <div className="selected-chakras">
          <h3>Selecionado:</h3>
          {selectedChakras.map((chakra, index) => (
            <span key={index}>{chakra}</span>
          ))}
        </div>
        <button
          onClick={handleConfirm}
          disabled={selectedChakras.length < requiredRandomCount}
        >
          Confirmar
        </button>
        <button
          className="modal-close-btn modal-close-btn:hover"
          onClick={onClose}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
