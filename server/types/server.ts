import { WebSocket } from "ws";
import { Room, Participant, Quiz } from "@shared/types/websocket";

// Server-specific room interface that includes WebSocket connections
export interface ServerRoom extends Omit<Room, "participantCount" | "quiz"> {
  participants: Map<WebSocket, Participant>;
  quiz?: Quiz;
}

// Server-side client tracking
export interface ConnectedClient {
  ws: WebSocket;
  teamName?: string;
  roomId?: string;
  role?: "admin" | "player";
}

// Server configuration
export interface ServerConfig {
  port: number;
  host: string;
}

// Room manager internal types
export interface RoomManagerState {
  rooms: Map<string, ServerRoom>;
  clientTeamNames: Map<WebSocket, string>;
}
