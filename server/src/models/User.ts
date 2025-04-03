import { v4 as uuidv4 } from "uuid";
import { User as UserType, Character, Match } from "../types/index.js";

export class User implements Omit<UserType, "socketId" | "currentMatch"> {
  id: string;
  username: string;
  socketId: string | null;
  selectedCharacters: Character[];
  isInMatch: boolean;
  currentMatch: Match | null;
  createdAt: Date;

  constructor(username: string) {
    this.id = uuidv4();
    this.username = username;
    this.socketId = null;
    this.selectedCharacters = [];
    this.isInMatch = false;
    this.currentMatch = null;
    this.createdAt = new Date();
  }

  setSocketId(socketId: string): void {
    this.socketId = socketId;
  }

  setSelectedCharacters(characters: Character[]): void {
    this.selectedCharacters = characters;
  }

  setInMatch(inMatch: boolean): void {
    this.isInMatch = inMatch;
  }

  setCurrentMatch(match: Match): void {
    this.currentMatch = match;
  }

  toJSON(): Omit<
    UserType,
    | "socketId"
    | "currentMatch"
    | "setSocketId"
    | "setSelectedCharacters"
    | "setInMatch"
    | "setCurrentMatch"
    | "toJSON"
  > {
    return {
      id: this.id,
      username: this.username,
      selectedCharacters: this.selectedCharacters,
      isInMatch: this.isInMatch,
      createdAt: this.createdAt,
    };
  }
}
