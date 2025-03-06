import "./CharacterSelection.css";

import { useState, DragEvent, useEffect } from "react";
import { Character } from "../../models/character.model";
import { Ability } from "../../models/ability.model";
import { availableCharacters } from "../../database/available-characters";

import AbilityDescriptionFooter from "../components/AbilityDescriptionFooter/AbilityDescriptionFooter";

interface CharacterSelectionProps {
  startGame: () => void;
  toggleCharacterSelection: (character: Character) => void;
  selectedCharacters: Character[];
}

export default function CharacterSelection({
  startGame,
  toggleCharacterSelection,
  selectedCharacters,
}: CharacterSelectionProps) {
  const [previewCharacter, setPreviewCharacter] = useState<Character | null>(
    null
  );
  const [selectedAbility, setSelectedAbility] = useState<Ability | null>(null);
  const [draggedCharacter, setDraggedCharacter] = useState<Character | null>(
    null
  );
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDraggingFromSlot, setIsDraggingFromSlot] = useState(false);
  const [background, setBackground] = useState<string>(
    "/backgrounds/character-selection/default.png"
  );

  useEffect(() => {
    // List of available backgrounds
    // Add Logic to get random background from backgrounds folder directory
    const backgrounds = ["itachi.png"];

    const randomBackground =
      backgrounds[Math.floor(Math.random() * backgrounds.length)];
    setBackground(`/backgrounds/character-selection/${randomBackground}`);
  }, []);

  const handleCharacterClick = (character: Character) => {
    setPreviewCharacter(character);
    setSelectedAbility(null);
  };

  const handleDragStart = (
    e: DragEvent<HTMLDivElement>,
    character: Character,
    fromSlot: boolean = false
  ) => {
    setDraggedCharacter(character);
    setIsDraggingFromSlot(fromSlot);
    e.currentTarget.classList.add("dragging");
  };

  const handleDragEnd = (e: DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove("dragging");
    setDragOverIndex(null);

    // If we were dragging from a slot and didn't drop on another slot,
    // remove the character
    if (isDraggingFromSlot && draggedCharacter) {
      const index = selectedCharacters.indexOf(draggedCharacter);
      if (index !== -1) {
        toggleCharacterSelection(draggedCharacter);
      }
    }

    setDraggedCharacter(null);
    setIsDraggingFromSlot(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (!draggedCharacter) return;

    const newSelectedCharacters = [...selectedCharacters];

    // If there's already a character in this slot, remove it
    if (newSelectedCharacters[index]) {
      toggleCharacterSelection(newSelectedCharacters[index]);
    }

    // If dragging from another slot, remove from old position
    if (isDraggingFromSlot) {
      const oldIndex = selectedCharacters.indexOf(draggedCharacter);
      if (oldIndex !== -1) {
        newSelectedCharacters[oldIndex] = null as any;
      }
    }

    // Add character to new slot
    newSelectedCharacters[index] = draggedCharacter;
    toggleCharacterSelection(draggedCharacter);

    setDraggedCharacter(null);
    setDragOverIndex(null);
    setIsDraggingFromSlot(false);
  };

  const handleDragOverRemoveZone = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (isDraggingFromSlot) {
      e.currentTarget.classList.add("remove-zone-active");
    }
  };

  const handleDragLeaveRemoveZone = (e: DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove("remove-zone-active");
  };

  const handleDropOnRemoveZone = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove("remove-zone-active");

    if (isDraggingFromSlot && draggedCharacter) {
      toggleCharacterSelection(draggedCharacter);
    }

    setDraggedCharacter(null);
    setIsDraggingFromSlot(false);
  };

  return (
    <div
      className="character-selection-container"
      style={{
        backgroundImage: `url(${background})`,
        backgroundSize: "100% 100%",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="selection-header">
        <div className="selection-header-wrapper">
          <div className="selected-characters">
            <h3 className="selected-characters-title">Selected Characters:</h3>
            <div className="selected-list">
              {Array(3)
                .fill(null)
                .map((_, index) => (
                  <div
                    key={`slot-${index}`}
                    className={`character-slot ${
                      dragOverIndex === index ? "drag-over" : ""
                    } ${selectedCharacters[index] ? "filled" : "empty-slot"}`}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                  >
                    {selectedCharacters[index] ? (
                      <div
                        className="selected-character-container"
                        draggable
                        onDragStart={(e) =>
                          handleDragStart(e, selectedCharacters[index], true)
                        }
                        onDragEnd={handleDragEnd}
                      >
                        <div className="character-portrait">
                          <img
                            src={`/characters/${selectedCharacters[index].name
                              .split(" ")
                              .join("")
                              .toLowerCase()}/${selectedCharacters[index].name
                              .split(" ")
                              .join("")
                              .toLowerCase()}.png`}
                            alt={selectedCharacters[index].name}
                            className="character-image"
                            draggable={false}
                            onError={(e) => {
                              e.currentTarget.src = "/characters/default.png";
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span>?</span>
                    )}
                  </div>
                ))}
            </div>
          </div>
          <div className="start-game-btn-container">
            <button
              className="start-game-btn"
              onClick={startGame}
              disabled={selectedCharacters.length !== 3}
            >
              Start Game
            </button>
          </div>
        </div>
      </div>

      <div className="selection-footer">
        <div
          className="remove-zone"
          onDragOver={handleDragOverRemoveZone}
          onDragLeave={handleDragLeaveRemoveZone}
          onDrop={handleDropOnRemoveZone}
        >
          Arraste aqui para remover
        </div>

        <div className="characters-selection-container">
          <div className="characters-header-container">
            <h4>Select 3 characters</h4>
          </div>
          <div className="characters-grid-body">
            {availableCharacters.map((char) => (
              <div
                key={char.name}
                className={`character-card-selection ${
                  selectedCharacters.includes(char) ? "selected" : ""
                }`}
                onClick={() => handleCharacterClick(char)}
                draggable
                onDragStart={(e) => handleDragStart(e, char)}
                onDragEnd={handleDragEnd}
              >
                <div className="character-portrait">
                  <img
                    src={`/characters/${char.name
                      .split(" ")
                      .join("")
                      .toLowerCase()}/${char.name
                      .split(" ")
                      .join("")
                      .toLowerCase()}.png`}
                    alt={char.name}
                    className="character-image"
                    draggable={false}
                    onError={(e) => {
                      e.currentTarget.src = "/characters/default.png";
                    }}
                  />
                </div>
                <div className="character-info">
                  <h3 className="character-name">{char.name}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AbilityDescriptionFooter
        selectedCharacter={previewCharacter}
        currentSelectedAbility={selectedAbility}
        context="character-selection"
      />
    </div>
  );
}
