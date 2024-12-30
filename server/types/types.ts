import {
  JoinRoomMessage,
  KickPlayerMessage,
  LoadQuizMessage,
  Quiz,
  RegisterMessage,
  WebSocketMessage,
} from "@shared/types/websocket";
import { WebSocket } from "ws";

export interface Room {
  id: string;
  name: string;
  participants: Map<WebSocket, { role: "admin" | "player" }>;
  quiz?: Quiz;
}

// Type guard functions
export const isRegisterMessage = (
  message: WebSocketMessage
): message is RegisterMessage => {
  return (
    message.type === "register" &&
    typeof message.teamName === "string" &&
    typeof message.role === "string"
  );
};

export const isJoinRoomMessage = (
  message: WebSocketMessage
): message is JoinRoomMessage => {
  return (
    message.type === "join_room" &&
    typeof message.roomId === "string" &&
    (message.role === "admin" || message.role === "player")
  );
};

export const isLoadQuizMessage = (
  message: WebSocketMessage
): message is LoadQuizMessage => {
  return (
    message.type === "load_quiz" &&
    typeof message.roomId === "string" &&
    message.quiz &&
    Array.isArray(message.quiz.questions)
  );
};

export const isKickPlayerMessage = (
  message: WebSocketMessage
): message is KickPlayerMessage => {
  return (
    message.type === "kick_player" &&
    typeof message.roomId === "string" &&
    typeof message.teamName === "string"
  );
};
