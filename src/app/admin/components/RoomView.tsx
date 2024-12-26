"use client";

import { useEffect, useState } from "react";
import { Quiz } from "@/types/websocket";
import sampleQuiz from "@/data/sample-quiz.json";
import { useWebSocket } from "@/contexts/WebSocketContext";
import ConfirmModal from "@/components/ConfirmModal";

interface RoomViewProps {
  roomId: string;
  onBack: () => void;
}

export default function RoomView({ roomId, onBack }: RoomViewProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const {
    currentRoom: room,
    participants,
    isJoined,
    error,
    joinRoom,
    loadQuiz,
    sendMessage,
  } = useWebSocket();

  // Join room and request participants list
  useEffect(() => {
    joinRoom(roomId, "admin");
  }, [roomId, joinRoom]);

  // Request participants list when joined
  useEffect(() => {
    if (isJoined) {
      sendMessage({
        type: "list_participants",
        roomId,
      });

      // Poll for participants list
      const interval = setInterval(() => {
        sendMessage({
          type: "list_participants",
          roomId,
        });
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [isJoined, roomId, sendMessage]);

  const handleLoadQuiz = () => {
    if (isJoined) {
      loadQuiz(roomId, sampleQuiz as Quiz);
    }
  };

  const handleDeleteRoom = () => {
    sendMessage({
      type: "delete_room",
      roomId,
    });
    onBack();
  };

  if (!room) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <p className="text-gray-600 dark:text-gray-300">Loading room...</p>
      </div>
    );
  }

  return (
    <>
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteRoom}
        title="Delete Room"
        message={`Are you sure you want to delete the room "${room.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />

      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-blue-500 hover:text-blue-700 transition-colors flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Back to Rooms
        </button>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
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
          Delete Room
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <h1 className="text-2xl font-bold mb-6">{room.name}</h1>

            {error && (
              <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-yellow-700 dark:text-yellow-300">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <p>Room ID: {room.id}</p>
                  <p>Participants: {room.participantCount}</p>
                  <p>
                    Status:{" "}
                    {isJoined ? (
                      <span className="text-green-500">Viewing as Admin</span>
                    ) : (
                      <span className="text-yellow-500">Connecting...</span>
                    )}
                  </p>
                </div>
              </div>

              {room.quiz ? (
                <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-700 dark:text-green-300">
                    Quiz Loaded: {room.quiz}
                  </h3>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                    {sampleQuiz.questions.length} questions
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                    <p className="text-yellow-700 dark:text-yellow-300">
                      No quiz loaded yet
                    </p>
                  </div>
                  {isJoined ? (
                    <button
                      onClick={handleLoadQuiz}
                      className="w-full bg-blue-500 text-white py-3 px-4 rounded-md hover:bg-blue-600 transition-colors"
                    >
                      Load Sample Quiz
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full bg-gray-400 text-white py-3 px-4 rounded-md cursor-not-allowed"
                    >
                      Connecting to room...
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Participants</h2>
          {participants.length > 0 ? (
            <div className="space-y-3">
              {participants.map((participant, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{participant.teamName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {participant.role === "admin" ? (
                        <span className="text-blue-500">Admin</span>
                      ) : (
                        <span>Player</span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">
              No participants yet
            </p>
          )}
        </div>
      </div>
    </>
  );
}