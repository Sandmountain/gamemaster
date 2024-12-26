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
  | "participants_list";

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

export interface Room {
  id: string;
  name: string;
  participantCount: number;
  quiz?: string;
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
  | JoinRoomMessage
  | RoomJoinedMessage
  | ListParticipantsMessage
  | ParticipantsListMessage
  | LoadQuizMessage
  | QuizLoadedMessage
  | ListRoomsMessage
  | ErrorMessage;
