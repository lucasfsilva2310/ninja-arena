import "./AvailableChakra.css";
import { ChakraType, chakraTypes } from "../../../models/chakra.model";
import { getChakraColor } from "../../../utils/getChakraColor";

export const AvailableChakra = ({
  activeChakras,
  selectedChakras,
  setChakraTransformModal,
}: {
  activeChakras: ChakraType[];
  selectedChakras: ChakraType[];
  setChakraTransformModal: (modal: boolean) => void;
}) => {
  const getChakraImage = (chakraType: string) => {
    return `/chakras/chakra-${chakraType.toLowerCase()}.png`;
  };

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
    const selectedCount = selectedChakras.filter(
      (c) => c === chakraType
    ).length;
    return activeCount; // We only want to show available chakras
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
                    e.currentTarget.src = "/chakras/chakra-default.png";
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
