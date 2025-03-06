import "./Sprites.css";

import { GameEngine } from "../../../models/game-engine";
import { Sprite } from "./Sprite";

interface SpritesBoardProps {
  game: GameEngine;
}

export const SpritesBoard: React.FC<SpritesBoardProps> = ({ game }) => {
  return (
    <div className="sprites-board">
      <div className="sprites-arena">
        <div className="sprites-row">
          {game.player1.characters.map((char, index) => (
            <div key={`player1-sprite-${index}`} className="sprite-position">
              <Sprite characterName={char.name} />
            </div>
          ))}
        </div>
        <div className="sprites-row">
          {game.player2.characters.map((char, index) => (
            <div key={`player2-sprite-${index}`} className="sprite-position">
              <Sprite characterName={char.name} isEnemy />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
