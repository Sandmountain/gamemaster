// Common types used by both frontend and backend
export interface QuizQuestion {
  question: string;
  type: "geo" | "multiple" | "first_to_press";
  alternatives: string[] | null;
  roundTime: number;
  correctAnswer: number;
}

export interface Quiz {
  name: string;
  questions: QuizQuestion[];
}

export interface Participant {
  teamName: string;
  role: "admin" | "player" | "viewer" | undefined;
}

export interface Room {
  id: string;
  name: string;
  participantCount: number;
  quiz?: Quiz;
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
  | "leave_room"
  | "participants_list"
  | "kick_player"
  | "player_kicked"
  | "start_game"
  | "game_started"
  | "next_question_start"
  | "next_question_stop"
  | "round_start"
  | "round_end"
  | "next_round"
  | "show_question"
  | "submit_answer"
  | "adjust_points"
  | "game_state_update"
  | "button_pressed"
  | "admin_judgement";

// Base Message Interface
export interface BaseMessage {
  type: WebSocketMessageType;
}

// Message Interfaces
export interface RegisterMessage extends BaseMessage {
  type: "register";
  teamName: string;
  roomId?: string;
  role: Participant["role"];
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
  role: Participant["role"];
}

export interface RoomJoinedMessage extends BaseMessage {
  type: "room_joined";
  roomId: string;
  role: Participant["role"];
  teamName: string;
  room: Room;
}

export interface LeaveRoomMessage extends BaseMessage {
  type: "leave_room";
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
  quiz: Quiz;
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

// Game state related messages
export interface StartGameMessage extends BaseMessage {
  type: "start_game";
  roomId: string;
}

export interface GameStartedMessage extends BaseMessage {
  type: "game_started";
  roomId: string;
  startTime: string;
  gameState: GameState;
}

export interface ShowQuestionMessage extends BaseMessage {
  type: "show_question";
  roomId: string;
  question: QuizQuestion;
  questionIndex: number;
  gameState: GameState;
}

// Game state types
export interface GameState {
  currentRoom: Room;
  isGameStarted: boolean;
  currentQuestion: number;
  teamPoints: {
    [teamName: string]: number;
  };
  startTime: string;
}

// Add new message interfaces
export interface NextQuestionStartMessage extends BaseMessage {
  type: "next_question_start";
  roomId: string;
  remainingTime: number;
  nextQuestionIndex: number;
  gameState: GameState;
}

export interface NextQuestionStopMessage extends BaseMessage {
  type: "next_question_stop";
  roomId: string;
  nextQuestionIndex: number;
  gameState: GameState;
}

export interface RoundStartMessage extends BaseMessage {
  type: "round_start";
  roomId: string;
  roundTime: number;
  questionIndex: number;
  gameState: GameState;
}

export interface RoundEndMessage extends BaseMessage {
  type: "round_end";
  roomId: string;
  questionIndex: number;
  gameState: GameState;
  roundScores?: {
    [teamName: string]: number;
  };
}

export interface NextRoundMessage extends BaseMessage {
  type: "next_round";
  roomId: string;
}

export interface SubmitAnswerMessage extends BaseMessage {
  type: "submit_answer";
  roomId: string;
  answer: number;
  teamName: string;
}

export interface AdjustPointsMessage extends BaseMessage {
  type: "adjust_points";
  roomId: string;
  teamName: string;
  pointAdjustment: number;
}

export interface GameStateUpdateMessage extends BaseMessage {
  type: "game_state_update";
  roomId: string;
  gameState: GameState;
}

export interface ButtonPressedMessage extends BaseMessage {
  type: "button_pressed";
  roomId: string;
  teamName: string;
}

export interface AdminJudgementMessage extends BaseMessage {
  type: "admin_judgement";
  roomId: string;
  teamName: string;
  correct: boolean;
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
  | LeaveRoomMessage
  | ParticipantsListMessage
  | ErrorMessage
  | KickPlayerMessage
  | PlayerKickedMessage
  | StartGameMessage
  | GameStartedMessage
  | NextQuestionStartMessage
  | NextQuestionStopMessage
  | ShowQuestionMessage
  | RoundStartMessage
  | RoundEndMessage
  | NextRoundMessage
  | SubmitAnswerMessage
  | AdjustPointsMessage
  | GameStateUpdateMessage
  | ButtonPressedMessage
  | AdminJudgementMessage;
