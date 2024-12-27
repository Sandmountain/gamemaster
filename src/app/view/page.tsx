"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWebSocket } from "@/contexts/WebSocketContext";

export default function ViewPage() {
  const router = useRouter();
  const { rooms, isConnected, listRooms, sendMessage, joinRoom } =
    useWebSocket();

  // Request rooms list when connected
  useEffect(() => {
    if (isConnected) {
      listRooms();
      const interval = setInterval(listRooms, 5000);
      return () => clearInterval(interval);
    }
  }, [isConnected, listRooms]);

  const handleJoinAsViewer = (roomId: string) => {
    // Register with a generic viewer name
    sendMessage({
      type: "register",
      teamName: `Viewer-${Math.random().toString(36).substring(7)}`,
      roomId,
    });
    // Join as viewer
    joinRoom(roomId, "viewer");
    // Navigate to the room view
    router.push(`/view/${roomId}`);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen p-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <p className="text-gray-600 dark:text-gray-300">Connecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-6">Available Rooms</h1>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room) => (
          <div
            key={room.id}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg"
          >
            <h2 className="text-xl font-semibold mb-2">{room.name}</h2>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              <p>Participants: {room.participantCount}</p>
              {room.quiz && (
                <p className="text-green-600 dark:text-green-400">
                  Quiz Loaded: {room.quiz.name}
                </p>
              )}
            </div>
            <button
              onClick={() => handleJoinAsViewer(room.id)}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path
                  fillRule="evenodd"
                  d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                  clipRule="evenodd"
                />
              </svg>
              View Room
            </button>
          </div>
        ))}
        {rooms.length === 0 && (
          <div className="col-span-full text-center text-gray-500 dark:text-gray-400">
            No active rooms available. Please wait for an admin to create one.
          </div>
        )}
      </div>
    </div>
  );
}
