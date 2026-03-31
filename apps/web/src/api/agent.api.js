// apps/web/src/api/agent.api.js
import { api } from "./client.js";

/**
 * Backend responses look like:
 *  - GET /api/github/repos => { ok: true, repos: [...] }
 *  - GET /api/github/branches?repo=owner/repo => { ok: true, branches: [...] }
 *  - POST /api/agent/run => { ok: true, result: {...} }
 *
 * So we unwrap them here to keep UI simple.
 */

export async function listRepos() {
  const j = await api.get("/api/github/repos");
  return Array.isArray(j?.repos) ? j.repos : [];
}

export async function listBranches(repo) {
  const j = await api.get(`/api/github/branches?repo=${encodeURIComponent(repo)}`);
  return Array.isArray(j?.branches) ? j.branches : [];
}

export async function runAutomation(body) {
  const j = await api.post("/api/agent/run", body);
  // return the real run result
  return j?.result || null;
}
