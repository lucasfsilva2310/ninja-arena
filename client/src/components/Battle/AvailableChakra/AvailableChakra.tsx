import "./AvailableChakra.css";
import { ChakraType, chakraTypes } from "../../../models/chakra/chakra.model";
import { getChakraColor } from "../../../utils/getChakraColor";
import { getDefaultChakra } from "../../../utils/getDefaultChakra";
import { getChakraImage } from "../../../utils/getChakraImage";

export const AvailableChakra = ({
  activeChakras,
  setChakraTransformModal,
}: {
  activeChakras: ChakraType[];
  setChakraTransformModal: (modal: boolean) => void;
}) => {
  // Define all chakra types to ensure they all appear
  const allChakraTypes: ChakraType[] = [
    chakraTypes.Ninjutsu,
    chakraTypes.Taijutsu,
    chakraTypes.Genjutsu,
    chakraTypes.Bloodline,
  ];

  // Count active chakras by type
  const getChakraCount = (chakraType: ChakraType): number => {
    const activeCount = activeChakras.filter((c) => c === chakraType).length;
    return activeCount;
  };

  return (
    <div className="chakra-container">
      <div className="chakra-inside-container">
        <h3 className="chakra-title">Available Chakras</h3>
        <div className="chakra-list">
          {allChakraTypes.map((chakraType) => (
            <span
              key={chakraType}
              className="chakra-item"
              style={{
                borderColor: getChakraColor(chakraType),
              }}
            >
              <div className="chakra-image-container">
                <img
                  src={getChakraImage(chakraType)}
                  alt={`${chakraType} chakra`}
                  className="chakra-image"
                  onError={(e) => {
                    e.currentTarget.src = getDefaultChakra();
                  }}
                />
              </div>
              <span
                className="chakra-count"
                style={{ color: getChakraColor(chakraType) }}
              >
                {getChakraCount(chakraType)}
              </span>
            </span>
          ))}
        </div>
        <button
          onClick={() => setChakraTransformModal(true)}
          disabled={activeChakras.length < 5}
          className="chakra-transform-button"
        >
          Exchange Chakra
        </button>
      </div>
    </div>
  );
};
