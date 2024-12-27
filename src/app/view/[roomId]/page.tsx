/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import { useWebSocket } from "@/contexts/WebSocketContext";

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
  const controlUrl = `${appUrl}/control/${roomId}`;

  const {
    currentRoom,
    isJoined,
    isConnected,
    error,
    sendMessage,
    joinRoom,
    listRooms,
  } = useWebSocket();
  const [countdown, setCountdown] = useState<number | null>(null);
  // const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(
  //   null
  // );
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

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
      });

      // Join as viewer
      joinRoom(roomId, "viewer");
    }
  }, [isConnected, isJoined, roomId, sendMessage, listRooms]);

  // If there's an error, redirect back to view page
  useEffect(() => {
    if (error) {
      router.push("/view");
    }
  }, [error, router]);

  // Countdown timer
  useEffect(() => {
    if (countdown === null) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 0) {
          clearInterval(timer);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  // Question timer
  useEffect(() => {
    if (timeLeft === null) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 0) {
          clearInterval(timer);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

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
      {!currentRoom || !isJoined ? (
        <div className="container mx-auto p-4 flex items-center justify-center min-h-screen">
          <div className="text-2xl text-gray-500 dark:text-gray-400">
            Joining room...
          </div>
        </div>
      ) : (
        <div className="w-full max-w-4xl">
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

          {countdown !== null && (
            <div className="text-6xl font-bold animate-pulse text-center my-12">
              Game starting in {countdown}
            </div>
          )}
          {/* 
      {currentQuestion && (
        <div className="w-full">
          <div className="mb-4 text-2xl font-bold text-center">
            Time left: {timeLeft}s
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-6">
              {currentQuestion.question}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestion.alternatives?.map((alternative, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-center"
                >
                  {alternative}
                </div>
              ))}
            </div>
          </div>
        </div>
      )} */}
        </div>
      )}
    </div>
  );
}
