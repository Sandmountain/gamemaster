import { Room, Participant } from "../../shared/types/websocket";

// Client-side room state
export interface ClientRoomState {
  currentRoom: Room | null;
  participants: Participant[];
  isJoined: boolean;
  teamName: string | undefined;
  error: string | null;
}

// WebSocket connection state
export interface ConnectionState {
  isConnected: boolean;
  lastError: string | null;
  reconnectAttempts: number;
}

// Environment configuration
export interface ClientConfig {
  wsUrl: string;
  appUrl: string;
}

// UI State types
export interface RoomViewState {
  isDeleting: boolean;
  isKicking: boolean;
  selectedPlayer: string | null;
}

export interface QuizState {
  isLoading: boolean;
  error: string | null;
}
