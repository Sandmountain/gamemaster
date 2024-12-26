"use client";

import { useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useWebSocket } from "@/contexts/WebSocketContext";

export default function ViewPage() {
  const { isConnected, listRooms } = useWebSocket();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const controlUrl = `${appUrl}/controll`;

  // Request rooms list when connected to keep connection alive
  useEffect(() => {
    if (isConnected) {
      listRooms();
      const interval = setInterval(listRooms, 5000);
      return () => clearInterval(interval);
    }
  }, [isConnected, listRooms]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-6">Join the Quiz!</h1>

        <div className="bg-white p-4 rounded-lg inline-block mb-4">
          <QRCodeSVG
            value={controlUrl}
            size={256}
            level="H"
            includeMargin={true}
            className="mx-auto"
          />
        </div>

        <div className="space-y-2">
          <p className="text-gray-600 dark:text-gray-300">
            Scan the QR code or visit:
          </p>
          <a
            href={controlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600 break-all"
          >
            {controlUrl}
          </a>
        </div>
      </div>
    </div>
  );
}
