import { WebSocket } from "ws";

export interface Room {
  id: string;
  name: string;
  participants: Map<WebSocket, { role: "admin" | "player" }>;
  quiz?: Quiz;
}

export interface QuizQuestion {
  question: string;
  type: "geo" | "multiple";
  time: number;
  alternatives: string[] | null;
}

export interface Quiz {
  name: string;
  questions: QuizQuestion[];
}

// WebSocket Message Types
export type WebSocketMessageType =
  | "register"
  | "connection"
  | "echo"
  | "error"
  | "create_room"
  | "room_created"
  | "list_rooms"
  | "delete_room"
  | "room_deleted"
  | "load_quiz"
  | "quiz_loaded"
  | "join_room"
  | "room_joined"
  | "list_participants"
  | "participants_list"
  | "kick_player"
  | "player_kicked";

// Message Interfaces
export interface BaseMessage {
  type: WebSocketMessageType;
}

export interface RegisterMessage extends BaseMessage {
  type: "register";
  teamName: string;
  roomId?: string;
}

export interface ConnectionMessage extends BaseMessage {
  type: "connection";
  message: string;
}

export interface CreateRoomMessage extends BaseMessage {
  type: "create_room";
  roomName: string;
}

export interface RoomCreatedMessage extends BaseMessage {
  type: "room_created";
  roomId: string;
  roomName: string;
}

export interface ListRoomsMessage extends BaseMessage {
  type: "list_rooms";
  rooms: Array<{
    id: string;
    name: string;
    participantCount: number;
  }>;
}

export interface EchoMessage extends BaseMessage {
  type: "echo";
  data: unknown;
}

export interface ErrorMessage extends BaseMessage {
  type: "error";
  error: string;
}

export interface DeleteRoomMessage extends BaseMessage {
  type: "delete_room";
  roomId: string;
}

export interface RoomDeletedMessage extends BaseMessage {
  type: "room_deleted";
  roomId: string;
}

export interface JoinRoomMessage extends BaseMessage {
  type: "join_room";
  roomId: string;
  role: "admin" | "player";
}

export interface RoomJoinedMessage extends BaseMessage {
  type: "room_joined";
  roomId: string;
  role: "admin" | "player";
}

export interface LoadQuizMessage extends BaseMessage {
  type: "load_quiz";
  roomId: string;
  quiz: Quiz;
}

export interface QuizLoadedMessage extends BaseMessage {
  type: "quiz_loaded";
  roomId: string;
  quizName: string;
}

export interface ListParticipantsMessage extends BaseMessage {
  type: "list_participants";
  roomId: string;
}

export interface ParticipantsListMessage extends BaseMessage {
  type: "participants_list";
  roomId: string;
  participants: Array<{
    teamName: string;
    role: "admin" | "player";
  }>;
}

export interface KickPlayerMessage extends BaseMessage {
  type: "kick_player";
  roomId: string;
  teamName: string;
}

export interface PlayerKickedMessage extends BaseMessage {
  type: "player_kicked";
  roomId: string;
  teamName: string;
}

// Union type of all possible messages
export type WebSocketMessage =
  | RegisterMessage
  | ConnectionMessage
  | CreateRoomMessage
  | RoomCreatedMessage
  | ListRoomsMessage
  | DeleteRoomMessage
  | RoomDeletedMessage
  | JoinRoomMessage
  | RoomJoinedMessage
  | LoadQuizMessage
  | QuizLoadedMessage
  | ListParticipantsMessage
  | ParticipantsListMessage
  | KickPlayerMessage
  | PlayerKickedMessage
  | EchoMessage
  | ErrorMessage;

// Type guard functions
export const isRegisterMessage = (
  message: WebSocketMessage
): message is RegisterMessage => {
  return message.type === "register" && typeof message.teamName === "string";
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

export const isListParticipantsMessage = (
  message: WebSocketMessage
): message is ListParticipantsMessage => {
  return (
    message.type === "list_participants" && typeof message.roomId === "string"
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
