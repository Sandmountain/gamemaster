"use client";

import { useState, useEffect } from "react";
import { useWebSocket } from "@/contexts/WebSocketContext";

export default function ControllPage() {
  const [teamName, setTeamName] = useState<string>("");
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const {
    rooms,
    currentRoom,
    isConnected,
    isJoined,
    error,
    joinRoom,
    listRooms,
    sendMessage,
  } = useWebSocket();

  // Clear selected room if it no longer exists
  useEffect(() => {
    if (selectedRoom && !rooms.some((room) => room.id === selectedRoom)) {
      setSelectedRoom(null);
      setTeamName("");
    }
  }, [rooms, selectedRoom]);

  // Request rooms list when connected
  useEffect(() => {
    if (isConnected) {
      listRooms();
      const interval = setInterval(listRooms, 5000);
      return () => clearInterval(interval);
    }
  }, [isConnected, listRooms]);

  const handleJoinRoom = (roomId: string) => {
    setSelectedRoom(roomId);
    setTeamName(""); // Clear team name when selecting a new room
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (teamName.trim() && selectedRoom) {
      // First register the team name
      sendMessage({
        type: "register",
        teamName: teamName.trim(),
        roomId: selectedRoom,
      });
      // Then join the room as a player
      joinRoom(selectedRoom, "player");
    }
  };

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Control Panel</h1>

      {error && (
        <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <p className="text-yellow-700 dark:text-yellow-300">{error}</p>
        </div>
      )}

      {!isJoined ? (
        <div className="space-y-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Available Rooms</h2>
            {rooms.length > 0 ? (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {rooms.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => handleJoinRoom(room.id)}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      selectedRoom === room.id
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900"
                        : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
                    }`}
                  >
                    <h3 className="font-semibold">{room.name}</h3>
                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      <p>Participants: {room.participantCount}</p>
                      {room.quiz && (
                        <p className="text-green-600 dark:text-green-400">
                          Quiz Loaded: {room.quiz.name}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                No rooms available. Please wait for an admin to create one.
              </p>
            )}
          </div>

          {selectedRoom && rooms.some((room) => room.id === selectedRoom) && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg max-w-md mx-auto">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="teamName"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
                  >
                    Enter Team Name for{" "}
                    {rooms.find((r) => r.id === selectedRoom)?.name}
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
          )}
        </div>
      ) : (
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
      )}
    </div>
  );
}
