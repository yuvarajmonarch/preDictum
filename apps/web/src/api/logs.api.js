// apps/web/src/api/logs.api.js
import { api } from "./client.js";

/**
 * GET /api/logs/runs
 */
export async function listRuns() {
  const res = await api.get("/api/logs/runs");
  return res?.runs ?? [];
}

/**
 * GET /api/logs/runs/:runId
 */
export async function getRun(runId) {
  const res = await api.get(`/api/logs/runs/${encodeURIComponent(runId)}`);
  // expected: { run, logs }
  return res;
}
