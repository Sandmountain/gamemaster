/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useGameEvents } from "@/hooks/useGameEvents";

export default function ViewRoomPage({
  params,
}: {
  params: { roomId: string };
}) {
  const router = useRouter();

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const resolvedParams = use(params) as { roomId: string };
  const roomId = resolvedParams.roomId;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const controlUrl = `${appUrl}/controller/${roomId}`;

  const {
    currentRoom,
    isJoined,
    isConnected,
    error,
    sendMessage,
    joinRoom,
    listRooms,
    socket,
  } = useWebSocket();

  const { countdown, currentQuestion, roundTime } = useGameEvents(socket);

  // Request room list and join as viewer when connected
  useEffect(() => {
    if (isConnected && !isJoined) {
      // First get the room list to ensure the room exists
      listRooms();

      // Register with a generic viewer name
      sendMessage({
        type: "register",
        teamName: `Viewer-${Math.random().toString(36).substring(7)}`,
        roomId,
        role: "viewer",
      });

      // Join as viewer
      joinRoom(roomId, "viewer");
    }
  }, [isConnected, isJoined, roomId, sendMessage, listRooms, joinRoom]);

  // If there's an error, redirect back to view page
  useEffect(() => {
    if (error) {
      router.push("/view");
    }
  }, [error, router]);

  if (!isConnected) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center min-h-screen">
        <div className="text-2xl text-gray-500 dark:text-gray-400">
          Connecting to server...
        </div>
      </div>
    );
  }

  if (!currentRoom || !isJoined) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center min-h-screen">
        <div className="text-2xl text-gray-500 dark:text-gray-400">
          Joining room...
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-screen">
      <div className="w-full max-w-4xl">
        {!currentQuestion && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg mb-8">
            <h1 className="text-3xl font-bold mb-4">{currentRoom.name}</h1>

            <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-2">Join this room</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Scan the QR code or share the link to join this room:
                </p>
                <input
                  type="text"
                  readOnly
                  value={controlUrl}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-md text-sm"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
              </div>
              <div className="flex flex-col items-center bg-white dark:bg-gray-700 p-4 rounded-lg">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                    controlUrl
                  )}`}
                  width={150}
                  height={150}
                  alt="QR Code"
                  className="w-32 h-32"
                />
              </div>
            </div>

            {!currentRoom.quiz && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <p className="text-yellow-700 dark:text-yellow-300">
                  Waiting for admin to load a quiz...
                </p>
              </div>
            )}
          </div>
        )}

        {countdown !== null && (
          <div className="text-6xl font-bold animate-pulse text-center my-12">
            Game starting in {countdown}
          </div>
        )}

        {currentQuestion && (
          <div className="w-full space-y-8">
            {/* Time remaining bar */}
            {roundTime !== null && (
              <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-1000"
                  style={{
                    width: `${(roundTime / currentQuestion.roundTime) * 100}%`,
                  }}
                />
              </div>
            )}

            {/* Question */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg text-center">
              <h2 className="text-4xl md:text-6xl font-bold mb-8">
                {currentQuestion.question}
              </h2>

              {/* Alternatives */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {currentQuestion.alternatives?.map((alternative, index) => (
                  <div
                    key={index}
                    className="p-6 bg-gray-100 dark:bg-gray-700 rounded-lg text-2xl text-center"
                  >
                    {alternative}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
