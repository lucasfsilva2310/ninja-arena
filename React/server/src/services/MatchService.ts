import { v4 as uuidv4 } from "uuid";
import { User, Match } from "../types/index.js";

export class MatchService {
  private waitingPlayers: Map<string, User>;
  private activeMatches: Map<string, Match>;

  constructor() {
    this.waitingPlayers = new Map();
    this.activeMatches = new Map();
  }

  addToQueue(user: User): Match | null {
    this.waitingPlayers.set(user.id, user);
    return this.tryMatchmaking();
  }

  removeFromQueue(userId: string): void {
    this.waitingPlayers.delete(userId);
  }

  private tryMatchmaking(): Match | null {
    if (this.waitingPlayers.size >= 2) {
      const players = Array.from(this.waitingPlayers.values());
      const player1 = players[0];
      const player2 = players[1];

      // Remove players from queue
      this.waitingPlayers.delete(player1.id);
      this.waitingPlayers.delete(player2.id);

      // Create match
      const match = this.createMatch(player1, player2);
      return match;
    }
    return null;
  }

  private createMatch(player1: User, player2: User): Match {
    const matchId = uuidv4();
    const match: Match = {
      id: matchId,
      players: [player1, player2],
      currentTurn: player1.id,
      status: "in_progress",
      createdAt: new Date(),
    };

    this.activeMatches.set(matchId, match);
    return match;
  }

  getMatch(matchId: string): Match | undefined {
    return this.activeMatches.get(matchId);
  }

  updateMatch(matchId: string, updates: Partial<Match>): Match | null {
    const match = this.activeMatches.get(matchId);
    if (match) {
      Object.assign(match, updates);
      this.activeMatches.set(matchId, match);
      return match;
    }
    return null;
  }

  endMatch(matchId: string): void {
    this.activeMatches.delete(matchId);
  }

  getWaitingPlayersCount(): number {
    return this.waitingPlayers.size;
  }
}
