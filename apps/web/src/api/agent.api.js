// apps/web/src/api/agent.api.js
import { api } from "./client.js";

/**
 * POST /api/agent/run
 * body: { repo, baseBranch, prompt, altPrefix, editFile, dryRun }
 */
export async function runAgent(payload) {
  const res = await api.post("/api/agent/run", payload);
  // backend returns { ok: true, result: {...} } (expected)
  return res?.result ?? res;
}
