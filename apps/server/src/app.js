import express from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import pino from "pino";
import { env } from "./config/env.js";

// Routes (these files already exist in your structure)
import healthRoutes from "./routes/health.routes.js";
import agentRoutes from "./routes/agent.routes.js";
import githubRoutes from "./routes/github.routes.js";
import twinRoutes from "./routes/twin.routes.js";
import logsRoutes from "./routes/logs.routes.js";

const logger = pino({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  transport:
    env.NODE_ENV === "production"
      ? undefined
      : {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "SYS:standard" }
        }
});

export function createApp() {
  const app = express();

  // Trust proxy (good for deployment behind reverse proxy)
  app.set("trust proxy", 1);

  // Security headers
  app.use(helmet());

  // Request logging
  app.use(
    pinoHttp({
      logger,
      redact: ["req.headers.authorization"]
    })
  );

  // CORS
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true
    })
  );

  // Body parsing
  app.use(express.json({ limit: "2mb" }));

  // Base route
  app.get("/", (req, res) => {
    res.json({
      ok: true,
      name: "agentic-digital-twin-server",
      env: env.NODE_ENV
    });
  });

  // Mount APIs
  app.use("/api/health", healthRoutes);
  app.use("/api/agent", agentRoutes);
  app.use("/api/github", githubRoutes);
  app.use("/api/twin", twinRoutes);
  app.use("/api/logs", logsRoutes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ ok: false, error: "Not Found" });
  });

  // Error handler
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    req.log.error({ err }, "Unhandled error");

    const status = Number(err.status || 500);
    res.status(status).json({
      ok: false,
      error: err.message || "Internal Server Error"
    });
  });

  return app;
}
