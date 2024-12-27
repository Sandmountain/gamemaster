"use client";

import { useState } from "react";
import { use } from "react";
import { useWebSocket } from "@/contexts/WebSocketContext";

export default function JoinRoomPage({
  params,
}: {
  params: { roomId: string };
}) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const resolvedParams = use(params) as { roomId: string };
  const roomId = resolvedParams.roomId;

  const [teamName, setTeamName] = useState("");
  const { isConnected, isJoined, currentRoom, error, sendMessage, joinRoom } =
    useWebSocket();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (teamName.trim()) {
      // First register the team name
      sendMessage({
        type: "register",
        teamName: teamName.trim(),
        roomId,
      });
      // Then join the room as a player
      joinRoom(roomId, "player");
    }
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

  if (isJoined) {
    return (
      <div className="min-h-screen p-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <p className="text-gray-600 dark:text-gray-300">
            Connected as team: {teamName} in room: {currentRoom?.name}
          </p>
          {currentRoom?.quiz ? (
            <p className="mt-2 text-green-600 dark:text-green-400">
              Quiz is loaded and ready!
            </p>
          ) : (
            <p className="mt-2 text-yellow-600 dark:text-yellow-400">
              Waiting for admin to load quiz...
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6">Join Room</h1>

        {error && (
          <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-yellow-700 dark:text-yellow-300">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="teamName"
              className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
            >
              Enter Your Team Name
            </label>
            <input
              type="text"
              id="teamName"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Your team name"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-3 px-4 rounded-md hover:bg-blue-600 transition-colors"
          >
            Join Room
          </button>
        </form>
      </div>
    </div>
  );
}
