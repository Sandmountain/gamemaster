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
  Participant,
  ListRoomsMessage,
  Quiz,
} from "@/types/websocket";

interface WebSocketContextType {
  isConnected: boolean;
  currentRoom: Room | null;
  rooms: Room[];
  participants: Participant[];
  isJoined: boolean;
  error: string | null;
  // Actions
  joinRoom: (roomId: string, role: "admin" | "player") => void;
  leaveRoom: () => void;
  loadQuiz: (roomId: string, quiz: Quiz) => void;
  listRooms: () => void;
  sendMessage: (message: WebSocketMessage) => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  currentRoom: null,
  rooms: [],
  participants: [],
  isJoined: false,
  error: null,
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
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isJoined, setIsJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentRoomRef = useRef<string | null>(null);

  const cleanupRoomState = useCallback(() => {
    currentRoomRef.current = null;
    setCurrentRoom(null);
    setParticipants([]);
    setIsJoined(false);
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      console.log("Sending message:", message);
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket is not connected");
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
      currentRoomRef.current = roomId;
      const room = rooms.find((r) => r.id === roomId);
      if (room) {
        setCurrentRoom(room);
      }
      sendMessage({
        type: "join_room",
        roomId,
        role,
      });
    },
    [rooms, sendMessage]
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

        switch (message.type) {
          case "list_rooms":
            const roomsMessage = message as ListRoomsMessage;
            setRooms(roomsMessage.rooms);
            if (currentRoomRef.current) {
              const room = roomsMessage.rooms.find(
                (r) => r.id === currentRoomRef.current
              );
              if (room) {
                setCurrentRoom(room);
              }
            }
            break;

          case "room_joined":
            setError(null);
            setIsJoined(true);
            requestParticipantsList();
            break;

          case "participants_list":
            setParticipants(message.participants);
            const isAdmin = message.participants.some(
              (p) => p.role === "admin"
            );
            if (isAdmin) {
              setIsJoined(true);
            }
            break;

          case "room_deleted":
            if (currentRoomRef.current === message.roomId) {
              cleanupRoomState();
              setError("This room has been deleted");
            }
            listRooms(); // Update rooms list
            break;

          case "error":
            setError(message.error);
            if (message.error === "Room already has an admin") {
              setIsJoined(true);
            }
            break;

          case "quiz_loaded":
          case "room_created":
            listRooms();
            break;
        }
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    },
    [listRooms, requestParticipantsList, cleanupRoomState]
  );

  // Connection management
  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(endpoint);

    ws.onopen = () => {
      setIsConnected(true);
      socketRef.current = ws;
      console.log("WebSocket connected");

      // Restore room connection if needed
      if (currentRoomRef.current) {
        listRooms();
        requestParticipantsList();
      }
    };

    ws.onmessage = handleMessage;

    ws.onclose = () => {
      setIsConnected(false);
      socketRef.current = null;
      console.log("WebSocket disconnected");

      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 2000);
    };

    ws.onerror = () => {
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
    if (isConnected && currentRoomRef.current) {
      const interval = setInterval(requestParticipantsList, 5000);
      return () => clearInterval(interval);
    }
  }, [isConnected, requestParticipantsList]);

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        currentRoom,
        rooms,
        participants,
        isJoined,
        error,
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
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="text-sm">
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
        {children}
      </div>
    </WebSocketContext.Provider>
  );
}
