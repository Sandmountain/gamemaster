"use client";

import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  WebSocketMessage,
  Room,
  ListRoomsMessage,
  Quiz,
} from "@shared/types/websocket";
import { ClientRoomState, ConnectionState } from "@/types/client";

interface WebSocketContextType extends ClientRoomState, ConnectionState {
  rooms: Room[];
  // Actions
  joinRoom: (roomId: string, role: "admin" | "player") => void;
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
  // Connection State
  isConnected: false,
  lastError: null,
  reconnectAttempts: 0,
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
    error: null,
  });

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

  const requestParticipantsList = useCallback(() => {
    if (currentRoomRef.current) {
      sendMessage({
        type: "list_participants",
        roomId: currentRoomRef.current,
      });
    }
  }, [sendMessage]);

  // Actions exposed to components
  const joinRoom = useCallback(
    (roomId: string, role: "admin" | "player") => {
      if (!connectionState.isConnected) {
        console.warn("Cannot join room: WebSocket not connected");
        return;
      }

      currentRoomRef.current = roomId;
      const room = rooms.find((r) => r.id === roomId);
      if (room) {
        setRoomState((prev) => ({ ...prev, currentRoom: room }));
      }
      sendMessage({
        type: "join_room",
        roomId,
        role,
      });
    },
    [rooms, sendMessage, connectionState.isConnected]
  );

  const leaveRoom = useCallback(() => {
    cleanupRoomState();
  }, [cleanupRoomState]);

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
            const roomsMessage = message as ListRoomsMessage;
            setRooms(roomsMessage.rooms);
            if (currentRoomRef.current) {
              const room = roomsMessage.rooms.find(
                (r) => r.id === currentRoomRef.current
              );
              if (room) {
                setRoomState((prev) => ({ ...prev, currentRoom: room }));
              }
            }
            break;

          case "room_joined":
            console.log("Room joined:", message);
            setRoomState((prev) => ({
              ...prev,
              error: null,
              isJoined: true,
            }));
            // Request participants list immediately after joining
            if (currentRoomRef.current) {
              requestParticipantsList();
            }
            break;

          case "participants_list":
            console.log("Participants list:", message);
            setRoomState((prev) => ({
              ...prev,
              participants: message.participants,
              // Set isJoined to true if we're in the participants list as admin
              isJoined:
                message.participants.some((p) => p.role === "admin") ||
                prev.isJoined,
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
            listRooms();
            break;

          case "error":
            if (message.error === "Room already has an admin") {
              // If we get this error but we're the admin, ignore it
              const isAdmin = roomState.participants.some(
                (p) => p.role === "admin"
              );
              if (!isAdmin) {
                setRoomState((prev) => ({
                  ...prev,
                  error: message.error,
                }));
              }
            } else {
              setRoomState((prev) => ({
                ...prev,
                error: message.error,
              }));
            }
            break;

          case "quiz_loaded":
          case "room_created":
            listRooms();
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
    [listRooms, requestParticipantsList, cleanupRoomState]
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

      if (currentRoomRef.current) {
        listRooms();
        requestParticipantsList();
      }
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
  }, [endpoint, handleMessage, listRooms, requestParticipantsList]);

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

  // Poll for participants list when in a room
  useEffect(() => {
    if (connectionState.isConnected && currentRoomRef.current) {
      const interval = setInterval(requestParticipantsList, 5000);
      return () => clearInterval(interval);
    }
  }, [connectionState.isConnected, requestParticipantsList]);

  return (
    <WebSocketContext.Provider
      value={{
        ...roomState,
        ...connectionState,
        rooms,
        sendMessage,
        joinRoom,
        leaveRoom,
        loadQuiz,
        listRooms,
      }}
    >
      <div>
        <div className="fixed top-4 right-4 flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg z-50">
          <div
            className={`w-3 h-3 rounded-full ${
              connectionState.isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="text-sm">
            {connectionState.isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
        {children}
      </div>
    </WebSocketContext.Provider>
  );
}
