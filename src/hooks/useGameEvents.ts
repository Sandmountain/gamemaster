"use client";

import { useState, useEffect } from "react";
import { QuizQuestion, WebSocketMessage } from "@shared/types/websocket";

export function useGameEvents(socket: WebSocket | null) {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [nextQuestionIndex, setNextQuestionIndex] = useState<number | null>(
    null
  );
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(
    null
  );
  const [roundTime, setRoundTime] = useState<number | null>(null);
  const [isRoundActive, setIsRoundActive] = useState(false);
  const [isRoundEnded, setIsRoundEnded] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const handleGameMessage = (event: MessageEvent) => {
      const message = JSON.parse(event.data) as WebSocketMessage;

      // Only handle game-related messages
      switch (message.type) {
        case "next_question_start":
          setCountdown(Math.ceil(message.remainingTime / 1000));
          setNextQuestionIndex(message.nextQuestionIndex);
          setIsRoundActive(false);
          setIsRoundEnded(false);
          break;
        case "next_question_stop":
          setCountdown(null);
          break;
        case "show_question":
          setNextQuestionIndex(null);
          setCurrentQuestion(message.question);
          break;
        case "round_start":
          setRoundTime(message.roundTime);
          setIsRoundActive(true);
          setIsRoundEnded(false);
          break;
        case "round_end":
          setRoundTime(null);
          setIsRoundActive(false);
          setIsRoundEnded(true);
          break;
        case "game_started":
          // Reset all states when game starts
          setCurrentQuestion(null);
          setNextQuestionIndex(null);
          setCountdown(null);
          setRoundTime(null);
          setIsRoundActive(false);
          setIsRoundEnded(false);
          break;
      }
    };

    socket.addEventListener("message", handleGameMessage);
    return () => socket.removeEventListener("message", handleGameMessage);
  }, [socket]);

  // Countdown timer effect
  useEffect(() => {
    if (countdown === null) return;

    const timer = setInterval(() => {
      setCountdown((prev) => (prev !== null && prev > 0 ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  // Round timer effect
  useEffect(() => {
    if (roundTime === null || !isRoundActive) return;

    const timer = setInterval(() => {
      setRoundTime((prev) => (prev !== null && prev > 0 ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [roundTime, isRoundActive]);

  return {
    countdown,
    nextQuestionIndex,
    currentQuestion,
    roundTime,
    isRoundActive,
    isRoundEnded,
  };
}
