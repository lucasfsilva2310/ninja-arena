import { useState, DragEvent } from "react";
import { Character } from "../../models/character.model";
import { Ability } from "../../models/ability.model";
import { availableCharacters } from "../../database/available-characters";
import AbilityPreview from "./AbilityPreview";
import "./CharacterSelection.css";

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
    <div className="character-selection-container">
      <h2 className="selection-header">Choose 3 characters</h2>

      <div
        className="remove-zone"
        onDragOver={handleDragOverRemoveZone}
        onDragLeave={handleDragLeaveRemoveZone}
        onDrop={handleDropOnRemoveZone}
      >
        Arraste aqui para remover
      </div>

      <div className="characters-grid">
        {availableCharacters.map((char) => (
          <div
            key={char.name}
            className={`character-card ${
              selectedCharacters.includes(char) ? "selected" : ""
            }`}
            onClick={() => handleCharacterClick(char)}
            draggable
            onDragStart={(e) => handleDragStart(e, char)}
            onDragEnd={handleDragEnd}
          >
            <div className="character-sprite">
              <img
                src={`/characters/${char.name.toLowerCase()}/${char.name.toLowerCase()}.png`}
                alt={char.name}
                draggable={false}
              />
            </div>
            <div className="character-info">
              <h3 className="character-name">{char.name}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="selection-footer">
        <div className="selected-characters">
          <h3>Selected Characters:</h3>
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
                  {selectedCharacters[index] && (
                    <div
                      className="selected-character-container"
                      draggable
                      onDragStart={(e) =>
                        handleDragStart(e, selectedCharacters[index], true)
                      }
                      onDragEnd={handleDragEnd}
                    >
                      <img
                        src={`/characters/${selectedCharacters[
                          index
                        ].name.toLowerCase()}/${selectedCharacters[
                          index
                        ].name.toLowerCase()}.png`}
                        alt={selectedCharacters[index].name}
                        className="selected-sprite"
                        draggable={false}
                      />
                    </div>
                  )}
                  {!selectedCharacters[index] && <span>?</span>}
                </div>
              ))}
          </div>
        </div>
        <button
          className="start-game-btn"
          onClick={startGame}
          disabled={selectedCharacters.length !== 3}
        >
          Iniciar Jogo
        </button>
      </div>

      <AbilityPreview
        character={previewCharacter}
        selectedAbility={selectedAbility}
        onAbilityClick={setSelectedAbility}
      />
    </div>
  );
}
