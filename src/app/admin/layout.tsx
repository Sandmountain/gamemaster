"use client";

import { WebSocketProvider } from "@/contexts/WebSocketContext";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

  return <WebSocketProvider endpoint={wsUrl}>{children}</WebSocketProvider>;
}
