export interface Character {
  id: string;
  name: string;
  // Add other character properties as needed
}

export interface Match {
  id: string;
  players: User[];
  currentTurn: string;
  status: "in_progress" | "finished";
  createdAt: Date;
}

export interface User {
  id: string;
  username: string;
  socketId: string | null;
  selectedCharacters: Character[];
  isInMatch: boolean;
  currentMatch: Match | null;
  createdAt: Date;
  setSocketId(socketId: string): void;
  setSelectedCharacters(characters: Character[]): void;
  setInMatch(inMatch: boolean): void;
  setCurrentMatch(match: Match): void;
  toJSON(): Omit<
    User,
    | "socketId"
    | "currentMatch"
    | "setSocketId"
    | "setSelectedCharacters"
    | "setInMatch"
    | "setCurrentMatch"
    | "toJSON"
  >;
}

export interface GameAction {
  type: string;
  payload: any;
  matchId: string;
  playerId: string;
}

export interface MatchFoundEvent {
  matchId: string;
  opponent: Omit<
    User,
    | "socketId"
    | "currentMatch"
    | "setSocketId"
    | "setSelectedCharacters"
    | "setInMatch"
    | "setCurrentMatch"
    | "toJSON"
  >;
}

export interface WaitingForOpponentEvent {
  waitingPlayers: number;
}
