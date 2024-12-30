"use client";

import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  WebSocketMessage,
  Room,
  Quiz,
  Participant,
  GameState,
} from "@shared/types/websocket";
import { ClientRoomState, ConnectionState } from "@/types/client";

interface WebSocketContextType extends ClientRoomState, ConnectionState {
  rooms: Room[];
  socket: WebSocket | null;
  currentRoom: Room | null;
  teamName: string | undefined;
  gameState: GameState | null;
  pressedTeam: string | null;
  isDisqualified: boolean;
  // Actions
  joinRoom: (roomId: string, role: Participant["role"]) => void;
  leaveRoom: () => void;
  loadQuiz: (roomId: string, quiz: Quiz) => void;
  listRooms: () => void;
  sendMessage: (message: WebSocketMessage) => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  // Room State
  rooms: [],
  currentRoom: null,
  participants: [],
  isJoined: false,
  error: null,
  teamName: "",
  gameState: null,
  pressedTeam: null,
  isDisqualified: false,
  // Connection State
  isConnected: false,
  lastError: null,
  reconnectAttempts: 0,
  socket: null,
  // Actions
  joinRoom: () => {},
  leaveRoom: () => {},
  loadQuiz: () => {},
  listRooms: () => {},
  sendMessage: () => {},
});

export const useWebSocket = () => useContext(WebSocketContext);

interface WebSocketProviderProps {
  children: React.ReactNode;
  endpoint: string;
}

