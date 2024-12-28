import { useWebSocket } from "@/contexts/WebSocketContext";
import { useGameEvents } from "@/hooks/useGameEvents";
import { Room } from "@shared/types/websocket";

import { useCallback } from "react";

interface GameControllerProps {
  room: Room;
}

export function GameController({ room }: GameControllerProps) {
  const { socket, sendMessage } = useWebSocket();
  const {
    countdown,
    nextQuestionIndex,
    currentQuestion,
    roundTime,
    isRoundEnded,
  } = useGameEvents(socket);

  const handleNextRound = useCallback(() => {
    if (!socket) return;
    sendMessage({
      type: "next_round",
      roomId: room.id,
    });
  }, [socket, room.id, sendMessage]);

  if (!room.quiz) return <h2>No quiz loaded</h2>;

  return (
    <div className="space-y-4">
      {/* Game Status */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Game in Progress</h2>
        <div className="text-lg">
          Question{" "}
          {nextQuestionIndex !== null
            ? nextQuestionIndex + 1
            : currentQuestion
            ? room.quiz?.questions.indexOf(currentQuestion) + 1
            : 0}
          /{room.quiz?.questions.length}
        </div>
      </div>

      {/* Countdown Display */}
      {countdown !== null && (
        <div className="p-4 bg-yellow-100">
          <div className="text-center">
            <h3 className="text-2xl font-bold">Next Question In</h3>
            <div className="text-4xl font-bold mt-2">{countdown}</div>
          </div>
        </div>
      )}

      {/* Current Question Display */}
      {currentQuestion && (
        <div className="p-4">
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Current Question</h3>
            <p className="text-lg">{currentQuestion.question}</p>

            {currentQuestion.alternatives && (
              <div className="space-y-2">
                <h4 className="font-semibold">Alternatives:</h4>
                <ul className="list-disc pl-6">
                  {currentQuestion.alternatives.map((alt, index) => (
                    <li key={index} className="text-lg">
                      {alt}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {roundTime !== null && (
              <div className="mt-4 text-center">
                <div className="text-sm uppercase text-gray-600">
                  Time Remaining
                </div>
                <div className="text-3xl font-bold">{roundTime}s</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Next Round Button */}
      {isRoundEnded && (
        <div className="flex justify-center">
          <button onClick={handleNextRound} className="px-8 py-6 text-lg">
            Start Next Round
          </button>
        </div>
      )}

      {/* Team Points */}
      {/* <div className="p-4">
        <h3 className="text-xl font-bold mb-4">Team Standings</h3>
        <div className="space-y-3">
          {Object.entries(room.quiz?.teamPoints || {}).map(([team, points]) => (
            <div
              key={team}
              className="flex justify-between items-center border-b pb-2"
            >
              <span className="text-lg">{team}</span>
              <span className="text-lg font-bold">{points} points</span>
            </div>
          ))}
        </div>
      </div> */}
    </div>
  );
}
