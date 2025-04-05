import "./ActionsAndEffects.css";
import React from "react";
import { Character } from "../../../models/character/character.model";
import { getCharacterAbility } from "../../../utils/getCharacterAbility";
import { getCharacterDefaultAbility } from "../../../utils/getCharacterDefaultAbility";

interface ActiveEffectsProps {
  character: Character;
  isEnemy?: boolean;
}

export const ActiveEffects: React.FC<ActiveEffectsProps> = ({
  character,
  isEnemy = false,
}) => {
  // Group effects by ability
  const groupedEffects = character.activeEffects.reduce((acc, effect) => {
    acc[effect.name] = acc[effect.name] || [];
    acc[effect.name].push(effect);
    return acc;
  }, {} as Record<string, typeof character.activeEffects>);

  return (
    <div className={`active-effects ${isEnemy ? "enemy" : ""}`}>
      {Object.entries(groupedEffects).map(([abilityName, effects]) => {
        // Get the longest duration among all effects for this ability
        const maxDuration = effects.reduce((max, effect) => {
          const duration =
            effect.damageReduction?.remainingTurns ||
            effect.buff?.remainingTurns ||
            effect.transformation?.remainingTurns ||
            0;
          return Math.max(max, duration);
        }, 0);

        return (
          <div
            key={abilityName}
            className={`effect-icon-container ${isEnemy ? "enemy" : "player"}`}
          >
            <img
              src={getCharacterAbility({ character, abilityName })}
              alt={abilityName}
              className="effect-icon"
              onError={(e) => {
                e.currentTarget.src = getCharacterDefaultAbility();
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
