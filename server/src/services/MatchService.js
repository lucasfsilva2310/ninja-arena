import { v4 as uuidv4 } from "uuid";

export class MatchService {
  constructor() {
    this.waitingPlayers = new Map();
    this.activeMatches = new Map();
  }

  addToQueue(user) {
    this.waitingPlayers.set(user.id, user);
    return this.tryMatchmaking();
  }

  removeFromQueue(userId) {
    this.waitingPlayers.delete(userId);
  }

  tryMatchmaking() {
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

  createMatch(player1, player2) {
    const matchId = uuidv4();
    const match = {
      id: matchId,
      players: [player1, player2],
      currentTurn: player1.id,
      status: "in_progress",
      createdAt: new Date(),
    };

    this.activeMatches.set(matchId, match);
    return match;
  }

  getMatch(matchId) {
    return this.activeMatches.get(matchId);
  }

  updateMatch(matchId, updates) {
    const match = this.activeMatches.get(matchId);
    if (match) {
      Object.assign(match, updates);
      this.activeMatches.set(matchId, match);
      return match;
    }
    return null;
  }

  endMatch(matchId) {
    this.activeMatches.delete(matchId);
  }

  getWaitingPlayersCount() {
    return this.waitingPlayers.size;
  }
}
