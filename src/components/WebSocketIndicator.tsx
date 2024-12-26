"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { WebSocketMessage } from "@/types/websocket";

interface WebSocketIndicatorProps {
  endpoint: string;
  teamName?: string;
  onConnectionEstablished?: (ws: WebSocket) => void;
  onMessage?: (data: WebSocketMessage) => void;
}

export default function WebSocketIndicator({
  endpoint,
  teamName,
  onConnectionEstablished,
  onMessage,
}: WebSocketIndicatorProps) {
  const [status, setStatus] = useState<"connected" | "disconnected">(
    "disconnected"
  );
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const ws = new WebSocket(endpoint);

    ws.onopen = () => {
      setStatus("connected");
      wsRef.current = ws;
      onConnectionEstablished?.(ws);

      if (teamName) {
        ws.send(
          JSON.stringify({
            type: "register",
            teamName: teamName,
          })
        );
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WebSocketMessage;
        console.log("Received message:", data);
        onMessage?.(data);
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    };

    ws.onclose = () => {
      setStatus("disconnected");
      wsRef.current = null;

      // Attempt to reconnect after 2 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 2000);
    };

    ws.onerror = () => {
      ws.close();
    };

    return ws;
  }, [endpoint, teamName, onConnectionEstablished, onMessage]);

  useEffect(() => {
    const ws = connect();

    return () => {
      ws?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed top-4 right-4 flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg">
      <div
        className={`w-3 h-3 rounded-full ${
          status === "connected" ? "bg-green-500" : "bg-red-500"
        }`}
      />
      <span className="text-sm">
        {status === "connected"
          ? teamName
            ? `Connected as ${teamName}`
            : "Connected"
          : "Disconnected"}
      </span>
    </div>
  );
}
