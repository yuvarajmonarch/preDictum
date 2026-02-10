// apps/web/src/api/agent.api.js
import { api } from "./client.js";

export async function listRepos() {
  const j = await api.get("/api/github/repos");
  return j?.repos || [];
}

export async function listBranches(repoFullName) {
  const j = await api.get(`/api/github/branches?repo=${encodeURIComponent(repoFullName)}`);
  return j?.branches || [];
}

export async function runAutomation(payload) {
  const j = await api.post("/api/agent/run", payload);
  // backend returns { ok:true, result: {...} }
  return j?.result || j;
}
