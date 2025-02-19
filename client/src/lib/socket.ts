import { io } from "socket.io-client";

// Create socket connection
const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
const wsUrl = `${protocol}//${window.location.host}`;

export const socket = io(wsUrl, {
  transports: ["websocket"],
  autoConnect: true,
});

// Add connection event listeners
socket.on("connect", () => {
  console.log("Connected to WebSocket server");
});

socket.on("disconnect", () => {
  console.log("Disconnected from WebSocket server");
});

socket.on("connect_error", (error) => {
  console.error("WebSocket connection error:", error);
});
