import React, { useEffect, useState, useRef, useCallback } from "react";
import "./Sprites.css";
import animationController, {
  AnimationContext,
} from "../../../services/AnimationController";
import { VisualEffect } from "../../../config/animations/animations.config";
import { GameEngine } from "../../../models/game-engine";

interface VisualEffectsProps {
  showDebug?: boolean;
  game: GameEngine;
}

interface CharacterPosition {
  x: number;
  y: number;
  found: boolean;
}

const VisualEffects: React.FC<VisualEffectsProps> = ({
  showDebug = false,
  game,
}) => {
  const [activeEffects, setActiveEffects] = useState<VisualEffect[]>([]);
  const [animationStartTime, setAnimationStartTime] = useState<number>(0);
  const spritesArenaRef = useRef<HTMLDivElement>(null);
  const [effectStates, setEffectStates] = useState<
    {
      effect: VisualEffect;
      currentFrame: number;
      position: { x: number; y: number };
      isActive: boolean;
    }[]
  >([]);

  // Use refs to store timer IDs
  const timersRef = useRef<number[]>([]);
  // Keep track of whether component is mounted
  const isMounted = useRef(true);

  // Store character positions to avoid recalculating
  const characterPositionsRef = useRef<{
    attacker: CharacterPosition;
    target: CharacterPosition;
  }>({
    attacker: { x: 200, y: 150, found: false },
    target: { x: 500, y: 150, found: false },
  });

  // Debug utility function
  const debugLog = (message: string) => {
    if (showDebug) {
      console.log(`[VisualEffects] ${message}`);
    }
  };

  // Find character element position with improved error handling
  const findCharacterPosition = useCallback(
    (characterName: string, isAttacker: boolean): CharacterPosition => {
      try {
        if (!characterName) {
          debugLog(
            `No character name provided for ${
              isAttacker ? "attacker" : "target"
            }`
          );
          return { x: isAttacker ? 200 : 500, y: 150, found: false };
        }

        // Get the current animation context
        const context = animationController.getCurrentContext();
        if (!context) {
          debugLog("No animation context available");
          return { x: isAttacker ? 200 : 500, y: 150, found: false };
        }

        // Try finding sprite element by alt attribute first (most reliable)
        const sprites = document.querySelectorAll(
          `.sprite-image`
        ) as NodeListOf<HTMLImageElement>;
        let characterElement: HTMLElement | null = null;

        // Find the element with alt text containing the character name
        for (let i = 0; i < sprites.length; i++) {
          const alt = sprites[i].alt.toLowerCase();
          if (alt.includes(characterName.toLowerCase())) {
            // Get the enemy state from the sprite class
            const isEnemy = sprites[i].classList.contains("sprite-enemy");

            // Determine if this is the correct character based on the animation context
            // For attacker:
            // - If attacker is player1, we want a non-enemy sprite
            // - If attacker is player2, we want an enemy sprite
            // For target:
            // - If target is player1, we want a non-enemy sprite
            // - If target is player2, we want an enemy sprite
            const isCorrectElement = isAttacker
              ? (isEnemy && context.attackerPlayer === game.player2) || // Enemy (player2) attacking
                (!isEnemy && context.attackerPlayer === game.player1) // Player (player1) attacking
              : (isEnemy && context.targetPlayer === game.player2) || // Enemy (player2) being targeted
                (!isEnemy && context.targetPlayer === game.player1); // Player (player1) being targeted

            if (isCorrectElement) {
              characterElement = sprites[i];
              break;
            }
          }
        }

        if (!characterElement) {
          debugLog(`Character element not found for ${characterName}`);
          return { x: isAttacker ? 200 : 500, y: 150, found: false };
        }

        // Get position relative to the arena
        const arenaElement = characterElement.closest(".sprites-arena");
        if (!arenaElement) {
          debugLog(`Arena element not found`);
          return { x: isAttacker ? 200 : 500, y: 150, found: false };
        }

        const elementRect = characterElement.getBoundingClientRect();
        const arenaRect = arenaElement.getBoundingClientRect();

        const position = {
          x: elementRect.left - arenaRect.left + elementRect.width / 2,
          y: elementRect.top - arenaRect.top + elementRect.height / 2,
          found: true,
        };

        debugLog(
          `Found ${isAttacker ? "attacker" : "target"} position: x=${
            position.x
          }, y=${position.y}`
        );
        return position;
      } catch (error) {
        debugLog(`Error finding position for ${characterName}: ${error}`);
        return { x: isAttacker ? 200 : 500, y: 150, found: false };
      }
    },
    [showDebug, game]
  );

  // Subscribe to animation controller for effects
  useEffect(() => {
    isMounted.current = true;

    const stateChangeSub = animationController.on("stateChange", () => {
      if (!isMounted.current) return;

      const effects = animationController.getActiveEffects();
      setActiveEffects(effects);
      setAnimationStartTime(Date.now());

      // Reset character positions when animation state changes
      characterPositionsRef.current = {
        attacker: { x: 200, y: 150, found: false },
        target: { x: 500, y: 150, found: false },
      };

      debugLog(`Active effects updated: ${effects.length} effects`);
    });

    const actionStartedSub = animationController.on(
      "actionStarted",
      (context: AnimationContext) => {
        if (!isMounted.current) return;

        // Reset previous effects
        setEffectStates([]);

        // Get fresh character positions at the start of an action
        if (context.attackerCharacter && context.targetCharacter) {
          const attackerName = context.attackerCharacter.name
            .toLowerCase()
            .replace(/\s+/g, "");
          const targetName = context.targetCharacter.name
            .toLowerCase()
            .replace(/\s+/g, "");

          // Small delay to make sure DOM is updated
          setTimeout(() => {
            characterPositionsRef.current = {
              attacker: findCharacterPosition(attackerName, true),
              target: findCharacterPosition(targetName, false),
            };

            debugLog(`Updated character positions:
            Attacker: ${attackerName} at (${characterPositionsRef.current.attacker.x}, ${characterPositionsRef.current.attacker.y})
            Target: ${targetName} at (${characterPositionsRef.current.target.x}, ${characterPositionsRef.current.target.y})`);
          }, 50);
        }
      }
    );

    return () => {
      isMounted.current = false;
      stateChangeSub();
      actionStartedSub();

      // Clean up any remaining timers
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current = [];
    };
  }, [showDebug, findCharacterPosition, game]);

  // Initialize and update effect animations
  useEffect(() => {
    // Clear previous timers
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];

    // Initialize effect states
    const newEffectStates = activeEffects.map((effect) => {
      const startPos = getEffectPosition(effect, "start");
      debugLog(
        `Initializing ${effect.type} effect at position: ${startPos.x}, ${startPos.y}`
      );

      return {
        effect,
        currentFrame: 0,
        position: startPos,
        isActive: false,
      };
    });

    setEffectStates(newEffectStates);

    // Process each effect
    activeEffects.forEach((effect, index) => {
      // Start effect animation after its startTime
      const startTimer = window.setTimeout(() => {
        if (!isMounted.current) return;

        debugLog(`Starting effect: ${effect.type} at ${effect.startTime}ms`);

        // Mark this effect as active
        setEffectStates((prev) => {
          const newState = [...prev];
          if (newState[index]) {
            newState[index].isActive = true;

            // Re-calculate position just before starting animation to ensure accuracy
            if (effect.type === "projectile") {
              newState[index].position = getEffectPosition(effect, "start");
              debugLog(
                `Starting projectile at updated position: ${newState[index].position.x}, ${newState[index].position.y}`
              );
            }
          }
          return newState;
        });

        // For projectiles, we need to animate position
        if (effect.type === "projectile" && effect.end) {
          animateProjectile(effect, index);
        }

        // For all effects, we need to animate the sprite frames
        animateEffectFrames(effect, index);

        // Clean up effect after its duration
        const endTimer = window.setTimeout(() => {
          if (!isMounted.current) return;

          setEffectStates((prev) => {
            const newState = [...prev];
            if (newState[index]) {
              newState[index].isActive = false;
            }
            return newState;
          });
        }, effect.duration);

        timersRef.current.push(endTimer);
      }, effect.startTime);

      timersRef.current.push(startTimer);
    });

    return () => {
      // Clean up timers
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current = [];
    };
  }, [activeEffects, showDebug, game]);

  // Function to animate projectile movement
  const animateProjectile = (effect: VisualEffect, index: number) => {
    const startPosition = getEffectPosition(effect, "start");
    const endPosition = getEffectPosition(effect, "end");

    debugLog(
      `Animating projectile from (${startPosition.x}, ${startPosition.y}) to (${endPosition.x}, ${endPosition.y})`
    );

    // Ensure the start and end positions are different
    if (
      Math.abs(startPosition.x - endPosition.x) < 20 &&
      Math.abs(startPosition.y - endPosition.y) < 20
    ) {
      debugLog(
        "Start and end positions are too close, using default positions"
      );
      // Use fallback positions
      startPosition.x = 200;
      endPosition.x = 500;
    }

    const framesCount = Math.ceil(effect.duration / 50); // Update every 50ms
    let currentFrame = 0;

    const updatePosition = () => {
      if (!isMounted.current) return;

      if (currentFrame < framesCount) {
        const progress = currentFrame / framesCount;
        const newX =
          startPosition.x + (endPosition.x - startPosition.x) * progress;
        const newY =
          startPosition.y + (endPosition.y - startPosition.y) * progress;

        setEffectStates((prev) => {
          const newState = [...prev];
          if (newState[index]) {
            newState[index].position = { x: newX, y: newY };
          }
          return newState;
        });

        currentFrame++;
        const timerId = window.setTimeout(updatePosition, 50);
        timersRef.current.push(timerId);
      }
    };

    updatePosition();
  };

  // Function to animate effect sprite frames
  const animateEffectFrames = (effect: VisualEffect, index: number) => {
    if (effect.path) {
      // Get frame count from sprites array if available
      const framesCount = effect.sprites ? effect.sprites.length : 8;
      let currentFrame = 0;

      const updateFrame = () => {
        if (!isMounted.current) return;

        if (currentFrame < framesCount) {
          setEffectStates((prev) => {
            const newState = [...prev];
            if (newState[index]) {
              newState[index].currentFrame = currentFrame;
            }
            return newState;
          });

          currentFrame++;
          const timerId = window.setTimeout(
            updateFrame,
            effect.duration / framesCount
          );
          timersRef.current.push(timerId);
        }
      };

      updateFrame();
    }
  };

  // Helper to get starting or ending position for an effect
  const getEffectPosition = (
    effect: VisualEffect,
    posType: "start" | "end"
  ): { x: number; y: number } => {
    const position = posType === "start" ? effect.start : effect.end;

    // Get the current animation context
    const context = animationController.getCurrentContext();
    if (!context) {
      debugLog("No animation context available for effect position");
      return { x: 300, y: 150 };
    }

    // If we already have the character positions, use them
    if (
      position === "attacker" &&
      characterPositionsRef.current.attacker.found
    ) {
      return {
        x: characterPositionsRef.current.attacker.x,
        y: characterPositionsRef.current.attacker.y,
      };
    }

    if (position === "target" && characterPositionsRef.current.target.found) {
      return {
        x: characterPositionsRef.current.target.x,
        y: characterPositionsRef.current.target.y,
      };
    }

    // Otherwise calculate fresh positions
    if (position === "attacker" || position === "target") {
      const isAttacker = position === "attacker";

      // Get the appropriate character name from the context
      const characterName = isAttacker
        ? context.attackerCharacter?.name.toLowerCase().replace(/\s+/g, "")
        : context.targetCharacter?.name.toLowerCase().replace(/\s+/g, "");

      if (!characterName) {
        debugLog(`Character name not found for ${position}`);
        return { x: isAttacker ? 200 : 500, y: 150 };
      }

      // Find the character position
      const foundPosition = findCharacterPosition(characterName, isAttacker);

      // Cache the found position for future use
      if (isAttacker) {
        characterPositionsRef.current.attacker = foundPosition;
      } else {
        characterPositionsRef.current.target = foundPosition;
      }

      return { x: foundPosition.x, y: foundPosition.y };
    } else if (typeof position === "object") {
      return position;
    }

    // Default fallback
    return { x: 300, y: 150 };
  };

  // Helper to get sprite path for an effect frame
  const getEffectSpritePath = (effect: VisualEffect, frame: number): string => {
    if (effect.sprites && effect.sprites.length > 0) {
      return effect.sprites[frame % effect.sprites.length];
    }

    // Default sprite path format
    const characterName = extractCharacterFromPath(effect.path);
    const effectName = effect.path.split("/").pop() || effect.path;

    return `characters/${characterName}/sprites/${effect.path}/${characterName}-sprites-${frame}.png`;
  };

  // Helper to extract character name from path
  const extractCharacterFromPath = (path: string): string => {
    // Extract character name from paths like "sasuke/fireball/effects/fireball"
    const parts = path.split("/");
    if (parts.length > 0) {
      return parts[0]; // Return first segment as character name
    }
    return "unknown";
  };

  // Calculate if projectile needs to be flipped
  const shouldFlipProjectile = (effect: VisualEffect): boolean => {
    if (effect.type !== "projectile") return false;

    const startX = characterPositionsRef.current.attacker.x;
    const endX = characterPositionsRef.current.target.x;

    // Flip if traveling from right to left
    return startX > endX;
  };

  // Calculate if effect needs to be rotated
  const shouldRotateEffect = (effect: VisualEffect): boolean => {
    // Get the current animation context
    const context = animationController.getCurrentContext();
    if (!context) return false;

    // If the attacker is player2 (enemy), rotate the effect
    return context.attackerPlayer === game.player2;
  };

  const calculateEffectPosition = (
    effect: VisualEffect,
    startTime: number,
    currentTime: number
  ) => {
    const context = animationController.getCurrentContext();
    if (!context) return null;

    // Get start position
    let startPos: { x: number; y: number };
    if (typeof effect.start === "string") {
      const isAttacker = effect.start === "attacker";
      const character = isAttacker
        ? context.attackerCharacter
        : context.targetCharacter;
      const isEnemy = isAttacker
        ? context.attackerPlayer === game.player2
        : context.targetPlayer === game.player2;

      if (!character) return null;
      startPos = findCharacterPosition(character.name, isEnemy) || {
        x: 0,
        y: 0,
      };
    } else {
      startPos = effect.start;
    }

    // For aura effects, always stay at the start position
    if (effect.type === "aura") {
      return startPos;
    }

    // For projectiles, calculate position between start and end
    if (effect.type === "projectile" && effect.end) {
      let endPos: { x: number; y: number };
      if (typeof effect.end === "string") {
        const isAttacker = effect.end === "attacker";
        const character = isAttacker
          ? context.attackerCharacter
          : context.targetCharacter;
        const isEnemy = isAttacker
          ? context.attackerPlayer === game.player2
          : context.targetPlayer === game.player2;

        if (!character) return null;
        endPos = findCharacterPosition(character.name, isEnemy) || {
          x: 0,
          y: 0,
        };
      } else {
        endPos = effect.end;
      }

      const progress = (currentTime - startTime) / effect.duration;
      return {
        x: startPos.x + (endPos.x - startPos.x) * progress,
        y: startPos.y + (endPos.y - startPos.y) * progress,
      };
    }

    return startPos;
  };

  const calculateEffectRotation = (
    effect: VisualEffect,
    startTime: number,
    currentTime: number
  ) => {
    const context = animationController.getCurrentContext();
    if (!context) return 0;

    // For aura effects, rotate based on the attacker's team
    if (effect.type === "aura") {
      return context.attackerPlayer === game.player2 ? 180 : 0;
    }

    // For projectiles, calculate rotation based on movement direction
    if (effect.type === "projectile" && effect.end) {
      let startPos: { x: number; y: number };
      let endPos: { x: number; y: number };

      if (typeof effect.start === "string") {
        const isAttacker = effect.start === "attacker";
        const character = isAttacker
          ? context.attackerCharacter
          : context.targetCharacter;
        const isEnemy = isAttacker
          ? context.attackerPlayer === game.player2
          : context.targetPlayer === game.player2;

        if (!character) return 0;
        startPos = findCharacterPosition(character.name, isEnemy) || {
          x: 0,
          y: 0,
        };
      } else {
        startPos = effect.start;
      }

      if (typeof effect.end === "string") {
        const isAttacker = effect.end === "attacker";
        const character = isAttacker
          ? context.attackerCharacter
          : context.targetCharacter;
        const isEnemy = isAttacker
          ? context.attackerPlayer === game.player2
          : context.targetPlayer === game.player2;

        if (!character) return 0;
        endPos = findCharacterPosition(character.name, isEnemy) || {
          x: 0,
          y: 0,
        };
      } else {
        endPos = effect.end;
      }

      const angle = Math.atan2(endPos.y - startPos.y, endPos.x - startPos.x);
      return (angle * 180) / Math.PI;
    }

    return effect.rotation || 0;
  };

  return (
    <div className="visual-effects" ref={spritesArenaRef}>
      {activeEffects.map((effect, index) => {
        const startTime = effect.startTime;
        const currentTime = Date.now() - animationStartTime;
        const elapsedTime = currentTime - startTime;

        // Skip if effect hasn't started yet or has ended
        if (elapsedTime < 0 || elapsedTime > effect.duration) {
          return null;
        }

        const position = calculateEffectPosition(
          effect,
          startTime,
          currentTime
        );
        const rotation = calculateEffectRotation(
          effect,
          startTime,
          currentTime
        );

        if (!position) return null;

        // Calculate current frame for sprite sequence
        const frameCount = effect.sprites ? effect.sprites.length : 8;
        const currentFrame =
          Math.floor((elapsedTime / effect.duration) * frameCount) % frameCount;
        const spritePath = effect.sprites
          ? effect.sprites[currentFrame]
          : effect.path;

        return (
          <div
            key={`${effect.type}-${index}`}
            className={`visual-effect ${effect.type}`}
            style={{
              left: `${position.x}px`,
              top: `${position.y}px`,
              transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${
                effect.scale || 1
              })`,
              opacity: 1,
              zIndex: effect.type === "aura" ? 3 : 2, // Aura effects should be on top
            }}
          >
            <img
              src={spritePath}
              alt={`${effect.type} effect`}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                filter: effect.color
                  ? `drop-shadow(0 0 5px ${effect.color})`
                  : "none",
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

// Helper to get the appropriate CSS animation based on effect type
const getEffectAnimation = (effect: VisualEffect): string | undefined => {
  switch (effect.type) {
    case "projectile":
      return undefined; // We're handling projectile movement with JS
    case "impact":
      return `impactPulse ${effect.duration}ms ease-out forwards`;
    case "aura":
      return `auraGlow ${effect.duration}ms ease-in-out infinite`;
    default:
      return undefined;
  }
};

export default VisualEffects;
