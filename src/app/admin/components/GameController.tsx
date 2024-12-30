"use client";

import { Box, Button, Typography, Paper, IconButton } from "@mui/material";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useGameEvents } from "@/hooks/useGameEvents";
import { useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

export default function GameController() {
  const [localIndex, setLocalIndex] = useState(0);
  const [pressedTeam, setPressedTeam] = useState<string | null>(null);
  const [disqualifiedTeams, setDisqualifiedTeams] = useState<Set<string>>(
    new Set()
  );
  const { socket, currentRoom, gameState } = useWebSocket();
  const { currentQuestion, isRoundEnded, roundTime } = useGameEvents(socket);

  const handleNextRound = () => {
    if (!socket || !currentRoom) return;
    setLocalIndex(localIndex + 1);
    setPressedTeam(null);
    setDisqualifiedTeams(new Set());
    socket.send(
      JSON.stringify({
        type: "next_round",
        roomId: currentRoom.id,
      })
    );
  };

  const handlePointsChange = (teamName: string, amount: number) => {
    if (!socket || !currentRoom) return;

    socket.send(
      JSON.stringify({
        type: "adjust_points",
        roomId: currentRoom.id,
        teamName,
        pointAdjustment: amount,
      })
    );
  };

  const handleJudgement = (correct: boolean) => {
    if (!socket || !currentRoom || !pressedTeam) return;

    socket.send(
      JSON.stringify({
        type: "admin_judgement",
        roomId: currentRoom.id,
        teamName: pressedTeam,
        correct,
      })
    );

    if (!correct) {
      // Add team to disqualified list and clear pressed team
      setDisqualifiedTeams((prev) => new Set([...prev, pressedTeam]));
      setPressedTeam(null);
    }
  };

  const localQuestion = currentRoom?.quiz?.questions[localIndex];
  const isFirstToPress = localQuestion?.type === "first_to_press";

  return (
    <Box sx={{ p: 3 }}>
      {/* Current Question Display */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Current Question
        </Typography>
        <Typography variant="body1">{localQuestion?.question}</Typography>
        {localQuestion?.type === "multiple" && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Alternatives:
            </Typography>
            {localQuestion?.alternatives?.map((alt, index) => (
              <Typography key={index} variant="body2">
                {index + 1}. {localQuestion.correctAnswer === index ? "✅" : ""}{" "}
                {alt}
              </Typography>
            ))}
          </Box>
        )}
      </Paper>

      {/* First to Press Status */}
      {isFirstToPress && (
        <Paper
          sx={{
            p: 3,
            mb: 3,
            bgcolor: pressedTeam ? "action.selected" : undefined,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6">
              {pressedTeam
                ? `${pressedTeam} pressed first!`
                : "Waiting for teams to press..."}
            </Typography>
            {pressedTeam && (
              <Box sx={{ display: "flex", gap: 2 }}>
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => handleJudgement(true)}
                  startIcon={<CheckCircleIcon />}
                >
                  Correct
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => handleJudgement(false)}
                  startIcon={<CancelIcon />}
                >
                  Wrong
                </Button>
              </Box>
            )}
          </Box>
          {disqualifiedTeams.size > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="error">
                Disqualified teams: {Array.from(disqualifiedTeams).join(", ")}
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* Round Control */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6">
            {isRoundEnded
              ? "Round Ended"
              : roundTime
              ? `Time left: ${roundTime}s`
              : "Waiting..."}
          </Typography>
          {isRoundEnded && (
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleNextRound}
              sx={{
                minWidth: 200,
                animation: "pulse 1.5s infinite",
                "@keyframes pulse": {
                  "0%": { transform: "scale(1)" },
                  "50%": { transform: "scale(1.05)" },
                  "100%": { transform: "scale(1)" },
                },
              }}
            >
              Next Round
            </Button>
          )}
        </Box>
      </Paper>

      {/* Team Points */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Team Points
        </Typography>
        {gameState?.teamPoints &&
          Object.entries(gameState.teamPoints).map(([team, points]) => (
            <Box
              key={team}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                p: 2,
                mb: 1,
                borderRadius: 1,
                bgcolor: "background.paper",
                "&:hover": {
                  bgcolor: "action.hover",
                },
              }}
            >
              <Typography variant="subtitle1">{team}</Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <IconButton
                  size="small"
                  onClick={() => handlePointsChange(team, -100)}
                  sx={{ color: "error.main" }}
                >
                  <RemoveIcon />
                </IconButton>
                <Typography variant="h6" color="primary.main" fontWeight="bold">
                  {points}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => handlePointsChange(team, 100)}
                  sx={{ color: "success.main" }}
                >
                  <AddIcon />
                </IconButton>
              </Box>
            </Box>
          ))}
      </Paper>
    </Box>
  );
}
