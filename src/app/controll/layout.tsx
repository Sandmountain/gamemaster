"use client";

import { WebSocketProvider } from "@/contexts/WebSocketContext";

export default function ControllLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WebSocketProvider endpoint="ws://localhost:8000">
      {children}
    </WebSocketProvider>
  );
}
