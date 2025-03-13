import React, { useState, useEffect } from "react";
import "./Sprites.css";
import { VisualEffect } from "../../../config/animationConfig";
import animationController from "../../../services/AnimationController";

interface VisualEffectsProps {
  showDebug?: boolean;
}

interface EffectState {
  id: string;
  effect: VisualEffect;
  visible: boolean;
  position: {
    x: number;
    y: number;
  };
  endPosition?: {
    x: number;
    y: number;
  };
  currentFrame: number;
  totalFrames: number;
  progress: number; // 0 to 1
  scale: number;
  rotation: number;
}

export const VisualEffects: React.FC<VisualEffectsProps> = ({
  showDebug = false,
}) => {
  const [activeEffects, setActiveEffects] = useState<EffectState[]>([]);
  const [lastActionId, setLastActionId] = useState<string | null>(null);

  // Debug utility
  const debugLog = (message: string) => {
    if (showDebug) {
      console.log(`[VisualEffects] ${message}`);
    }
  };

  // Listen for animation state changes
  useEffect(() => {
    // Subscribe to animation controller events
    const stateChangeSub = animationController.on(
      "stateChange",
      (data: any) => {
        // If the phase is 'attacking', this is a new action starting
        if (data.phase === "attacking") {
          // Generate unique ID for this action
          const actionId = `action-${Date.now()}`;
          setLastActionId(actionId);
        }
      }
    );

    // Reset effects when animation completes
    const resetSub = animationController.on("reset", () => {
      setActiveEffects([]);
    });

    return () => {
      stateChangeSub();
      resetSub();
    };
  }, []);

  // Process effects based on current animation phase
  useEffect(() => {
    const phase = animationController.getCurrentPhase();
    const animationData = animationController.getAnimationData();
    const effects = animationController.getActiveEffects();

    if (
      !animationData ||
      !lastActionId ||
      phase === "idle" ||
      phase === "completed"
    ) {
      return;
    }

    // Filter effects that should start in the current phase
    const newEffects = effects
      .filter((effect) => {
        // Check if this effect should start now based on its startTime
        // This is a simple approximation - in a full implementation,
        // you'd use a more precise timing mechanism
        if (phase === "attacking" && effect.startTime < 500) return true;
        if (
          phase === "impact" &&
          effect.startTime >= 500 &&
          effect.startTime < 1000
        )
          return true;
        if (phase === "recovery" && effect.startTime >= 1000) return true;
        return false;
      })
      .filter((effect) => {
        // Exclude effects already in the active list
        return !activeEffects.some(
          (active) =>
            active.effect.path === effect.path &&
            active.effect.type === effect.type
        );
      });

    // If we have new effects, add them
    if (newEffects.length > 0) {
      debugLog(`Adding ${newEffects.length} new effects for phase ${phase}`);

      // Add new effects to the state
      setActiveEffects((prev) => [
        ...prev,
        ...newEffects.map((effect) => {
          // Calculate positions based on effect configuration
          const position = calculatePosition(effect.start);
          const endPosition = effect.end
            ? calculatePosition(effect.end)
            : undefined;

          return {
            id: `${lastActionId}-${effect.path}-${Date.now()}`,
            effect,
            visible: true,
            position,
            endPosition,
            currentFrame: 0,
            totalFrames: calculateFrames(effect),
            progress: 0,
            scale: effect.scale || 1,
            rotation: effect.rotation || 0,
          };
        }),
      ]);
    }

    // Cleanup completed effects
    setActiveEffects((prev) =>
      prev.filter(
        (effect) =>
          effect.progress < 1 ||
          Date.now() - parseInt(effect.id.split("-")[2]) <
            effect.effect.duration
      )
    );
  }, [animationController.getCurrentPhase(), lastActionId, activeEffects]);

  // Animate active effects
  useEffect(() => {
    if (activeEffects.length === 0) return;

    const animationFrame = requestAnimationFrame(() => {
      setActiveEffects((prev) =>
        prev.map((effect) => {
          // For projectiles, update position based on progress
          let newPosition = { ...effect.position };

          if (effect.effect.type === "projectile" && effect.endPosition) {
            // Linear interpolation between start and end positions
            newPosition = {
              x:
                effect.position.x +
                (effect.endPosition.x - effect.position.x) * effect.progress,
              y:
                effect.position.y +
                (effect.endPosition.y - effect.position.y) * effect.progress,
            };
          }

          // Update progress
          const newProgress = Math.min(
            1,
            effect.progress + 16 / effect.effect.duration
          );

          // Update frame
          const frameDuration = effect.effect.duration / effect.totalFrames;
          const newFrame = Math.min(
            effect.totalFrames - 1,
            Math.floor(newProgress * effect.totalFrames)
          );

          return {
            ...effect,
            position: newPosition,
            currentFrame: newFrame,
            progress: newProgress,
            visible: newProgress < 1,
          };
        })
      );
    });

    return () => cancelAnimationFrame(animationFrame);
  }, [activeEffects]);

  // Helper to calculate position based on 'attacker', 'target', or coordinates
  const calculatePosition = (
    positionSource: "attacker" | "target" | { x: number; y: number }
  ) => {
    // In a real implementation, you would get actual positions from the DOM
    // This is a simplified version
    if (typeof positionSource === "object") {
      return positionSource;
    }

    // Fixed positions for demo - in real implementation, get these from the DOM
    if (positionSource === "attacker") {
      const context = animationController.getAnimationData();
      const isEnemyAttacker =
        animationController.getCurrentPhase() === "impact";
      return { x: isEnemyAttacker ? 200 : 100, y: 150 };
    }

    if (positionSource === "target") {
      const context = animationController.getAnimationData();
      const isEnemyTarget = animationController.getCurrentPhase() === "impact";
      return { x: isEnemyTarget ? 100 : 200, y: 150 };
    }

    return { x: 150, y: 150 }; // Default fallback
  };

  // Calculate total frames for an effect
  const calculateFrames = (effect: VisualEffect) => {
    // Default to 10 frames per second, or custom from effect
    const framesPerSecond = 10;
    return Math.max(1, Math.ceil((effect.duration / 1000) * framesPerSecond));
  };

  // Get current frame image path
  const getEffectFramePath = (effect: EffectState) => {
    return `${effect.effect.path}/${effect.currentFrame}.png`;
  };

  return (
    <div className="visual-effects-container">
      {activeEffects.map(
        (effect) =>
          effect.visible && (
            <div
              key={effect.id}
              className={`visual-effect effect-${effect.effect.type}`}
              style={{
                position: "absolute",
                left: `${effect.position.x}px`,
                top: `${effect.position.y}px`,
                transform: `scale(${effect.scale}) rotate(${effect.rotation}deg)`,
                opacity:
                  effect.effect.type === "impact"
                    ? // Fade in and out for impact effects
                      effect.progress < 0.2
                      ? effect.progress * 5
                      : (1 - effect.progress) * 1.25
                    : // Simple fade out for other effects
                    effect.progress > 0.8
                    ? (1 - effect.progress) * 5
                    : 1,
                zIndex: 100,
              }}
            >
              <img
                src={getEffectFramePath(effect)}
                alt={`Effect ${effect.effect.type}`}
                style={{ maxWidth: "60px", maxHeight: "60px" }}
              />
            </div>
          )
      )}

      {showDebug && (
        <div className="debug-effects">
          <div
            style={{
              fontSize: "10px",
              background: "#f0f0f0",
              padding: "5px",
              position: "absolute",
              bottom: "5px",
              left: "5px",
            }}
          >
            <strong>Effects Debug:</strong>
            <br />
            {activeEffects.length} active effects
            <br />
            Phase: {animationController.getCurrentPhase()}
          </div>
        </div>
      )}
    </div>
  );
};

export default VisualEffects;
