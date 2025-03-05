import "./AvailableChakra.css";
import { ChakraType } from "../../../models/chakra.model";
import { GameEngine } from "../../../models/game-engine";
import { getChakraColor } from "../../../utils/getChakraColor";

export const AvailableChakra = ({
  game,
  activeChakras,
  selectedChakras,
  setChakraTransformModal,
}: {
  game: GameEngine;
  activeChakras: ChakraType[];
  selectedChakras: ChakraType[];
  setChakraTransformModal: (modal: boolean) => void;
}) => {
  const getChakraImage = (chakraType: string) => {
    return `/chakras/chakra-${chakraType.toLowerCase()}.png`;
  };

  return (
    <div className="chakra-container">
      <div className="chakra-inside-container">
        <h3 className="chakra-title">Available Chakras</h3>
        <div className="chakra-list">
          {Object.entries(game.player1.getChakraCount()).map(
            ([chakra, count]) => (
              <span
                key={chakra}
                className="chakra-item"
                style={{
                  borderColor: getChakraColor(chakra),
                }}
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
                  {count - selectedChakras.filter((c) => c === chakra).length}
                </span>
              </span>
            )
          )}
        </div>
        <button
          onClick={() => setChakraTransformModal(true)}
          disabled={activeChakras.length < 5}
        >
          Exchange Chakra
        </button>
      </div>
    </div>
  );
};
