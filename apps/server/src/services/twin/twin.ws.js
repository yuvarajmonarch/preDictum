/**
 * WebSocket broadcaster for Digital Twin
 * - attachTwinWebSocket(server) -> call once during server startup
 * - broadcastTwin(snapshot) -> push latest state to all clients
 *
 * Dependency: ws
 * Install: npm i ws
 */

import WebSocket, { WebSocketServer } from "ws";

let wss = null;

export function attachTwinWebSocket(httpServer, { path = "/ws/twin" } = {}) {
  if (wss) return wss; // already attached

  wss = new WebSocketServer({ server: httpServer, path });

  wss.on("connection", (socket) => {
    // Basic keepalive
    socket.isAlive = true;
    socket.on("pong", () => (socket.isAlive = true));

    socket.on("message", (raw) => {
      // You can support client commands later (subscribe filters etc.)
      // For MVP, ignore.
      void raw;
    });
  });

  // Heartbeat to clean dead connections
  const interval = setInterval(() => {
    if (!wss) return;
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on("close", () => clearInterval(interval));

  return wss;
}

export function broadcastTwin(snapshot) {
  if (!wss) return;
  const payload = JSON.stringify({ type: "TWIN_STATE", data: snapshot });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}
