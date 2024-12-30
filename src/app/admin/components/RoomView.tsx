"use client";

import { useCallback, useEffect, useState } from "react";
import { Quiz } from "@shared/types/websocket";
import { RoomViewState } from "@/types/client";
import { useWebSocket } from "@/contexts/WebSocketContext";
import ConfirmModal from "@/components/ConfirmModal";
import sampleQuiz from "@/data/sample-quiz.json";
import { useGameEvents } from "@/hooks/useGameEvents";
import Button from "@/components/Button";
import GameController from "./GameController";
import { Box } from "@mui/material";

interface RoomViewProps {
  roomId: string;
  onBack: () => void;
}

export default function RoomView({ roomId, onBack }: RoomViewProps) {
  const [viewState, setViewState] = useState<RoomViewState>({
    isDeleting: false,
    isKicking: false,
    selectedPlayer: null,
  });
  const [isGameStarted, setIsGameStarted] = useState(false);

  const {
    currentRoom: room,
    participants,
    isJoined,
    isConnected,
    error,
    socket,
    joinRoom,
    loadQuiz,
    sendMessage,
  } = useWebSocket();

  const { currentQuestion, nextQuestionIndex } = useGameEvents(socket);

  // Join room and request participants list
  useEffect(() => {
    if (isConnected && !isJoined) {
      joinRoom(roomId, "admin");
    }
  }, [isConnected, isJoined, roomId, joinRoom]);

  const handleLoadQuiz = () => {
    if (isJoined) {
      loadQuiz(roomId, sampleQuiz as Quiz);
    }
  };

  const handleDeleteRoom = async () => {
    // First ensure we have admin rights
    joinRoom(roomId, "admin");

    // Small delay to ensure join message is processed
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Then send delete request
    sendMessage({
      type: "delete_room",
      roomId,
    });
    onBack();
  };

  const handleKickPlayer = (teamName: string) => {
    setViewState((prev) => ({
      ...prev,
      isKicking: true,
      selectedPlayer: teamName,
    }));
  };

  const confirmKickPlayer = () => {
    if (viewState.selectedPlayer) {
      sendMessage({
        type: "kick_player",
        roomId,
        teamName: viewState.selectedPlayer,
      });
      setViewState((prev) => ({
        ...prev,
        isKicking: false,
        selectedPlayer: null,
      }));
    }
  };

  const handleStartGame = useCallback(() => {
    if (!socket) return;
    setIsGameStarted(true);
    sendMessage({
      type: "start_game",
      roomId: roomId,
    });
  }, [socket, roomId, sendMessage]);

  if (!room) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <p className="text-gray-600 dark:text-gray-300">
          {error || "Loading room..."}
        </p>
      </div>
    );
  }

  return (
    <Box>
      {isGameStarted ? (
        <GameController />
      ) : (
        <>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">{room.name}</h1>
              <div className="flex gap-2">
                <Button variant="outlined" onClick={onBack}>
                  Back
                </Button>
                <Button
                  variant="outlined"
                  onClick={() =>
                    setViewState((prev) => ({ ...prev, isDeleting: true }))
                  }
                >
                  Delete Room
                </Button>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              {error && (
                <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-yellow-700 dark:text-yellow-300">
                    {error}
                  </p>
                </div>
              )}

              {isGameStarted ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-bold">Next Question</h2>
                      {nextQuestionIndex !== null && room.quiz && (
                        <p className="text-gray-600 dark:text-gray-400">
                          Question {nextQuestionIndex + 1} of{" "}
                          {room.quiz.questions.length}
                        </p>
                      )}
                    </div>
                    {currentQuestion && (
                      <div className="text-right">
                        <p className="font-medium">
                          Type: {currentQuestion.type}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Time: {currentQuestion.roundTime}s
                        </p>
                      </div>
                    )}
                  </div>

                  {currentQuestion && (
                    <div className="mt-4">
                      <p className="font-medium">{currentQuestion.question}</p>
                      {currentQuestion.alternatives && (
                        <ul className="mt-2 space-y-2">
                          {currentQuestion.alternatives.map((alt, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <span className="w-6 h-6 flex items-center justify-center bg-blue-100 dark:bg-blue-900 rounded-full text-sm">
                                {index + 1}
                              </span>
                              {alt}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        <p>Room ID: {room.id}</p>
                        <p>Participants: {room.participantCount}</p>
                        <p>
                          Status:{" "}
                          {isJoined ? (
                            <span className="text-green-500">
                              Viewing as Admin
                            </span>
                          ) : (
                            <span className="text-yellow-500">
                              Connecting...
                            </span>
                          )}
                        </p>
                      </div>
                      <a
                        href={`/view/${room.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-500 hover:text-blue-600 transition-colors"
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
                        Open View Page
                      </a>
                    </div>

                    {room.quiz ? (
                      <div className="space-y-4">
                        <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
                          <h3 className="font-semibold text-green-700 dark:text-green-300">
                            Quiz Loaded: {room.quiz.name}
                          </h3>
                          <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                            {room.quiz.questions?.length || 0} questions
                          </p>
                        </div>

                        {isJoined && !currentQuestion && (
                          <Button
                            onClick={handleStartGame}
                            className="w-full"
                            size="large"
                          >
                            Start Game
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                          <p className="text-yellow-700 dark:text-yellow-300">
                            No quiz loaded yet
                          </p>
                        </div>
                        {isJoined ? (
                          <Button
                            onClick={handleLoadQuiz}
                            className="w-full"
                            size="large"
                          >
                            Load Sample Quiz
                          </Button>
                        ) : (
                          <Button disabled className="w-full" size="large">
                            Connecting to room...
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
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
                      {participant.role !== "admin" && (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleKickPlayer(participant.teamName)}
                        >
                          Kick
                        </Button>
                      )}
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

          <ConfirmModal
            isOpen={viewState.isDeleting}
            onClose={() =>
              setViewState((prev) => ({ ...prev, isDeleting: false }))
            }
            onConfirm={handleDeleteRoom}
            title="Delete Room"
            message="Are you sure you want to delete this room? This action cannot be undone."
          />

          <ConfirmModal
            isOpen={viewState.isKicking}
            onClose={() =>
              setViewState((prev) => ({
                ...prev,
                isKicking: false,
                selectedPlayer: null,
              }))
            }
            onConfirm={confirmKickPlayer}
            title="Kick Player"
            message={`Are you sure you want to kick ${viewState.selectedPlayer}?`}
          />
        </>
      )}
    </Box>
  );
}
