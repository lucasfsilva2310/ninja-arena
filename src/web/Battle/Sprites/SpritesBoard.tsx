import "./Sprites.css";

import { GameEngine } from "../../../models/game-engine";
import { SpriteAnimator } from "./SpriteAnimated";

interface SpritesBoardProps {
  game: GameEngine;
}

export const SpritesBoard: React.FC<SpritesBoardProps> = ({ game }) => {
  return (
    <div className="sprites-board">
      <div className="sprites-arena">
        <div className="sprites-row">
          {game.player1.characters.map((char, index) => (
            <SpriteAnimator
              key={`player1-sprite-${index}`}
              characterName={char.name}
              isEnemy={false}
            />
          ))}
        </div>
        <div className="sprites-row">
          {game.player2.characters.map((char, index) => (
            <SpriteAnimator
              key={`player2-sprite-${index}`}
              characterName={char.name}
              isEnemy={true}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
