"use client";

import { Box, Button, keyframes, Typography } from "@mui/material";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useGameEvents } from "@/hooks/useGameEvents";
import { useEffect, useState } from "react";
import ScreenRotationIcon from "@mui/icons-material/ScreenRotation";

const answerColors = {
  green: "#4CAF50",
  yellow: "#FFC107",
  teal: "#009688",
  purple: "#9C27B0",
};

const pulsate = keyframes`
  0% {
    box-shadow: 
      0 0 0 15px #900,
      0 0 0 30px #700,
      0 0 30px 30px rgba(0, 0, 0, 0.3);
  }
  50% {
    box-shadow: 
      0 0 0 20px #900,
      0 0 0 40px #700,
      0 0 50px 40px rgba(0, 0, 0, 0.3),
      0 0 80px 60px rgba(255, 0, 0, 0.2);
  }
  100% {
    box-shadow: 
      0 0 0 15px #900,
      0 0 0 30px #700,
      0 0 30px 30px rgba(0, 0, 0, 0.3);
  }
`;

export default function AnswerButtons() {
  const { socket, teamName, currentRoom, pressedTeam, isDisqualified } =
    useWebSocket();
  const {
    roundTime,
    currentQuestion,
    countdown,
    isRoundActive,
    hasAnswered,
    submitAnswer,
  } = useGameEvents(socket);
  const [isPortrait, setIsPortrait] = useState(false);
  const hasGameStarted = Boolean(currentQuestion);
  const [lastAnswerIndex, setLastAnswerIndex] = useState<number | null>(null);

  // Calculate if buttons should be enabled based on question type and answer state
  const isMultipleChoice =
    currentQuestion?.type === "multiple" && isRoundActive && !hasAnswered;
  const isFirstToPress =
    currentQuestion?.type === "first_to_press" &&
    isRoundActive &&
    !hasAnswered &&
    !isDisqualified;

  // Calculate progress percentage
  const progress =
    currentQuestion && roundTime
      ? (roundTime / currentQuestion.roundTime) * 100
      : 0;

  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    // Check on mount and when window resizes
    checkOrientation();
    window.addEventListener("resize", checkOrientation);

    return () => window.removeEventListener("resize", checkOrientation);
  }, []);

  if (isPortrait) {
    return (
      <Box
        sx={{
          width: "100%",
          height: "calc(100vh - 64px)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",

          bgcolor: "background.default",
          color: "text.primary",
          textAlign: "center",
        }}
      >
        <ScreenRotationIcon
          sx={{ fontSize: 60, animation: "rotate 2s infinite linear" }}
        />
        <Typography variant="h5">Please rotate your device</Typography>
        <Typography variant="body1" color="text.secondary">
          This game works best in landscape mode
        </Typography>
      </Box>
    );
  }

  const handleAnswer = (index: number) => {
    if (!socket || !isRoundActive || hasAnswered) return;
    setLastAnswerIndex(index);
    submitAnswer(index, teamName, currentRoom?.id);
  };

  const handleFirstToPress = () => {
    if (!socket || !isRoundActive || hasAnswered || isDisqualified) return;
    socket.send(
      JSON.stringify({
        type: "button_pressed",
        roomId: currentRoom?.id,
        teamName,
      })
    );
  };

  return (
    <Box sx={{ position: "relative", height: "100vh" }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          gap: 2,
          width: "100%",
          height: "calc(100vh - 64px)",
        }}
      >
        {/* Left Column */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            width: "30%",
          }}
        >
          <Button
            variant="contained"
            onClick={() => handleAnswer(0)}
            disabled={!isMultipleChoice}
            sx={{
              borderRadius: 2,
              typography: "h5",
              width: "100%",
              height: "33.33%",
              bgcolor: answerColors.green,
              "&:hover": {
                bgcolor: answerColors.green + "dd",
              },
              opacity: !isMultipleChoice ? 0.5 : 1,
            }}
          >
            {currentQuestion?.alternatives?.[0] ?? "A"}
          </Button>
          <Button
            variant="contained"
            onClick={() => handleAnswer(2)}
            disabled={!isMultipleChoice}
            sx={{
              aspectRatio: "1/1",
              borderRadius: 2,
              typography: "h5",
              width: "100%",
              height: "33.33%",
              bgcolor: answerColors.yellow,
              "&:hover": {
                bgcolor: answerColors.yellow + "dd",
              },
              opacity: !isMultipleChoice ? 0.5 : 1,
            }}
          >
            {currentQuestion?.alternatives?.[2] ?? "C"}
          </Button>
        </Box>

        {/* Center Column */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "40%",
          }}
        >
          <Box
            component="button"
            onClick={handleFirstToPress}
            disabled={!isFirstToPress}
            sx={{
              width: "200px",
              height: "200px",
              borderRadius: "50%",
              border: "none",
              cursor: isFirstToPress ? "pointer" : "not-allowed",
              position: "relative",
              backgroundColor: "#D00",
              transform: "perspective(500px) rotateX(30deg)",
              transition: "all 0.2s",
              fontSize: "2.5rem",
              fontWeight: "bold",
              color: "#FFF",
              textShadow: "0 -1px 2px rgba(0,0,0,0.5)",
              overflow: "hidden",
              animation: !isFirstToPress
                ? "none"
                : `${pulsate} 2s infinite ease-in-out`,
              "&::before": {
                content: '""',
                position: "absolute",
                top: "-25%",
                left: "-25%",
                width: "150%",
                height: "150%",
                background:
                  "radial-gradient(circle at center, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 60%)",
                transform: "rotate(-45deg)",
              },
              "&:hover": isFirstToPress
                ? {
                    backgroundColor: "#E00",
                    transform:
                      "perspective(500px) rotateX(30deg) translateY(2px)",
                  }
                : {},
              "&:active": isFirstToPress
                ? {
                    backgroundColor: "#C00",
                    transform:
                      "perspective(500px) rotateX(30deg) translateY(4px)",
                    animation: "none",
                    boxShadow: `
                  0 0 0 15px #800,
                  0 0 0 30px #600,
                  0 0 30px 30px rgba(0, 0, 0, 0.3)
                `,
                  }
                : {},
              "&:disabled": {
                backgroundColor: "#888",
                cursor: "not-allowed",
                animation: "none",
                boxShadow: `
                  0 0 0 15px #666,
                  0 0 0 30px #444,
                  0 0 30px 30px rgba(0, 0, 0, 0.1)
                `,
                opacity: 0.5,
              },
            }}
          >
            GO!
          </Box>
        </Box>

        {/* Right Column */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            width: "30%",
          }}
        >
          <Button
            variant="contained"
            onClick={() => handleAnswer(1)}
            disabled={!isMultipleChoice}
            sx={{
              borderRadius: 2,
              typography: "h5",
              width: "100%",
              height: "33.33%",
              bgcolor: answerColors.teal,
              "&:hover": {
                bgcolor: answerColors.teal + "dd",
              },
              opacity: !isMultipleChoice ? 0.5 : 1,
            }}
          >
            {currentQuestion?.alternatives?.[1] ?? "B"}
          </Button>
          <Button
            variant="contained"
            onClick={() => handleAnswer(3)}
            disabled={!isMultipleChoice}
            sx={{
              borderRadius: 2,
              typography: "h5",
              width: "100%",
              height: "33.33%",
              bgcolor: answerColors.purple,
              "&:hover": {
                bgcolor: answerColors.purple + "dd",
              },
              opacity: !isMultipleChoice ? 0.5 : 1,
            }}
          >
            {currentQuestion?.alternatives?.[3] ?? "D"}
          </Button>
        </Box>
      </Box>

      {/* Waiting/Countdown Overlay */}
      {(!hasGameStarted || countdown !== null) && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            zIndex: 10,
            backdropFilter: "blur(3px)",
          }}
        >
          {countdown !== null ? (
            <>
              <Typography
                variant="h1"
                sx={{
                  color: "primary.main",
                  fontSize: "12rem",
                  fontWeight: "bold",
                  animation: "pulse 1s infinite",
                  "@keyframes pulse": {
                    "0%, 100%": {
                      transform: "scale(1)",
                      opacity: 1,
                    },
                    "50%": {
                      transform: "scale(1.1)",
                      opacity: 0.8,
                    },
                  },
                }}
              >
                {countdown}
              </Typography>
              <Typography variant="h4" sx={{ color: "grey.400" }}>
                Get Ready!
              </Typography>
            </>
          ) : (
            <>
              <Box
                sx={{
                  width: "100px",
                  height: "100px",
                  border: "4px solid",
                  borderColor: "primary.main",
                  borderRadius: "50%",
                  borderRightColor: "transparent",
                  animation: "spin 1s linear infinite",
                  mb: 3,
                  "@keyframes spin": {
                    "0%": {
                      transform: "rotate(0deg)",
                    },
                    "100%": {
                      transform: "rotate(360deg)",
                    },
                  },
                }}
              />
              <Typography variant="h4" sx={{ color: "primary.main" }}>
                Waiting for Game to Start
              </Typography>
              <Typography variant="body1" sx={{ color: "grey.400" }}>
                The host will start the game shortly...
              </Typography>
            </>
          )}
        </Box>
      )}

      {/* Countdown Progress Bar */}
      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          width: "100%",
          height: "8px",
          bgcolor: "rgba(255, 255, 255, 0.1)",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            height: "100%",
            width: `${progress}%`,
            bgcolor: "primary.main",
            transition: "width 1s linear",
            boxShadow: "0 0 10px rgba(144, 202, 249, 0.5)",
          }}
        />
      </Box>

      {/* First to Press Overlay */}
      {currentQuestion?.type === "first_to_press" && pressedTeam && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            zIndex: 10,
            backdropFilter: "blur(3px)",
          }}
        >
          {pressedTeam === teamName ? (
            <>
              <Typography variant="h3" sx={{ color: "success.main" }}>
                You pressed first!
              </Typography>
              <Typography variant="h5" sx={{ color: "grey.300" }}>
                Give your answer to the host
              </Typography>
            </>
          ) : (
            <Typography variant="h4" sx={{ color: "grey.300" }}>
              {pressedTeam} pressed first!
            </Typography>
          )}
        </Box>
      )}

      {/* Disqualified Overlay */}
      {currentQuestion?.type === "first_to_press" && isDisqualified && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            zIndex: 10,
            backdropFilter: "blur(3px)",
          }}
        >
          <Typography variant="h3" sx={{ color: "error.main" }}>
            Disqualified
          </Typography>
          <Typography variant="h5" sx={{ color: "grey.300" }}>
            Wait for the next round
          </Typography>
        </Box>
      )}

      {/* Answer Overlay */}
      {hasAnswered && currentQuestion?.type === "multiple" && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            zIndex: 10,
            backdropFilter: "blur(3px)",
          }}
        >
          <Typography variant="h4" sx={{ color: "grey.300" }}>
            Answer Submitted!
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Typography variant="h6" sx={{ color: "grey.400" }}>
              You chose:
            </Typography>
            <Box
              sx={{
                p: 4,
                borderRadius: 2,
                bgcolor: "rgba(255, 255, 255, 0.1)",
                minWidth: "200px",
                textAlign: "center",
              }}
            >
              <Typography variant="h3" sx={{ color: "primary.main" }}>
                {currentQuestion.alternatives?.[lastAnswerIndex ?? -1] ?? ""}
              </Typography>
            </Box>
          </Box>

          <Typography variant="body1" sx={{ color: "grey.500", mt: 2 }}>
            Waiting for next round to start...
          </Typography>
        </Box>
      )}
    </Box>
  );
}
