"use client";

import { useState, useEffect } from "react";
import { useWebSocket } from "@/contexts/WebSocketContext";

interface RoomsListProps {
  onRoomSelect: (roomId: string) => void;
}

export default function RoomsList({ onRoomSelect }: RoomsListProps) {
  const [roomName, setRoomName] = useState("");
  const { isConnected, sendMessage, listRooms, rooms } = useWebSocket();

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomName.trim()) {
      sendMessage({
        type: "create_room",
        roomName: roomName.trim(),
      });
      setRoomName("");
    }
  };

  const handleDeleteRoom = (e: React.MouseEvent, roomId: string) => {
    e.stopPropagation();
    sendMessage({
      type: "delete_room",
      roomId,
    });
  };

  // Request rooms list when connected
  useEffect(() => {
    if (isConnected) {
      listRooms();
      const interval = setInterval(listRooms, 5000);
      return () => clearInterval(interval);
    }
  }, [isConnected, listRooms]);

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      <div className="space-y-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Create New Room</h2>
          <form onSubmit={handleCreateRoom} className="space-y-4">
            <div>
              <label
                htmlFor="roomName"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
              >
                Room Name
              </label>
              <input
                type="text"
                id="roomName"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Enter room name"
                required
              />
            </div>
            <button
              type="submit"
              className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
            >
              Create Room
            </button>
          </form>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Available Rooms</h2>
          {rooms.length > 0 ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  onClick={() => onRoomSelect(room.id)}
                  className="p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 cursor-pointer hover:border-blue-500 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{room.name}</h3>
                      <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        <p>Participants: {room.participantCount}</p>
                        {room.quiz && (
                          <p className="text-green-600 dark:text-green-400">
                            Quiz Loaded: {room.quiz}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteRoom(e, room.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                      title="Delete Room"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">
              No rooms available. Create one to get started.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
