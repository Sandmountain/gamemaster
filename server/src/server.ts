import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import cors from "cors";
import { RoomManager } from "./roomManager";
import { WebSocketMessage } from "@shared/types/websocket";
import { ServerConfig } from "../types/server";

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors());
app.use(express.json());

// Create room manager
const roomManager = new RoomManager();

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (data) => {
    try {
      const message = JSON.parse(data.toString()) as WebSocketMessage;
      roomManager.handleMessage(ws, message);
    } catch (error) {
      console.error("Error handling message:", error);
      ws.send(
        JSON.stringify({
          type: "error",
          error: "Invalid message format",
        })
      );
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    roomManager.handleDisconnect(ws);
  });
});

const config: ServerConfig = {
  port: parseInt(process.env.PORT || "8000"),
  host: process.env.HOST || "0.0.0.0",
};

server.listen(config.port, config.host, () => {
  console.log(`Server running at http://${config.host}:${config.port}`);
});
