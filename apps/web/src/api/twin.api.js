// apps/web/src/api/twin.api.js
import { api } from "./client.js";

/**
 * GET /api/twin/state
 */
export async function getTwinState() {
  const res = await api.get("/api/twin/state");
  return res?.twin ?? null;
}

/**
 * POST /api/twin/reset
 */
export async function resetTwin() {
  const res = await api.post("/api/twin/reset", {});
  return res?.twin ?? null;
}
