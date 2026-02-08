// packages/shared/constants.js

export const APP_NAME = "Agentic Digital Twin";

export const API = {
  BASE_PATH: "/api",
  HEALTH: "/api/health",
  AGENT_RUN: "/api/agent/run",
  TWIN_STATE: "/api/twin/state",
  TWIN_RESET: "/api/twin/reset",
  LOG_RUNS: "/api/logs/runs"
};

export const WS = {
  TWIN_PATH: "/ws/twin"
};

export const BRANCH = {
  DEFAULT_BASE: "main",
  ALT_PREFIX: "alternate"
};

export const AGENT = {
  MODE: {
    DRY_RUN: "dry-run",
    EXECUTE: "execute"
  }
};

export const LIMITS = {
  TIMELINE_MAX: 500,
  LOG_PREVIEW: 50
};
