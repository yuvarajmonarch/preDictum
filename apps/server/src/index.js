import http from "http";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { attachTwinWebSocket } from "./services/twin/twin.ws.js";

const app = createApp();
const server = http.createServer(app);

server.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`✅ Server running: http://localhost:${env.PORT}`);
});

// Graceful shutdown (professional)
function shutdown(signal) {
  // eslint-disable-next-line no-console
  console.log(`\n🛑 ${signal} received. Shutting down...`);
  server.close((err) => {
    if (err) {
      // eslint-disable-next-line no-console
      console.error("❌ Error during shutdown:", err);
      process.exit(1);
    }
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
attachTwinWebSocket(server);