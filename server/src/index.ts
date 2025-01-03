import express from "express";
import { createServer } from "http";
import { WebSocket, WebSocketServer } from "ws";
import cors from "cors";
import dotenv from "dotenv";
import {
  isRegisterMessage,
  isJoinRoomMessage,
  isLoadQuizMessage,
  isKickPlayerMessage,
} from "../types/types";
import { RoomManager } from "./roomManager";
import { Participant, WebSocketMessage } from "@shared/types/websocket";

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Initialize RoomManager
const roomManager = new RoomManager();

// Store connected clients with their team names and roles
const clients = new Map<
  WebSocket,
  {
    teamName: string;
    roomId?: string;
    role?: Participant["role"];
  }
>();

// WebSocket connection handler
wss.on("connection", (ws: WebSocket) => {
  console.log("New client connected");

  // Send welcome message
  ws.send(
    JSON.stringify({
      type: "connection",
      message: "Connected to WebSocket server",
    })
  );
  if (roomManager.getRooms().length > 0) {
    ws.send(
      JSON.stringify({
        type: "list_rooms",
        rooms: roomManager.getRooms(),
      })
    );
  }

  // Handle incoming messages
  ws.on("message", (data: string) => {
    try {
      const message = JSON.parse(data.toString()) as WebSocketMessage;

      console.log("Received:", message);

      switch (message.type) {
        case "create_room":
          // Create the room and let RoomManager handle all messaging
          roomManager.createRoom(message.roomName, ws);

          // Broadcast updated room list to all connected clients
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(
                JSON.stringify({
                  type: "list_rooms",
                  rooms: roomManager.getRooms(),
                })
              );
            }
          });
          break;

        case "join_room":
          if (isJoinRoomMessage(message)) {
            const joined = roomManager.joinRoom(
              message.roomId,
              ws,
              message.role as Participant["role"]
            );
            if (joined) {
              // Update client info
              const clientInfo = clients.get(ws) || { teamName: "Unknown" };
              clientInfo.roomId = message.roomId;
              clientInfo.role = message.role as Participant["role"];
              clients.set(ws, clientInfo);

              // Notify others in the room
              roomManager.broadcastToRoomExcept(
                message.roomId,
                {
                  type: "connection",
                  message: `${clientInfo.teamName} has joined as ${message.role}`,
                },
                ws
              );

              // Send updated participant list to all room members
              const participants = roomManager.getParticipants(message.roomId);
              roomManager.broadcastToRoom(message.roomId, {
                type: "participants_list",
                roomId: message.roomId,
                participants,
              });

              ws;
            } else {
              ws.send(
                JSON.stringify({
                  type: "error",
                  error:
                    message.role === "admin"
                      ? "Room already has an admin"
                      : "Failed to join room",
                })
              );
            }
          }
          break;

        case "load_quiz":
          if (isLoadQuizMessage(message)) {
            const role = roomManager.getRoomRole(message.roomId, ws);
            if (role !== "admin") {
              ws.send(
                JSON.stringify({
                  type: "error",
                  error: "Only admins can load quizzes",
                })
              );
              break;
            }

            const loaded = roomManager.loadQuiz(message.roomId, message.quiz);
            if (loaded) {
              // Notify everyone in the room
              roomManager.broadcastToRoom(message.roomId, {
                type: "quiz_loaded",
                roomId: message.roomId,
                quiz: message.quiz,
              });
            } else {
              ws.send(
                JSON.stringify({
                  type: "error",
                  error: "Failed to load quiz",
                })
              );
            }
          }
          break;

        case "delete_room":
          const role = roomManager.getRoomRole(message.roomId, ws);

          if (role !== "admin") {
            ws.send(
              JSON.stringify({
                type: "error",
                error: "Only admins can delete rooms",
              })
            );
            break;
          }

          const deleted = roomManager.deleteRoom(message.roomId);
          if (deleted) {
            // Send confirmation to the admin who deleted the room
            ws.send(
              JSON.stringify({
                type: "room_deleted",
                roomId: message.roomId,
              })
            );
          } else {
            ws.send(
              JSON.stringify({
                type: "error",
                error: "Room not found or could not be deleted",
              })
            );
          }
          break;

        case "list_rooms":
          ws.send(
            JSON.stringify({
              type: "list_rooms",
              rooms: roomManager.getRooms(),
            })
          );
          break;

        case "leave_room":
          roomManager.leaveRoom(message.roomId, ws);
          break;

        case "register":
          if (isRegisterMessage(message)) {
            const clientInfo = {
              teamName: message.teamName,
              roomId: message.roomId,
            };
            clients.set(ws, clientInfo);
            roomManager.setClientTeamName(ws, message.teamName);

            if (message.roomId) {
              const joined = roomManager.joinRoom(message.roomId, ws, "player");
              if (joined) {
                // Notify all participants in the room
                roomManager.broadcastToRoom(message.roomId, {
                  type: "connection",
                  message: `Team ${message.teamName} has joined the room`,
                });
              }
            }

            console.log(`Team ${message.teamName} registered`);
          }
          break;

        case "kick_player":
          if (isKickPlayerMessage(message)) {
            // Check if sender is admin
            const adminRole = roomManager.getRoomRole(message.roomId, ws);
            if (adminRole !== "admin") {
              ws.send(
                JSON.stringify({
                  type: "error",
                  error: "Only admins can kick players",
                })
              );
              break;
            }

            // Try to kick the player
            const kickedSocket = roomManager.kickPlayer(
              message.roomId,
              message.teamName
            );
            if (kickedSocket) {
              // Notify the kicked player
              kickedSocket.send(
                JSON.stringify({
                  type: "player_kicked",
                  roomId: message.roomId,
                  teamName: message.teamName,
                })
              );

              // Notify other participants
              roomManager.broadcastToRoom(message.roomId, {
                type: "connection",
                message: `${message.teamName} has been kicked from the room`,
              });

              // Send updated participant list
              const participants = roomManager.getParticipants(message.roomId);
              roomManager.broadcastToRoom(message.roomId, {
                type: "participants_list",
                roomId: message.roomId,
                participants,
              });

              // Clean up client info for kicked player
              clients.delete(kickedSocket);
            } else {
              ws.send(
                JSON.stringify({
                  type: "error",
                  error: "Player not found or could not be kicked",
                })
              );
            }
          }
          break;

        case "start_game":
          roomManager.startGame(message.roomId);
          break;
        case "next_round":
          roomManager.handleNextRound(message.roomId);
          break;

        case "submit_answer":
          roomManager.handleAnswer(
            message.roomId,
            message.teamName,
            message.answer
          );
          break;

        case "adjust_points":
          roomManager.handlePointAdjustment(
            message.roomId,
            message.teamName,
            message.pointAdjustment
          );
          break;

        case "button_pressed":
          roomManager.handleButtonPress(message.roomId, message.teamName);
          break;

        default:
          ws.send(JSON.stringify({ type: "echo", data: message }));
      }
    } catch (error) {
      console.error("Error processing message:", error);
      ws.send(
        JSON.stringify({ type: "error", error: "Invalid message format" })
      );
    }
  });

  // Handle client disconnection
  ws.on("close", () => {
    const clientInfo = clients.get(ws);
    if (clientInfo) {
      console.log(`Team ${clientInfo.teamName} disconnected`);

      if (clientInfo.roomId) {
        const wasAdmin = clientInfo.role === "admin";
        roomManager.removeParticipant(ws);
        const room = roomManager.getRoom(clientInfo.roomId);
        if (room) {
          // Send updated participant list to remaining members
          const participants = roomManager.getParticipants(clientInfo.roomId);
          roomManager.broadcastToRoom(clientInfo.roomId, {
            type: "participants_list",
            roomId: clientInfo.roomId,
            participants,
          });

          // Notify about the team leaving
          roomManager.broadcastToRoom(room.id, {
            type: "connection",
            message: `Team ${clientInfo.teamName} has left the room${
              wasAdmin ? " (admin)" : ""
            }`,
          });
        }
      }
    }
    clients.delete(ws);
  });
});

// Basic health check endpoint
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    connectedTeams: Array.from(clients.values()).map(
      (client) => client.teamName
    ),
    rooms: roomManager.getRooms(),
  });
});

// Start the server
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
