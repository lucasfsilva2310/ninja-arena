export const getChakraColor = (chakraType: string): string => {
  switch (chakraType) {
    case "Taijutsu":
      return "#22c55e"; // Green
    case "Ninjutsu":
      return "#3b82f6"; // Blue
    case "Genjutsu":
      return "#ffffff"; // White
    case "Bloodline":
      return "#ef4444"; // Red
    case "Random":
      return "#ffffff"; // White
    default:
      return "#94a3b8"; // Default gray
  }
};
