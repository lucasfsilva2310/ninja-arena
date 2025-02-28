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
  return (
    <div className="chakra-container">
      <div className="chakra-inside-container">
        <h3 className="chakra-title">Available Chakras</h3>
        <div>
          {Object.entries(game.player1.getChakraCount()).map(
            ([chakra, count]) => (
              <span
                key={chakra}
                className="chakra-item"
                style={{
                  color: getChakraColor(chakra),
                  fontWeight: "bold",
                  borderColor: getChakraColor(chakra),
                }}
              >
                {chakra}:{" "}
                {count - selectedChakras.filter((c) => c === chakra).length}
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
