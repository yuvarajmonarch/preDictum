# Architecture

## Goal
Build a developer-safe automation system that:
- Never changes `main` directly
- Creates an alternate branch automatically
- Pushes code changes to the alternate branch
- Creates a PR (or draft PR)
- Mirrors everything in a **Digital Twin** state model for visibility

---

## High Level Design

### Apps
- `apps/server` — Express backend (core logic, GitHub integration, twin state, logs)
- `apps/web` — React UI (automation runner, digital twin live view, logs)

### Shared Package
- `packages/shared` — constants + event types + twin defaults (single source of truth)

---

## Backend Components (apps/server)

### Routes Layer
Handles HTTP API:
- `/api/health` — health check
- `/api/github/*` — GitHub data (repos/branches)
- `/api/agent/run` — runs automation workflow
- `/api/twin/*` — Digital Twin state
- `/api/logs/*` — run history + step logs

### Services Layer
- `services/agent` — orchestrates flow (runner)
- `services/github` — Octokit client + branch/commit/pr logic
- `services/twin` — twin store + events + websocket broadcaster
- `services/logs` — persistent logging into SQLite

### Event Bus
A central event emitter:
- Agent emits events like `agent.started`, `github.branch.created`
- Twin listens and updates state
- Logger listens and stores logs

---

## Frontend Components (apps/web)

### Pages
- Dashboard — health + twin summary
- Run Automation — run workflow with safe inputs
- Digital Twin — realtime mirror with timeline
- Logs — run history + detailed step logs

### Real-time
- WebSocket: `ws://localhost:8080/ws/twin`
- Fallback: polling `/api/twin/state`

---

## Data Persistence
- SQLite stores:
  - run history (`runs`)
  - step logs (`logs`)
- Digital Twin state is in-memory (fast, realtime)

---

## Scaling Path
Next improvements:
- Swap SQLite → Postgres
- Add user auth + GitHub OAuth
- Support multiple repos and multiple simultaneous runs
- Add approvals and PR merge controls
