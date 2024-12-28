import { WebSocket } from "ws";
import { WebSocketMessage, Quiz, Participant } from "@shared/types/websocket";
import { ServerRoom } from "../types/server";

export class RoomManager {
  private rooms: Map<string, ServerRoom>;
  private clientTeamNames: Map<WebSocket, string>;
  private gameTimers: Map<string, NodeJS.Timeout>;

  constructor() {
    this.rooms = new Map();
    this.clientTeamNames = new Map();
    this.gameTimers = new Map();
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
            console.log("Join successful");
            // The joinRoom method now handles sending the room_joined message
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
            console.log("Loading quiz from admin");
            if (this.loadQuiz(message.roomId, message.quiz)) {
              // Send confirmation to the admin
              ws.send(
                JSON.stringify({
                  type: "quiz_loaded",
                  roomId: message.roomId,
                  quizName: message.quiz.name,
                })
              );

              // Broadcast to room
              this.broadcastToRoom(message.roomId, {
                type: "quiz_loaded",
                roomId: message.roomId,
                quiz: message.quiz,
              });

              // Update room list for everyone
              this.broadcastToAll({
                type: "list_rooms",
                rooms: this.getRooms(),
              });
            } else {
              ws.send(
                JSON.stringify({
                  type: "error",
                  error: "Failed to load quiz",
                })
              );
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

        case "start_game":
          if (this.getRoomRole(message.roomId, ws) === "admin") {
            const room = this.getRoom(message.roomId);
            if (room && room.quiz) {
              // Start the game
              this.startGame(message.roomId);
            } else {
              ws.send(
                JSON.stringify({
                  type: "error",
                  error: "No quiz loaded for this room",
                })
              );
            }
          } else {
            ws.send(
              JSON.stringify({
                type: "error",
                error: "Only admin can start the game",
              })
            );
          }
          break;

        case "leave_room":
          this.removeParticipant(ws);
          // Send confirmation to the client
          ws.send(
            JSON.stringify({
              type: "connection",
              message: "Left room successfully",
            })
          );
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

    // Send room created message to creator
    creator.send(
      JSON.stringify({
        type: "room_created",
        roomId: room.id,
        roomName: room.name,
      })
    );

    // Send room joined message to creator with room data
    creator.send(
      JSON.stringify({
        type: "room_joined",
        roomId: room.id,
        role: "admin",
        room: {
          id: room.id,
          name: room.name,
          participantCount: 1,
          quiz: room.quiz,
        },
      })
    );

    // Send updated participant list
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
      if (room.participants.has(ws)) {
        const participantInfo = room.participants.get(ws);
        const wasAdmin = participantInfo?.role === "admin";
        room.participants.delete(ws);

        if (room.participants.size === 0) {
          this.rooms.delete(roomId);
          // Broadcast room deletion
          this.broadcastToAll({
            type: "list_rooms",
            rooms: this.getRooms(),
          });
        } else {
          // Broadcast updated participant list
          this.broadcastToRoom(roomId, {
            type: "participants_list",
            roomId,
            participants: this.getParticipants(roomId),
          });

          if (wasAdmin) {
            // Notify remaining participants that admin left
            this.broadcastToRoom(roomId, {
              type: "connection",
              message:
                "Admin has disconnected. Room is now available for a new admin.",
            });
          }
        }
      }
    });
  }

  joinRoom(
    roomId: string,
    participant: WebSocket,
    role: Participant["role"]
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

      // Send join confirmation with room data for all roles
      participant.send(
        JSON.stringify({
          type: "room_joined",
          roomId,
          role,
          room: {
            id: room.id,
            name: room.name,
            participantCount: room.participants.size,
            quiz: room.quiz,
          },
        })
      );

      // Broadcast updated participant list to all room members
      this.broadcastToRoom(roomId, {
        type: "participants_list",
        roomId,
        participants: this.getParticipants(roomId),
      });

      // Broadcast room update to all connected clients
      this.broadcastToAll({
        type: "list_rooms",
        rooms: this.getRooms(),
      });

      return true;
    }
    return false;
  }

  getRoomRole(
    roomId: string,
    participant: WebSocket
  ): "admin" | "player" | undefined {
    const room = this.rooms.get(roomId);
    return room?.participants.get(participant)?.role as
      | "admin"
      | "player"
      | undefined;
  }

  loadQuiz(roomId: string, quiz: Quiz): boolean {
    const room = this.rooms.get(roomId);
    if (room) {
      room.quiz = quiz;

      // Send confirmation to all room members with full quiz data
      this.broadcastToRoom(roomId, {
        type: "quiz_loaded",
        roomId,
        quiz, // Send the entire quiz object
      });

      // Update room list for everyone
      this.broadcastToAll({
        type: "list_rooms",
        rooms: this.getRooms(),
      });

      return true;
    }
    return false;
  }

  getRooms() {
    return Array.from(this.rooms.values()).map((room) => ({
      id: room.id,
      name: room.name,
      participantCount: room.participants.size,
      quiz: room.quiz,
    }));
  }

  getRoom(roomId: string): ServerRoom | undefined {
    return this.rooms.get(roomId);
  }

  deleteRoom(roomId: string): boolean {
    if (this.gameTimers.has(roomId)) {
      clearTimeout(this.gameTimers.get(roomId));
      this.gameTimers.delete(roomId);
    }
    const room = this.rooms.get(roomId);
    if (room) {
      // First notify all participants in the room
      this.broadcastToRoom(roomId, {
        type: "room_deleted",
        roomId,
      });

      // Clean up participant references
      room.participants.forEach((_, participant) => {
        this.clientTeamNames.delete(participant);
      });

      // Delete the room
      this.rooms.delete(roomId);

      // Broadcast updated room list to all connected clients
      this.broadcastToAll({
        type: "list_rooms",
        rooms: this.getRooms(),
      });

      return true;
    }
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
  ): Array<{ teamName: string; role: Participant["role"] }> {
    const room = this.rooms.get(roomId);
    if (!room) return [];

    return Array.from(room.participants.entries()).map(([ws, { role }]) => ({
      teamName: this.clientTeamNames.get(ws) || "Gamemaster 🚀",
      role: role as Participant["role"],
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

  private startGame(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room || !room.quiz) return;

    // Clear any existing game timer
    if (this.gameTimers.has(roomId)) {
      clearTimeout(this.gameTimers.get(roomId));
    }

    // Notify all participants that the game is starting
    const startTime = Date.now() + 3000; // Start in 3 seconds
    this.broadcastToRoom(roomId, {
      type: "game_started",
      roomId,
      startTime,
    });

    // Start the question sequence
    this.gameTimers.set(
      roomId,
      setTimeout(() => this.showNextQuestion(roomId, 0), 3000)
    );
  }

  private showNextQuestion(roomId: string, questionIndex: number) {
    const room = this.rooms.get(roomId);
    if (!room || !room.quiz) return;

    const question = room.quiz.questions[questionIndex];
    if (!question) return; // No more questions

    // Send the question to all participants
    this.broadcastToRoom(roomId, {
      type: "show_question",
      roomId,
      question,
      questionIndex,
    });

    // Schedule next question if there is one
    if (questionIndex + 1 < room.quiz.questions.length) {
      this.gameTimers.set(
        roomId,
        setTimeout(
          () => this.showNextQuestion(roomId, questionIndex + 1),
          question.roundTime * 1000
        )
      );
    }
  }

  // New method to broadcast to all connected clients
  private broadcastToAll(message: WebSocketMessage) {
    this.rooms.forEach((room) => {
      room.participants.forEach((_, participant) => {
        if (participant.readyState === WebSocket.OPEN) {
          participant.send(JSON.stringify(message));
        }
      });
    });
  }
}
