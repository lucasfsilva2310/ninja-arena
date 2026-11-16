import { v4 as uuidv4 } from "uuid";
export class User {
    constructor(username) {
        this.id = uuidv4();
        this.username = username;
        this.socketId = null;
        this.selectedCharacters = [];
        this.isInMatch = false;
        this.currentMatch = null;
        this.createdAt = new Date();
    }
    setSocketId(socketId) {
        this.socketId = socketId;
    }
    setSelectedCharacters(characters) {
        this.selectedCharacters = characters;
    }
    setInMatch(inMatch) {
        this.isInMatch = inMatch;
    }
    setCurrentMatch(match) {
        this.currentMatch = match;
    }
    toJSON() {
        return {
            id: this.id,
            username: this.username,
            selectedCharacters: this.selectedCharacters,
            isInMatch: this.isInMatch,
            createdAt: this.createdAt,
        };
    }
}
//# sourceMappingURL=User.js.map