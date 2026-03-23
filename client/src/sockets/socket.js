import { io } from "socket.io-client";

// Connect directly to backend — Vite proxy doesn't reliably handle
// socket.io's polling+websocket upgrade handshake in dev mode
const socket = io("http://localhost:5000", {
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});

export default socket;
