import "./Sprites.css";
import { useState, useEffect, useRef } from "react";
import { GameEngine, SelectedAction } from "../../../models/game-engine";
import { SpriteAnimator } from "./SpriteAnimated";

interface SpritesBoardProps {
  game: GameEngine;
  selectedActions: SelectedAction[];
  isExecutingTurn: boolean;
  showDebug?: boolean;
  onActionAnimationComplete?: (actionIndex: number) => void; // Callback when an action animation completes
  onAllAnimationsComplete?: () => void; // Callback when all animations complete
  currentActionIndex: number; // Track which action is currently being animated
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
  onActionAnimationComplete,
  onAllAnimationsComplete,
  currentActionIndex = 0,
}) => {
  // Add debug information
  const [debugInfo, setDebugInfo] = useState<string>("");
  const lastExecutingTurn = useRef(isExecutingTurn);
  const previousSelectedActions = useRef(selectedActions);

  // Add a tracking ref to prevent re-animating the same action
  const processedActionIndices = useRef<number[]>([]);
  // Add a flag to track if all animations are completed
  const hasNotifiedCompletion = useRef(false);

  // Debugging utility functions
  const debugLog = (message: string) => {
    if (showDebug) {
      console.log(message);
    }
  };

  const debugWarn = (message: string) => {
    if (showDebug) {
      console.warn(message);
    }
  };

  const debugError = (message: string) => {
    // Always log errors, but could be conditionally controlled too
    console.error(message);
  };

  // Track current animations for all characters
  const [characterAnimations, setCharacterAnimations] = useState<
    CharacterAnimation[]
  >([]);

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

      // Reset processed actions when execution state changes
      if (isExecutingTurn) {
        processedActionIndices.current = [];
        hasNotifiedCompletion.current = false;
      }
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
    // Important: Only trigger animation if we haven't processed this action yet
    if (
      isExecutingTurn &&
      selectedActions.length > 0 &&
      animationPhase === "idle" &&
      currentActionIndex < selectedActions.length &&
      !processedActionIndices.current.includes(currentActionIndex)
    ) {
      // Start the animation sequence
      setAnimationPhase("executing");
      setAnimationFrame(0);
      setDebugInfo(
        (prev) =>
          `${prev}\nStarting execution of action ${currentActionIndex + 1}/${
            selectedActions.length
          }`
      );
    }
  }, [isExecutingTurn, selectedActions, animationPhase, currentActionIndex]);

  // Handle animation phases - MAIN ANIMATION LOGIC
  useEffect(() => {
    // Don't proceed if we're idle or have no actions
    if (
      animationPhase === "idle" ||
      selectedActions.length === 0 ||
      currentActionIndex >= selectedActions.length
    )
      return;

    const currentAction = selectedActions[currentActionIndex];

    // Safety check
    if (
      !currentAction ||
      !currentAction.attackerCharacter ||
      !currentAction.targetCharacter ||
      !currentAction.attackerAbility
    ) {
      debugError("Invalid action data" + JSON.stringify(currentAction));
      setAnimationPhase("idle");
      return;
    }

    // Normalize the character and target names from the current action
    const normalizedCharacterName = normalizeString(
      currentAction.attackerCharacter.name
    );
    const normalizedTargetName = normalizeString(
      currentAction.targetCharacter.name
    );
    const normalizedAbilityName = normalizeString(
      currentAction.attackerAbility.name
    );

    // Determine which player is attacking and which is being targeted
    const attackerPlayer = currentAction.attackerPlayer;
    const targetPlayer = currentAction.targetPlayer;

    debugLog(
      "Action detailed info:" +
        JSON.stringify({
          phase: animationPhase,
          attacker: normalizedCharacterName,
          attackingPlayer:
            attackerPlayer === game.player1 ? "player1" : "player2",
          ability: normalizedAbilityName,
          target: normalizedTargetName,
          targetPlayer: targetPlayer === game.player1 ? "player1" : "player2",
        })
    );

    if (animationPhase === "executing") {
      // Update animation for the character executing the ability
      setCharacterAnimations((prev) => {
        const newAnimations = prev.map((anim) => {
          // First determine which player this animation character belongs to
          const animationPlayer = anim.isEnemy ? game.player2 : game.player1;

          // The character is an attacker if:
          // 1. Its name matches the attacker's name AND
          // 2. It belongs to the attacking player
          const isAttacker =
            anim.characterName === normalizedCharacterName &&
            animationPlayer === attackerPlayer;

          if (isAttacker) {
            debugLog(
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
      // Important: Add this action to processed list to prevent re-animation
      if (!processedActionIndices.current.includes(currentActionIndex)) {
        processedActionIndices.current.push(currentActionIndex);

        // This is the moment to trigger the actual ability effect in the game
        // Notify the parent component that it's time to apply the current action's effect
        onActionAnimationComplete &&
          onActionAnimationComplete(currentActionIndex);
      }

      // Update animation for the target character to show damage
      setCharacterAnimations((prev) => {
        const newAnimations = prev.map((anim) => {
          // First determine which player this animation character belongs to
          const animationPlayer = anim.isEnemy ? game.player2 : game.player1;

          // The character is a target if:
          // 1. Its name matches the target's name AND
          // 2. It belongs to the target player
          const isTarget =
            anim.characterName === normalizedTargetName &&
            animationPlayer === targetPlayer;

          if (isTarget) {
            debugLog(
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

      // Animation for current action is complete - reset to idle state for next action
      setAnimationPhase("idle");

      // Notify parent that all animations are complete if this was the last action
      if (
        currentActionIndex === selectedActions.length - 1 &&
        !hasNotifiedCompletion.current &&
        processedActionIndices.current.length === selectedActions.length
      ) {
        hasNotifiedCompletion.current = true;
        onAllAnimationsComplete && onAllAnimationsComplete();
        setDebugInfo((prev) => `${prev}\nAll actions completed`);
      }
    }
  }, [
    animationPhase,
    currentActionIndex,
    selectedActions,
    game,
    showDebug,
    onActionAnimationComplete,
    onAllAnimationsComplete,
  ]);

  // Find the animation for a specific character
  const getCharacterAnimation = (
    characterName: string,
    isEnemy: boolean,
    index: number
  ) => {
    const normalizedName = normalizeString(characterName);

    // Log each lookup attempt for debugging
    debugLog(
      `Looking for animation: ${normalizedName}, isEnemy=${isEnemy}, index=${index}`
    );

    const animation = characterAnimations.find(
      (anim) =>
        anim.characterName === normalizedName &&
        anim.isEnemy === isEnemy &&
        anim.index === index
    );

    if (!animation) {
      debugWarn(
        `No animation found for: ${normalizedName}, isEnemy=${isEnemy}, index=${index}`
      );
    } else {
      debugLog(
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
                showDebug={showDebug}
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
                showDebug={showDebug}
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
          Current Action: {currentActionIndex + 1}/{selectedActions.length}
          <br />
          Processed Actions: {processedActionIndices.current.join(", ")}
          <br />
          Animation Frame: {animationFrame}
          <br />
          {debugInfo}
        </div>
      )}
    </div>
  );
};