export function WebSocketProvider({
  children,
  endpoint,
}: WebSocketProviderProps) {
  // Room State
  const [roomState, setRoomState] = useState<ClientRoomState>({
    currentRoom: null,
    participants: [],
    isJoined: false,
    teamName: "",
    error: null,
  });
  const [pressedTeam, setPressedTeam] = useState<string | null>(null);
  const [disqualifiedTeams, setDisqualifiedTeams] = useState<Set<string>>(
    new Set()
  );

  const [gameState, setGameState] = useState<GameState | null>(null);

  // Connection State
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    lastError: null,
    reconnectAttempts: 0,
  });

  const [rooms, setRooms] = useState<Room[]>([]);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentRoomRef = useRef<string | null>(null);

  const cleanupRoomState = useCallback(() => {
    currentRoomRef.current = null;
    setRoomState((prev) => ({
      ...prev,
      currentRoom: null,
      participants: [],
      isJoined: false,
    }));
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      console.log("Sending message:", message);
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket is not connected");
      setConnectionState((prev) => ({
        ...prev,
        lastError: "WebSocket is not connected",
      }));
    }
  }, []);

  // Actions exposed to components
  const joinRoom = useCallback(
    (roomId: string, role: Participant["role"]) => {
      if (!connectionState.isConnected) {
        console.warn("Cannot join room: WebSocket not connected");
        return;
      }
      console.log(socketRef.current);
      currentRoomRef.current = roomId;
      sendMessage({
        type: "join_room",
        roomId,
        role,
      });
    },
    [connectionState.isConnected, sendMessage]
  );

  const leaveRoom = useCallback(() => {
    if (currentRoomRef.current) {
      sendMessage({
        type: "leave_room",
        roomId: currentRoomRef.current,
      });
      cleanupRoomState();
    }
  }, [cleanupRoomState, sendMessage]);

  const loadQuiz = useCallback(
    (roomId: string, quiz: Quiz) => {
      sendMessage({
        type: "load_quiz",
        roomId,
        quiz,
      });
    },
    [sendMessage]
  );

  const listRooms = useCallback(() => {
    sendMessage({ type: "list_rooms", rooms: [] });
  }, [sendMessage]);

  // Handle incoming messages
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        console.log("Received message:", message);

        switch (message.type) {
          case "connection":
            console.log("Connection message:", message);
            break;

          case "list_rooms":
            setRooms(message.rooms);
            // Update current room data if we're in one of the rooms
            if (currentRoomRef.current) {
              const room = message.rooms.find(
                (r) => r.id === currentRoomRef.current
              );
              if (room) {
                setRoomState((prev) => ({
                  ...prev,
                  currentRoom: room,
                }));
              }
            }
            break;

          case "room_joined":
            if (message.room) {
              setRoomState((prev) => ({
                ...prev,
                error: null,
                isJoined: true,
                currentRoom: message.room,
                teamName: message.teamName,
                participants: [], // Reset participants, will be updated by next participants_list message
              }));
              currentRoomRef.current = message.room.id;
            } else {
              setRoomState((prev) => ({
                ...prev,
                error: "Failed to join room: Invalid response",
                isJoined: false,
              }));
            }
            break;

          case "room_created":
            console.log("Room created:", message);
            // Room list will be updated by the subsequent list_rooms message
            break;

          case "participants_list":
            setRoomState((prev) => ({
              ...prev,
              participants: message.participants,
            }));
            break;

          case "room_deleted":
            if (currentRoomRef.current === message.roomId) {
              cleanupRoomState();
              setRoomState((prev) => ({
                ...prev,
                error: "This room has been deleted",
              }));
            }
            break;

          case "error":
            console.log("Error message:", message);
            setRoomState((prev) => ({
              ...prev,
              error: message.error,
              isJoined: false,
            }));
            break;

          case "quiz_loaded":
            if (currentRoomRef.current === message.roomId) {
              setRoomState((prev) => {
                console.log("Previous room state:", prev);
                const newState = {
                  ...prev,
                  currentRoom: prev.currentRoom
                    ? {
                        ...prev.currentRoom,
                        quiz: message.quiz,
                      }
                    : null,
                };
                console.log("New room state:", newState);
                return newState;
              });

              // Also update the room in the rooms list
              setRooms((prevRooms) =>
                prevRooms.map((room) =>
                  room.id === message.roomId
                    ? { ...room, quiz: message.quiz }
                    : room
                )
              );
            }
            break;

          case "player_kicked":
            // These events will trigger a room update from the server
            break;

          case "game_started":
            setGameState(message.gameState);
            break;

          case "round_start":
            setGameState(message.gameState);
            break;

          case "round_end":
            setGameState(message.gameState);
            break;

          case "show_question":
            setGameState(message.gameState);
            break;

          case "game_state_update":
            console.log("Updating game state:", message.gameState);
            setGameState(message.gameState);
            break;

          case "button_pressed":
            // Update UI to show which team pressed first
            if (currentRoomRef.current === message.roomId) {
              setPressedTeam(message.teamName);
            }
            break;

          case "admin_judgement":
            // Handle admin's judgement of the answer
            if (currentRoomRef.current === message.roomId) {
              if (!message.correct) {
                setDisqualifiedTeams(
                  (prev) => new Set([...prev, message.teamName])
                );
                setPressedTeam(null);
              }
            }
            break;
        }
      } catch (error) {
        console.error("Error parsing message:", error);
        setConnectionState((prev) => ({
          ...prev,
          lastError: "Error parsing message",
        }));
      }
    },
    [cleanupRoomState]
  );

  // Connection management
  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) return;
    const ws = new WebSocket(endpoint);

    ws.onopen = () => {
      setConnectionState((prev) => ({
        ...prev,
        isConnected: true,
        lastError: null,
      }));
      socketRef.current = ws;
    };

    ws.onmessage = handleMessage;

    ws.onclose = () => {
      setConnectionState((prev) => ({
        ...prev,
        isConnected: false,
        reconnectAttempts: prev.reconnectAttempts + 1,
      }));
      socketRef.current = null;

      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 2000);
    };

    ws.onerror = () => {
      setConnectionState((prev) => ({
        ...prev,
        lastError: "WebSocket error occurred",
      }));
      ws.close();
    };
  }, [endpoint, handleMessage]);

  // Initialize connection
  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [connect]);

  const isDisqualified = useMemo(() => {
    return disqualifiedTeams.has(roomState.teamName ?? "");
  }, [disqualifiedTeams, roomState.teamName]);

  return (
    <WebSocketContext.Provider
      value={{
        ...roomState,
        ...connectionState,
        rooms,
        socket: socketRef.current,
        gameState,
        pressedTeam,
        isDisqualified,
        sendMessage,
        joinRoom,
        leaveRoom,
        loadQuiz,
        listRooms,
      }}
    >
      <div>
        <div className="fixed top-4 px-4 flex items-center justify-between z-50 w-full">
          {roomState.isJoined ? (
            <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg text-sm">
              Joined {roomState.currentRoom?.name}
            </div>
          ) : (
            <div className="w-1 h-1"></div>
          )}
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg">
            <div
              className={`w-3 h-3 rounded-full ${
                connectionState.isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-sm">
              {connectionState.isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
        {children}
      </div>
    </WebSocketContext.Provider>
  );
}
