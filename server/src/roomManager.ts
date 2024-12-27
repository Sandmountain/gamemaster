import { WebSocket } from "ws";
import {
  WebSocketMessage,
  Quiz,
  RoomDeletedMessage,
} from "@shared/types/websocket";
import { ServerRoom } from "../types/server";

export class RoomManager {
  private rooms: Map<string, ServerRoom>;
  private clientTeamNames: Map<WebSocket, string>;

  constructor() {
    this.rooms = new Map();
    this.clientTeamNames = new Map();
  }

  handleMessage(ws: WebSocket, message: WebSocketMessage) {
    try {
      switch (message.type) {
        case "create_room":
          const room = this.createRoom(message.roomName, ws);
          ws.send(
            JSON.stringify({
              type: "room_created",
              roomId: room.id,
              roomName: room.name,
            })
          );
          // Also send room_joined message since creator is automatically the admin
          // ws.send(
          //   JSON.stringify({
          //     type: "room_joined",
          //     roomId: room.id,
          //     role: "admin",
          //   })
          // );
          break;

        case "register":
          this.setClientTeamName(ws, message.teamName);
          ws.send(
            JSON.stringify({
              type: "connection",
              message: "Registration successful",
            })
          );
          break;

        case "join_room":
          console.log("Join room request:", message);
          if (this.joinRoom(message.roomId, ws, message.role)) {
            console.log("Join successful, sending confirmation");
            // Send join confirmation to the joiner
            ws.send(
              JSON.stringify({
                type: "room_joined",
                roomId: message.roomId,
                role: message.role,
              })
            );

            // Notify others in the room about the new participant
            const teamName = this.clientTeamNames.get(ws) || "Gamemaster 🚀";
            console.log("Broadcasting join to others, team:", teamName);
            this.broadcastToRoomExcept(
              message.roomId,
              {
                type: "connection",
                message: `${teamName} has joined as ${message.role}`,
              },
              ws
            );

            // Send updated participants list to everyone
            const participants = this.getParticipants(message.roomId);
            console.log("Sending participants list:", participants);
            this.broadcastToRoom(message.roomId, {
              type: "participants_list",
              roomId: message.roomId,
              participants,
            });
          } else {
            console.log("Join failed, sending error");
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
          break;

        case "list_rooms":
          ws.send(
            JSON.stringify({
              type: "list_rooms",
              rooms: this.getRooms(),
            })
          );
          break;

        case "list_participants":
          const participants = this.getParticipants(message.roomId);
          ws.send(
            JSON.stringify({
              type: "participants_list",
              roomId: message.roomId,
              participants,
            })
          );
          break;

        case "delete_room":
          const role = this.getRoomRole(message.roomId, ws);
          if (role === "admin") {
            this.deleteRoom(message.roomId);
          } else {
            ws.send(
              JSON.stringify({
                type: "error",
                error: "Only admin can delete room",
              })
            );
          }
          break;

        case "load_quiz":
          if (this.getRoomRole(message.roomId, ws) === "admin") {
            if (this.loadQuiz(message.roomId, message.quiz)) {
              this.broadcastToRoom(message.roomId, {
                type: "quiz_loaded",
                roomId: message.roomId,
                quizName: message.quiz.name,
              });
            }
          } else {
            ws.send(
              JSON.stringify({
                type: "error",
                error: "Only admin can load quiz",
              })
            );
          }
          break;

        case "kick_player":
          if (this.getRoomRole(message.roomId, ws) === "admin") {
            const kickedWs = this.kickPlayer(message.roomId, message.teamName);
            if (kickedWs) {
              // Notify the kicked player
              kickedWs.send(
                JSON.stringify({
                  type: "player_kicked",
                  roomId: message.roomId,
                  teamName: message.teamName,
                })
              );
              // Notify others in the room
              this.broadcastToRoom(message.roomId, {
                type: "player_kicked",
                roomId: message.roomId,
                teamName: message.teamName,
              });
            }
          } else {
            ws.send(
              JSON.stringify({
                type: "error",
                error: "Only admin can kick players",
              })
            );
          }
          break;
      }
    } catch (error) {
      console.error("Error handling message:", error);
      ws.send(
        JSON.stringify({
          type: "error",
          error: "Internal server error",
        })
      );
    }
  }

  handleDisconnect(ws: WebSocket) {
    this.removeParticipant(ws);
  }

  createRoom(name: string, creator: WebSocket): ServerRoom {
    const roomId = Math.random().toString(36).substring(7);
    const teamName = this.clientTeamNames.get(creator) || "Gamemaster 🚀";
    const room: ServerRoom = {
      id: roomId,
      name,
      participants: new Map([[creator, { role: "admin", teamName }]]),
    };
    this.rooms.set(roomId, room);

    // Send initial participants list
    this.broadcastToRoom(roomId, {
      type: "participants_list",
      roomId,
      participants: this.getParticipants(roomId),
    });

    return room;
  }

  removeParticipant(ws: WebSocket) {
    this.clientTeamNames.delete(ws);
    this.rooms.forEach((room, roomId) => {
      const participantInfo = room.participants.get(ws);
      const wasAdmin = participantInfo?.role === "admin";
      room.participants.delete(ws);

      if (room.participants.size === 0) {
        this.rooms.delete(roomId);
      } else if (wasAdmin) {
        // Notify remaining participants that the admin left and the role is available
        this.broadcastToRoom(roomId, {
          type: "connection",
          message:
            "Admin has disconnected. Room is now available for a new admin.",
        });
      }
    });
  }

  joinRoom(
    roomId: string,
    participant: WebSocket,
    role: "admin" | "player"
  ): boolean {
    const room = this.rooms.get(roomId);
    if (room) {
      // If joining as admin, check if there's already an admin
      if (role === "admin") {
        const hasAdmin = Array.from(room.participants.values()).some(
          (p) => p.role === "admin"
        );
        if (hasAdmin) {
          return false; // Only one admin allowed
        }
      }

      // Use the stored team name or a default
      const teamName = this.clientTeamNames.get(participant) || "Gamemaster 🚀";
      room.participants.set(participant, { role, teamName });
      return true;
    }
    return false;
  }

  getRoomRole(
    roomId: string,
    participant: WebSocket
  ): "admin" | "player" | undefined {
    const room = this.rooms.get(roomId);
    return room?.participants.get(participant)?.role;
  }

  loadQuiz(roomId: string, quiz: Quiz): boolean {
    const room = this.rooms.get(roomId);
    if (room) {
      room.quiz = quiz as Quiz;
      return true;
    }
    return false;
  }

  getRooms() {
    return Array.from(this.rooms.values()).map((room) => ({
      id: room.id,
      name: room.name,
      participantCount: room.participants.size,
      quiz: room.quiz?.name || "",
    }));
  }

  getRoom(roomId: string): ServerRoom | undefined {
    return this.rooms.get(roomId);
  }

  deleteRoom(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (room) {
      // Notify all participants that the room is being deleted
      const message: RoomDeletedMessage = {
        type: "room_deleted",
        roomId,
      };

      // First notify all participants
      this.broadcastToRoom(roomId, message);

      // Then clean up participant references
      room.participants.forEach((_, participant) => {
        // Remove room reference from any connected clients
        this.clientTeamNames.delete(participant);
      });

      // Finally delete the room
      this.rooms.delete(roomId);
      return true;
    }
    console.log("Room not found");
    return false;
  }

  broadcastToRoom(roomId: string, message: WebSocketMessage) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.participants.forEach((_, participant) => {
        if (participant.readyState === WebSocket.OPEN) {
          participant.send(JSON.stringify(message));
        }
      });
    }
  }

  broadcastToRoomExcept(
    roomId: string,
    message: WebSocketMessage,
    excludedParticipant: WebSocket
  ) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.participants.forEach((_, participant) => {
        if (
          participant !== excludedParticipant &&
          participant.readyState === WebSocket.OPEN
        ) {
          participant.send(JSON.stringify(message));
        }
      });
    }
  }

  setClientTeamName(ws: WebSocket, teamName: string) {
    this.clientTeamNames.set(ws, teamName);
  }

  getParticipants(
    roomId: string
  ): Array<{ teamName: string; role: "admin" | "player" }> {
    const room = this.rooms.get(roomId);
    if (!room) return [];

    return Array.from(room.participants.entries()).map(([ws, { role }]) => ({
      teamName: this.clientTeamNames.get(ws) || "Gamemaster 🚀",
      role,
    }));
  }

  kickPlayer(roomId: string, teamName: string): WebSocket | undefined {
    const room = this.rooms.get(roomId);
    if (!room) return undefined;

    // Find the WebSocket connection for the player with the given team name
    for (const [ws] of room.participants.entries()) {
      if (this.clientTeamNames.get(ws) === teamName) {
        // Remove from room
        room.participants.delete(ws);
        return ws;
      }
    }

    return undefined;
  }
}
