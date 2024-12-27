// Common types used by both frontend and backend
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

export interface Participant {
  teamName: string;
  role: "admin" | "player";
}

export interface Room {
  id: string;
  name: string;
  participantCount: number;
  quiz?: string;
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

// Base Message Interface
export interface BaseMessage {
  type: WebSocketMessageType;
}

// Message Interfaces
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

export interface ListParticipantsMessage extends BaseMessage {
  type: "list_participants";
  roomId: string;
}

export interface ParticipantsListMessage extends BaseMessage {
  type: "participants_list";
  roomId: string;
  participants: Participant[];
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

export interface ListRoomsMessage extends BaseMessage {
  type: "list_rooms";
  rooms: Room[];
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

export interface ErrorMessage extends BaseMessage {
  type: "error";
  error: string;
}

// Union type of all possible messages
export type WebSocketMessage =
  | RegisterMessage
  | ConnectionMessage
  | CreateRoomMessage
  | RoomCreatedMessage
  | DeleteRoomMessage
  | RoomDeletedMessage
  | LoadQuizMessage
  | QuizLoadedMessage
  | ListRoomsMessage
  | JoinRoomMessage
  | RoomJoinedMessage
  | ListParticipantsMessage
  | ParticipantsListMessage
  | KickPlayerMessage
  | PlayerKickedMessage
  | ErrorMessage;
