import "./Sprites.css";
import { useState, useEffect, useRef } from "react";
import { GameEngine, SelectedAction } from "../../../models/game-engine";
import { SpriteAnimator } from "./SpriteAnimated";
import VisualEffects from "./VisualEffects";
import animationController from "../../../services/AnimationController";

interface SpritesBoardProps {
  game: GameEngine;
  selectedActions: SelectedAction[];
  isExecutingTurn: boolean;
  showDebug?: boolean;
  onActionAnimationComplete?: (actionIndex: number) => void; // Callback when an action animation completes
  onAllAnimationsComplete?: () => void; // Callback when all animations complete
  currentActionIndex: number; // Track which action is currently being animated
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

  // Track current animation phases for all characters
  const [characterAnimations, setCharacterAnimations] = useState<
    {
      characterName: string;
      isEnemy: boolean;
      abilityName: string;
      index: number;
      isTarget: boolean;
    }[]
  >([]);

  // Subscribe to animation controller updates
  useEffect(() => {
    const stateChangeSub = animationController.on(
      "stateChange",
      (data: any) => {
        setDebugInfo((prev) => `${prev}\nAnimation phase: ${data.phase}`);
      }
    );

    const actionCompleteSub = animationController.on(
      "actionComplete",
      (context: any) => {
        if (
          onActionAnimationComplete &&
          !processedActionIndices.current.includes(currentActionIndex)
        ) {
          processedActionIndices.current.push(currentActionIndex);
          onActionAnimationComplete(currentActionIndex);

          // Check if all actions are complete
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
      }
    );

    return () => {
      stateChangeSub();
      actionCompleteSub();
    };
  }, [
    onActionAnimationComplete,
    onAllAnimationsComplete,
    currentActionIndex,
    selectedActions.length,
  ]);

  // Initialize character animations
  useEffect(() => {
    // Set up initial animations (all idle)
    const initialAnimations = [
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
      } else {
        // Reset animations when not executing turn
        animationController.reset();
      }
    }
  }, [selectedActions, isExecutingTurn]);

  // Handle turn execution - CRITICAL ANIMATION TRIGGER
  useEffect(() => {
    // Important: Only trigger animation if we haven't processed this action yet
    if (
      isExecutingTurn &&
      selectedActions.length > 0 &&
      currentActionIndex < selectedActions.length &&
      !processedActionIndices.current.includes(currentActionIndex)
    ) {
      debugLog(
        `Starting animation for action ${currentActionIndex + 1}/${
          selectedActions.length
        }`
      );

      // Add a small delay before starting new animations
      // This creates visual separation between consecutive actions
      setTimeout(() => {
        const currentAction = selectedActions[currentActionIndex];

        // Safety check
        if (
          !currentAction ||
          !currentAction.attackerCharacter ||
          !currentAction.targetCharacter ||
          !currentAction.attackerAbility
        ) {
          debugError("Invalid action data" + JSON.stringify(currentAction));
          return;
        }

        // Start the animation using our controller
        animationController.startAction(
          currentAction.attackerPlayer,
          currentAction.attackerCharacter,
          currentAction.attackerAbility,
          currentAction.targetCharacter,
          currentAction.targetPlayer
        );

        setDebugInfo(
          (prev) =>
            `${prev}\nStarting execution of action ${currentActionIndex + 1}/${
              selectedActions.length
            }`
        );
      }, 200);
    }
  }, [isExecutingTurn, selectedActions, currentActionIndex]);

  // Update character animations based on animation controller state
  useEffect(() => {
    const updateAnimations = () => {
      const phase = animationController.getCurrentPhase();
      const animData = animationController.getAnimationData();

      if (phase === "idle" || !animData) {
        // Reset all characters to idle when not animating
        setCharacterAnimations((prev) =>
          prev.map((anim) => ({
            ...anim,
            abilityName: "idle",
            isTarget: false,
          }))
        );
        return;
      }

      // Get the current action being executed
      const currentAction =
        currentActionIndex < selectedActions.length
          ? selectedActions[currentActionIndex]
          : null;

      if (!currentAction) return;

      setCharacterAnimations((prev) => {
        return prev.map((anim) => {
          // Check if this character is the attacker
          const isAttacker =
            normalizeString(currentAction.attackerCharacter.name) ===
              anim.characterName &&
            ((anim.isEnemy && currentAction.attackerPlayer === game.player2) ||
              (!anim.isEnemy && currentAction.attackerPlayer === game.player1));

          // Determine if this character is a target
          const isTarget =
            phase === "impact" &&
            normalizeString(currentAction.targetCharacter.name) ===
              anim.characterName &&
            ((anim.isEnemy && currentAction.targetPlayer === game.player2) ||
              (!anim.isEnemy && currentAction.targetPlayer === game.player1));

          // Set animation name based on character role and phase
          let abilityName = "idle";

          if (isAttacker) {
            // Attacker animation
            if (phase === "attacking") {
              abilityName = normalizeString(currentAction.attackerAbility.name);
            } else if (phase === "recovery") {
              abilityName = "recover";
            }
          } else if (isTarget) {
            // Target animation
            if (phase === "impact") {
              abilityName = "damaged";
            }
          }

          return {
            ...anim,
            abilityName,
            isTarget,
          };
        });
      });
    };

    // Subscribe to animation controller state changes
    const subscription = animationController.on(
      "stateChange",
      updateAnimations
    );

    // Initial update
    updateAnimations();

    return () => {
      subscription();
    };
  }, [game, selectedActions, currentActionIndex]);

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

        {/* Add visual effects layer */}
        <VisualEffects showDebug={showDebug} />
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
          Animation Phase: {animationController.getCurrentPhase()}
          <br />
          Current Action: {currentActionIndex + 1}/{selectedActions.length}
          <br />
          Processed Actions: {processedActionIndices.current.join(", ")}
          <br />
          {debugInfo}
        </div>
      )}
    </div>
  );
};
