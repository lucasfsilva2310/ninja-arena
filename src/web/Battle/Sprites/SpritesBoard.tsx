import "./Sprites.css";
import { useState, useEffect, useRef } from "react";
import { GameEngine } from "../../../models/game-engine";
import { SpriteAnimator } from "./SpriteAnimated";
import { SelectedAction } from "../Battle";

interface SpritesBoardProps {
  game: GameEngine;
  selectedActions?: SelectedAction[];
  isExecutingTurn?: boolean;
  showDebug?: boolean;
}

// Animation phases for action sequence
type AnimationPhase = "idle" | "executing" | "reacting" | "completed";

// Track individual character animations
interface CharacterAnimation {
  characterName: string;
  isEnemy: boolean;
  abilityName: string;
  index: number;
  isTarget: boolean;
}

// Helper function to normalize strings for comparison
const normalizeString = (str: string): string => {
  return str.toLowerCase().replace(/\s+/g, "").trim();
};

export const SpritesBoard: React.FC<SpritesBoardProps> = ({
  game,
  selectedActions = [],
  isExecutingTurn = false,
  showDebug = false,
}) => {
  // Add debug information
  const [debugInfo, setDebugInfo] = useState<string>("");
  const lastExecutingTurn = useRef(isExecutingTurn);
  const previousSelectedActions = useRef(selectedActions);

  // Track current animations for all characters
  const [characterAnimations, setCharacterAnimations] = useState<
    CharacterAnimation[]
  >([]);
  // Track which action is currently being executed
  const [currentActionIndex, setCurrentActionIndex] = useState(0);
  // Track the current phase of animation
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>("idle");
  // Track animation frame for coordinating effects
  const [animationFrame, setAnimationFrame] = useState(0);

  // Track if animations have been initialized
  const initialized = useRef(false);
  // Set up initial animations (all idle)
  useEffect(() => {
    if (!initialized.current) {
      // Only run on first mount to avoid resetting animations
      const initialAnimations: CharacterAnimation[] = [
        ...game.player1.characters.map((char, index) => ({
          characterName: normalizeString(char.name),
          isEnemy: false,
          abilityName: "idle",
          index,
          isTarget: false,
        })),
        ...game.player2.characters.map((char, index) => ({
          characterName: normalizeString(char.name),
          isEnemy: true,
          abilityName: "idle",
          index,
          isTarget: false,
        })),
      ];
      setCharacterAnimations(initialAnimations);
      setDebugInfo("Initial animations set");
      initialized.current = true;
    }
  }, [game]);

  // Debug selectedActions and isExecutingTurn changes
  useEffect(() => {
    if (
      JSON.stringify(previousSelectedActions.current) !==
      JSON.stringify(selectedActions)
    ) {
      setDebugInfo(
        (prev) =>
          `${prev}\nSelected actions changed: ${selectedActions.length} actions`
      );
      previousSelectedActions.current = selectedActions;
    }

    if (lastExecutingTurn.current !== isExecutingTurn) {
      setDebugInfo(
        (prev) => `${prev}\nisExecutingTurn changed: ${isExecutingTurn}`
      );
      lastExecutingTurn.current = isExecutingTurn;
    }
  }, [selectedActions, isExecutingTurn]);

  // Reset animations to idle when not executing turn
  useEffect(() => {
    if (!isExecutingTurn && animationPhase !== "idle") {
      setAnimationPhase("idle");
      setCharacterAnimations((prev) =>
        prev.map((anim) => ({
          ...anim,
          abilityName: "idle",
          isTarget: false,
        }))
      );
      setDebugInfo((prev) => `${prev}\nReset to idle state`);
    }
  }, [isExecutingTurn, animationPhase]);

  // Handle turn execution - CRITICAL ANIMATION TRIGGER
  useEffect(() => {
    if (isExecutingTurn && selectedActions.length > 0) {
      // Reset to start fresh
      setCurrentActionIndex(0);
      setAnimationFrame(0);

      // Start the animation sequence immediately
      setAnimationPhase("executing");
      setDebugInfo(
        (prev) =>
          `${prev}\nStarting execution of ${selectedActions.length} actions`
      );
    }
  }, [isExecutingTurn, selectedActions]);

  // Handle animation phases - MAIN ANIMATION LOGIC
  useEffect(() => {
    // Don't proceed if we're idle or have no actions
    if (animationPhase === "idle" || selectedActions.length === 0) return;

    // Check if we've reached the end of all actions
    if (currentActionIndex >= selectedActions.length) {
      setAnimationPhase("idle");
      setCurrentActionIndex(0);
      setDebugInfo((prev) => `${prev}\nCompleted all actions`);
      return;
    }

    const currentAction = selectedActions[currentActionIndex];

    // Safety check
    if (
      !currentAction ||
      !currentAction.character ||
      !currentAction.target ||
      !currentAction.ability
    ) {
      console.error("Invalid action data", currentAction);
      setAnimationPhase("idle");
      return;
    }

    // Normalize the character and target names from the current action
    const normalizedCharacterName = normalizeString(
      currentAction.character.name
    );
    const normalizedTargetName = normalizeString(currentAction.target.name);
    const normalizedAbilityName = normalizeString(currentAction.ability.name);

    // Determine which player is attacking and which is being targeted
    // Position of the player is inverted because selectedActions are from the perspective of the attacking player
    const targetPlayer = currentAction.player;
    const attackingPlayer =
      targetPlayer === game.player1 ? game.player2 : game.player1;

    console.log("Action detailed info:", {
      phase: animationPhase,
      attacker: normalizedCharacterName,
      attackingPlayer: attackingPlayer === game.player1 ? "player1" : "player2",
      ability: normalizedAbilityName,
      target: normalizedTargetName,
      targetPlayer: targetPlayer === game.player1 ? "player1" : "player2",
    });

    if (animationPhase === "executing") {
      // Update animation for the character executing the ability
      setCharacterAnimations((prev) => {
        const newAnimations = prev.map((anim) => {
          // COMPLETE REWRITE: Clear matching logic for the attacker

          // First determine which player this animation character belongs to
          const animationPlayer = anim.isEnemy ? game.player2 : game.player1;

          // The character is an attacker if:
          // 1. Its name matches the attacker's name AND
          // 2. It belongs to the attacking player
          const isAttacker =
            anim.characterName === normalizedCharacterName &&
            animationPlayer === attackingPlayer;

          if (isAttacker) {
            console.log(
              `CORRECT MATCH - Found attacker: ${anim.characterName} (${
                anim.isEnemy ? "enemy" : "ally"
              }), setting ability to ${normalizedAbilityName}`
            );
            return {
              ...anim,
              abilityName: normalizedAbilityName,
              isTarget: false,
            };
          }

          return anim;
        });

        return newAnimations;
      });

      // Set a timer to track animation frames
      const frameInterval = setInterval(() => {
        setAnimationFrame((prev) => {
          const nextFrame = prev + 1;

          // At frame 8, trigger the target reaction
          if (nextFrame >= 8) {
            clearInterval(frameInterval);
            setAnimationPhase("reacting");
            setDebugInfo(
              (currentInfo) =>
                `${currentInfo}\nTriggering damage reaction for ${normalizedTargetName}`
            );
            return 0;
          }
          return nextFrame;
        });
      }, 150); // Same speed as the animation in SpriteAnimated

      return () => clearInterval(frameInterval);
    }

    if (animationPhase === "reacting") {
      // Update animation for the target character to show damage
      setCharacterAnimations((prev) => {
        const newAnimations = prev.map((anim) => {
          // COMPLETE REWRITE: Clear matching logic for the target

          // First determine which player this animation character belongs to
          const animationPlayer = anim.isEnemy ? game.player2 : game.player1;

          // The character is a target if:
          // 1. Its name matches the target's name AND
          // 2. It belongs to the target player
          const isTarget =
            anim.characterName === normalizedTargetName &&
            animationPlayer === targetPlayer;

          if (isTarget) {
            console.log(
              `CORRECT MATCH - Found target: ${anim.characterName} (${
                anim.isEnemy ? "enemy" : "ally"
              }), setting damage animation`
            );
            return {
              ...anim,
              abilityName: "damage",
              isTarget: true,
            };
          }
          return anim;
        });

        return newAnimations;
      });

      // Set a timer for damage animation duration
      const damageTimer = setTimeout(() => {
        setAnimationPhase("completed");
        setDebugInfo((prev) => `${prev}\nDamage animation completed`);
      }, 800); // Duration of damage animation

      return () => clearTimeout(damageTimer);
    }

    if (animationPhase === "completed") {
      // Reset characters to idle
      setCharacterAnimations((prev) =>
        prev.map((anim) => ({
          ...anim,
          abilityName: "idle",
          isTarget: false,
        }))
      );

      // Move to the next action or complete the sequence
      setTimeout(() => {
        if (currentActionIndex < selectedActions.length - 1) {
          setCurrentActionIndex((prev) => prev + 1);
          setAnimationPhase("executing");
          setDebugInfo(
            (prev) =>
              `${prev}\nMoving to next action: ${currentActionIndex + 1}`
          );
        } else {
          // All actions completed
          setAnimationPhase("idle");
          setCurrentActionIndex(0);
          setDebugInfo((prev) => `${prev}\nAll actions completed`);
        }
      }, 500); // Slight delay between actions
    }
  }, [animationPhase, currentActionIndex, selectedActions, game]);

  // Find the animation for a specific character
  const getCharacterAnimation = (
    characterName: string,
    isEnemy: boolean,
    index: number
  ) => {
    const normalizedName = normalizeString(characterName);

    // Log each lookup attempt for debugging
    console.log(
      `Looking for animation: ${normalizedName}, isEnemy=${isEnemy}, index=${index}`
    );

    const animation = characterAnimations.find(
      (anim) =>
        anim.characterName === normalizedName &&
        anim.isEnemy === isEnemy &&
        anim.index === index
    );

    if (!animation) {
      console.warn(
        `No animation found for: ${normalizedName}, isEnemy=${isEnemy}, index=${index}`
      );
    } else {
      console.log(
        `Found animation: ${animation.abilityName} for ${normalizedName}`
      );
    }

    return (
      animation || {
        characterName: normalizedName,
        isEnemy,
        abilityName: "idle",
        index,
        isTarget: false,
      }
    );
  };

  return (
    <div className="sprites-board">
      <div className="sprites-arena">
        <div className="sprites-row asd ">
          {game.player1.characters.map((char, index) => {
            const animation = getCharacterAnimation(char.name, false, index);
            return (
              <SpriteAnimator
                key={`player1-sprite-${index}`}
                characterName={char.name}
                isEnemy={false}
                abilityName={animation.abilityName}
                isDamaged={animation.isTarget}
              />
            );
          })}
        </div>
        <div className="sprites-row dsa">
          {game.player2.characters.map((char, index) => {
            const animation = getCharacterAnimation(char.name, true, index);
            return (
              <SpriteAnimator
                key={`player2-sprite-${index}`}
                characterName={char.name}
                isEnemy={true}
                abilityName={animation.abilityName}
                isDamaged={animation.isTarget}
              />
            );
          })}
        </div>
      </div>
      {showDebug && (
        <div
          className="debug-info"
          style={{
            fontSize: "10px",
            background: "#f0f0f0",
            padding: "5px",
            whiteSpace: "pre-wrap",
          }}
        >
          <strong>Debug Info:</strong>
          <br />
          Animation Phase: {animationPhase}
          <br />
          Current Action: {currentActionIndex}/{selectedActions.length}
          <br />
          Animation Frame: {animationFrame}
          <br />
          {debugInfo}
        </div>
      )}
    </div>
  );
};
