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

  // Set up initial animations (all idle)
  useEffect(() => {
    if (!isExecutingTurn) {
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
    }
  }, [isExecutingTurn]);

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

  // Handle turn execution
  useEffect(() => {
    console.log("handleTurnExecution", isExecutingTurn, selectedActions.length);
    if (isExecutingTurn && selectedActions.length > 0) {
      // Reset to start fresh
      // setAnimationPhase("idle");
      setCurrentActionIndex(0);
      setAnimationFrame(0);

      // Start the animation sequence after a short delay
      setAnimationPhase("executing");
      setDebugInfo(
        (prev) =>
          `${prev}\nStarting execution of ${selectedActions.length} actions`
      );
    }
  }, [isExecutingTurn, selectedActions]);

  // Handle animation phases
  useEffect(() => {
    console.log(
      "handleAnimationPhases",
      animationPhase,
      selectedActions.length
    );
    if (animationPhase === "idle" || selectedActions.length === 0) return;

    setDebugInfo(
      (prev) =>
        `${prev}\nAnimation phase: ${animationPhase}, Action index: ${currentActionIndex}`
    );

    if (currentActionIndex >= selectedActions.length) {
      setAnimationPhase("idle");
      setCurrentActionIndex(0);
      return;
    }

    const currentAction = selectedActions[currentActionIndex];
    // Normalize the character and target names from the current action
    const normalizedCharacterName = normalizeString(
      currentAction.character.name
    );
    const normalizedTargetName = normalizeString(currentAction.target.name);

    // Log the actual values to debug
    console.log("Current action:", {
      character: normalizedCharacterName,
      ability: normalizeString(currentAction.ability.name),
      target: normalizedTargetName,
      player: currentAction.player === game.player1 ? "player1" : "player2",
    });

    console.log("beforeExecuting", animationPhase);
    if (animationPhase === "executing") {
      // Update animation for the character executing the ability
      setCharacterAnimations((prev) => {
        // Log current animations for debugging
        console.log("Current animations before update:", prev);

        const newAnimations = prev.map((anim) => {
          // Simplified attacker matching logic
          const isAttacker =
            anim.characterName === normalizedCharacterName &&
            ((anim.isEnemy && currentAction.player === game.player2) ||
              (!anim.isEnemy && currentAction.player === game.player1));

          // Log matching attempt
          if (anim.characterName === normalizedCharacterName) {
            console.log("Found character match:", {
              animName: anim.characterName,
              animIsEnemy: anim.isEnemy,
              actionPlayer:
                currentAction.player === game.player1 ? "player1" : "player2",
              isMatch: isAttacker,
            });
          }

          return isAttacker
            ? {
                ...anim,
                abilityName: normalizeString(currentAction.ability.name),
              }
            : anim;
        });

        // Log animations after update
        console.log("New animations after update:", newAnimations);

        setDebugInfo(
          (prev) =>
            `${prev}\nCharacter ${normalizedCharacterName} using ${normalizeString(
              currentAction.ability.name
            )}`
        );
        return newAnimations;
      });

      // Set a timer to track animation frames for coordination
      const frameInterval = setInterval(() => {
        setAnimationFrame((prev) => {
          const nextFrame = prev + 1;
          setDebugInfo(
            (currentInfo) => `${currentInfo}\nAnimation frame: ${nextFrame}`
          );

          // At frame 8, trigger the target reaction
          if (nextFrame >= 8) {
            clearInterval(frameInterval);
            setAnimationPhase("reacting");
            setDebugInfo(
              (currentInfo) => `${currentInfo}\nTriggering damage reaction`
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
        // Log current animations
        console.log("Current animations before damage:", prev);

        const newAnimations = prev.map((anim) => {
          // Simplified target matching logic
          const isTarget =
            anim.characterName === normalizedTargetName &&
            ((anim.isEnemy && currentAction.player === game.player1) ||
              (!anim.isEnemy && currentAction.player === game.player2));

          // Log target match attempts
          if (anim.characterName === normalizedTargetName) {
            console.log("Found target match:", {
              animName: anim.characterName,
              animIsEnemy: anim.isEnemy,
              actionPlayer:
                currentAction.player === game.player1 ? "player1" : "player2",
              isMatch: isTarget,
            });
          }

          if (isTarget) {
            setDebugInfo(
              (currentInfo) =>
                `${currentInfo}\nTarget ${normalizedTargetName} taking damage`
            );
            return { ...anim, abilityName: "damage", isTarget: true };
          }
          return anim;
        });

        // Log animations after damage update
        console.log("New animations after damage:", newAnimations);

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

      setDebugInfo((prev) => `${prev}\nAction completed, resetting to idle`);

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
    return (
      characterAnimations.find(
        (anim) =>
          anim.characterName === normalizedName &&
          anim.isEnemy === isEnemy &&
          anim.index === index
      ) || {
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
        <div className="sprites-row">
          {game.player1.characters.map((char, index) => {
            const animation = getCharacterAnimation(char.name, false, index);
            console.log({
              key: `player1-sprite-${index}`,
              characterName: char.name,
              abilityName: animation.abilityName,
              isDamaged: animation.isTarget,
              isEnemy: false,
            });
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
        <div className="sprites-row">
          {game.player2.characters.map((char, index) => {
            const animation = getCharacterAnimation(char.name, true, index);
            console.log(characterAnimations);
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
