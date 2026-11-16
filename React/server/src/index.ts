import Fastify from "fastify";
import cors from "@fastify/cors";
import { Server } from "socket.io";
import { createServer } from "http";
import { User } from "./models/User.js";
import { MatchService } from "./services/MatchService.js";
import {
  GameAction,
  MatchFoundEvent,
  WaitingForOpponentEvent,
} from "./types/index.js";

const fastify = Fastify();
const httpServer = createServer(fastify.server);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Initialize services
const matchService = new MatchService();
const users = new Map<string, User>();

// Register CORS
await fastify.register(cors, {
  origin: true,
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("join", (username: string) => {
    const user = new User(username);
    user.setSocketId(socket.id);
    users.set(socket.id, user);
    socket.emit("user_created", user.toJSON());
  });

  socket.on("select_characters", (characters: any[]) => {
    const user = users.get(socket.id);
    if (user) {
      user.setSelectedCharacters(characters);
      socket.emit("characters_selected", user.toJSON());
    }
  });

  socket.on("find_match", () => {
    const user = users.get(socket.id);
    if (user && !user.isInMatch) {
      user.setInMatch(true);
      const match = matchService.addToQueue(user);

      if (match) {
        // Notify both players about the match
        match.players.forEach((player) => {
          const matchFoundEvent: MatchFoundEvent = {
            matchId: match.id,
            opponent: match.players.find((p) => p.id !== player.id)?.toJSON()!,
          };
          io.to(player.socketId!).emit("match_found", matchFoundEvent);
        });
      } else {
        const waitingEvent: WaitingForOpponentEvent = {
          waitingPlayers: matchService.getWaitingPlayersCount(),
        };
        socket.emit("waiting_for_opponent", waitingEvent);
      }
    }
  });

  socket.on("cancel_matchmaking", () => {
    const user = users.get(socket.id);
    if (user) {
      user.setInMatch(false);
      matchService.removeFromQueue(user.id);
      socket.emit("matchmaking_cancelled");
    }
  });

  socket.on("game_action", (data: GameAction) => {
    const user = users.get(socket.id);
    if (user && user.currentMatch) {
      const match = matchService.getMatch(user.currentMatch.id);
      if (match) {
        // Handle game action and update match state
        // This will be implemented based on your game logic
        const nextPlayer = match.players.find((p) => p.id !== user.id);
        if (nextPlayer?.socketId) {
          io.to(nextPlayer.socketId).emit("opponent_action", data);
        }
      }
    }
  });

  socket.on("disconnect", () => {
    const user = users.get(socket.id);
    if (user) {
      if (user.isInMatch) {
        matchService.removeFromQueue(user.id);
      }
      if (user.currentMatch) {
        const match = matchService.getMatch(user.currentMatch.id);
        if (match) {
          match.players.forEach((player) => {
            if (player.id !== user.id && player.socketId) {
              io.to(player.socketId).emit("opponent_disconnected");
            }
          });
          matchService.endMatch(user.currentMatch.id);
        }
      }
      users.delete(socket.id);
    }
  });
});

// Start the server
const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: "0.0.0.0" });
    console.log("Server is running on port 3001");
  } catch (err) {
    console.error(err);
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
