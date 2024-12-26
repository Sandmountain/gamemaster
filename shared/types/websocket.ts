// WebSocket Message Types
export type WebSocketMessageType =
  | "register"
  | "connection"
  | "echo"
  | "error"
  | "create_room"
  | "room_created"
  | "list_rooms";

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
  data: WebSocketMessage;
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
  | ListRoomsMessage
  | EchoMessage
  | ErrorMessage;

// Type guard functions
export const isRegisterMessage = (
  message: WebSocketMessage
): message is RegisterMessage => {
  return message.type === "register" && typeof message.teamName === "string";
};

export const isRoomCreatedMessage = (
  message: WebSocketMessage
): message is RoomCreatedMessage => {
  return message.type === "room_created" && typeof message.roomId === "string";
};

export const isListRoomsMessage = (
  message: WebSocketMessage
): message is ListRoomsMessage => {
  return message.type === "list_rooms" && Array.isArray(message.rooms);
};
