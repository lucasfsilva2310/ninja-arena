import "./PlayerInfo.css";
import React from "react";

interface PlayerInfoProps {
  name: string;
  rank: string;
  avatar: string;
  isEnemy?: boolean;
}

export const PlayerInfo: React.FC<PlayerInfoProps> = ({
  name,
  rank,
  avatar,
  isEnemy = false,
}) => {
  return (
    <div className={`player-info-container ${isEnemy ? "enemy" : ""}`}>
      {!isEnemy && (
        <div className="player-text-info">
          <h3 className="player-name">{name}</h3>
          <span className="player-rank">{rank}</span>
        </div>
      )}
      <div className="player-avatar">
        <img src={avatar} alt={`${name}'s avatar`} />
      </div>
      {isEnemy && (
        <div className="player-text-info">
          <h3 className="player-name">{name}</h3>
          <span className="player-rank">{rank}</span>
        </div>
      )}
    </div>
  );
};
