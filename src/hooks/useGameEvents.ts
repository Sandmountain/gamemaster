"use client";

import { useState, useEffect } from "react";
import {
  QuizQuestion,
  SubmitAnswerMessage,
  WebSocketMessage,
} from "@shared/types/websocket";

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
  const [showControls, setShowControls] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const handleGameMessage = (event: MessageEvent) => {
      const message = JSON.parse(event.data) as WebSocketMessage;
      console.log("Game message received:", message.type, message);

      switch (message.type) {
        case "next_question_start":
          setCountdown(Math.ceil(message.remainingTime / 1000));
          setNextQuestionIndex(message.nextQuestionIndex);
          setIsRoundActive(false);
          setIsRoundEnded(false);
          setShowControls(false);
          setRoundTime(null);
          setHasAnswered(false);
          break;

        case "next_question_stop":
          setCountdown(null);
          break;

        case "show_question":
          setNextQuestionIndex(null);
          setCurrentQuestion(message.question);
          setShowControls(false);
          setHasAnswered(false);
          break;

        case "round_start":
          setRoundTime(message.roundTime);
          setIsRoundActive(true);
          setIsRoundEnded(false);
          setShowControls(true);
          setHasAnswered(false);
          break;

        case "round_end":
          console.log("Round ended");
          setRoundTime(null);
          setIsRoundActive(false);
          setIsRoundEnded(true);
          setShowControls(false);
          break;

        case "game_started":
          console.log("Game started");
          setCurrentQuestion(null);
          setNextQuestionIndex(null);
          setCountdown(null);
          setRoundTime(null);
          setIsRoundActive(false);
          setIsRoundEnded(false);
          setShowControls(false);
          setHasAnswered(false);
          break;
      }
    };

    socket.addEventListener("message", handleGameMessage);
    return () => socket.removeEventListener("message", handleGameMessage);
  }, [socket]);

  const submitAnswer = (answer: number, teamName?: string, roomId?: string) => {
    if (!socket || !isRoundActive || hasAnswered || !teamName || !roomId) {
      console.log("Not submitting answer:", {
        socket,
        isRoundActive,
        hasAnswered,
        teamName,
        roomId,
      });
      return;
    }

    console.log("Submitting answer:", answer);
    socket.send(
      JSON.stringify({
        type: "submit_answer",
        roomId,
        teamName,
        answer,
      } as SubmitAnswerMessage)
    );

    setHasAnswered(true);
    setShowControls(false); // Hide controls after answering
  };

  // Countdown timer effect
  useEffect(() => {
    if (countdown === null) return;
    console.log("Starting countdown timer:", countdown);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        const next = prev !== null && prev > 0 ? prev - 1 : null;
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  // Round timer effect
  useEffect(() => {
    if (!isRoundActive || roundTime === null) {
      console.log("Round timer not starting:", { isRoundActive, roundTime });
      return;
    }

    const timer = setInterval(() => {
      setRoundTime((prev) => {
        if (prev === null || prev <= 0) {
          clearInterval(timer);
          setIsRoundActive(false);
          setIsRoundEnded(true);
          setShowControls(false);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [isRoundActive, roundTime]);

  return {
    countdown,
    nextQuestionIndex,
    currentQuestion,
    roundTime,
    isRoundActive,
    isRoundEnded,
    showControls,
    hasAnswered,
    submitAnswer,
  };
}
