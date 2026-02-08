import { Octokit } from "@octokit/rest";
import { env } from "../../config/env.js";

let _octokit = null;

function requireToken() {
  if (!env.GITHUB_TOKEN) {
    const err = new Error("GITHUB_TOKEN missing in apps/server/.env");
    err.status = 400;
    throw err;
  }
}

export function getOctokit() {
  if (_octokit) return _octokit;
  requireToken();
  _octokit = new Octokit({ auth: env.GITHUB_TOKEN });
  return _octokit;
}

/**
 * repoFull: "owner/name"
 */
export function parseRepo(repoFull) {
  const str = String(repoFull || "").trim();
  const parts = str.split("/");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    const err = new Error(`Invalid repo "${repoFull}". Use "owner/repo" format.`);
    err.status = 400;
    throw err;
  }
  return { owner: parts[0], name: parts[1] };
}

/**
 * List repos accessible by current token (viewer)
 */
export async function listReposForViewer() {
  const octokit = getOctokit();
  const res = await octokit.repos.listForAuthenticatedUser({ per_page: 100 });
  return res.data.map((r) => ({
    id: r.id,
    full_name: r.full_name,
    private: r.private,
    default_branch: r.default_branch
  }));
}
