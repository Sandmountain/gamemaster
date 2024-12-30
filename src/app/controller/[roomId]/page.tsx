"use client";

import { use, useState } from "react";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useGameEvents } from "@/hooks/useGameEvents";
import {
  TextField,
  Button,
  Box,
  Container,
  Paper,
  Typography,
} from "@mui/material";
import { Room } from "@shared/types/websocket";
import AnswerButtons from "../components/AnswerButtons";

export default function ControllerRoomPage({
  params,
}: {
  params: { roomId: string };
}) {
  const [teamName, setTeamName] = useState("");
  const [hasJoined, setHasJoined] = useState(false);

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const resolvedParams = use(params) as { roomId: string };
  const roomId = resolvedParams.roomId;

  const { socket, sendMessage, joinRoom, rooms } = useWebSocket();
  const {
    countdown,
    currentQuestion,
    roundTime,
    isRoundActive,
    isRoundEnded,
    //showControls,
  } = useGameEvents(socket);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (teamName.trim()) {
      sendMessage({
        type: "register",
        teamName: teamName.trim(),
        roomId,
        role: "player",
      });
      joinRoom(roomId, "player");
      setHasJoined(true);
    }
  };

  if (!hasJoined) {
    return (
      <Container
        maxWidth="sm"
        sx={{ height: "100vh", display: "flex", alignItems: "center" }}
      >
        <Paper elevation={3} sx={{ p: 4, width: "100%" }}>
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            <Typography variant="h6" sx={{ textAlign: "center" }}>
              Joining {rooms.find((r: Room) => r.id === roomId)?.name}
            </Typography>
            <TextField
              label="Team Name"
              variant="outlined"
              fullWidth
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              required
              autoFocus
            />
            <Button type="submit" variant="contained" size="large" fullWidth>
              Join Game
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4, minHeight: "100vh" }}>
      <AnswerButtons />
    </Container>
  );
}
