import "./ActionsAndEffects.css";
import React from "react";
import { Character } from "../../../models/character.model";

interface ActiveEffectsProps {
  character: Character;
}

export const ActiveEffects: React.FC<ActiveEffectsProps> = ({ character }) => {
  // Group effects by ability name
  const groupedEffects = character.activeEffects.reduce((acc, effect) => {
    if (!acc[effect.name]) {
      acc[effect.name] = [];
    }
    acc[effect.name].push(effect);
    return acc;
  }, {} as Record<string, typeof character.activeEffects>);

  return (
    <div className="active-effects">
      {Object.entries(groupedEffects).map(([abilityName, effects]) => {
        // Get the longest duration among all effects for this ability
        const maxDuration = Math.max(
          ...effects.map(
            (effect) =>
              effect.damageReduction?.remainingTurns ||
              effect.buff?.remainingTurns ||
              effect.transformation?.remainingTurns ||
              0
          )
        );

        return (
          <div key={abilityName} className="effect-icon-container">
            <img
              src={`/abilities/${character.name
                .split(" ")
                .join("")
                .toLowerCase()}/${abilityName
                .split(" ")
                .join("")
                .toLowerCase()}.png`}
              alt={abilityName}
              className="effect-icon"
              onError={(e) => {
                e.currentTarget.src = "/abilities/default.png";
              }}
            />
            <div className="effect-tooltip">
              <h4>{abilityName}</h4>
              {effects.map((effect, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <hr className="effect-separator" />}
                  <p>{effect.description}</p>
                </React.Fragment>
              ))}
              {maxDuration > 0 && (
                <div className="effect-duration">
                  <span>
                    {maxDuration === 1
                      ? "1 turn remaining"
                      : `${maxDuration} turns remaining`}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
