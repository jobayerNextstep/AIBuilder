import { io } from "socket.io-client";
import { BASE_URL } from "./apiService";

export const socket = io(BASE_URL, {
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 2000,
});

socket.on("connect", () => {
  console.log("🟢 [Socket.IO] Connected to Voice Server:", socket.id);
});

socket.on("disconnect", () => {
  console.log("🔴 [Socket.IO] Disconnected from Voice Server");
});