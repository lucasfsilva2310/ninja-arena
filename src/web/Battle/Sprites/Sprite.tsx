import { useState, useEffect } from "react";

interface SpriteProps {
  characterName: string;
  isEnemy?: boolean;
}

export const Sprite: React.FC<SpriteProps> = ({
  characterName,
  isEnemy = false,
}) => {
  const [spritePath, setSpritePath] = useState<string>("");
  const defaultSpritePath = "/characters/idle.gif";

  useEffect(() => {
    // Format character name for path (lowercase, no spaces)
    const formattedName = characterName.split(" ").join("").toLowerCase();
    const path = `/characters/${formattedName}/sprites/idle.gif`;

    // Check if the sprite exists
    fetch(path)
      .then((response) => {
        if (response.ok) {
          setSpritePath(path);
        } else {
          setSpritePath(defaultSpritePath);
        }
      })
      .catch(() => {
        setSpritePath(defaultSpritePath);
      });
  }, [characterName]);

  return (
    <div
      className={`sprite-container ${isEnemy ? "sprite-enemy" : "sprite-ally"}`}
      style={{
        width: "45px",
        height: "45px",
        display: "flex",
        justifyContent: isEnemy ? "flex-start" : "flex-end",
      }}
    >
      <img
        src={spritePath}
        alt={`${characterName} sprite`}
        className="sprite-image"
        style={{
          width: "45px",
          height: "45px",
          objectFit: "contain",
          transform: isEnemy ? "scaleX(-1)" : "none",
        }}
        onError={(e) => {
          e.currentTarget.src = defaultSpritePath;
        }}
      />
    </div>
  );
};
