import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { env } from "../config/env.js";

import { listReposForViewer, getOctokit, parseRepo } from "../services/github/client.js";
import { listBranches as listBranchesSvc } from "../services/github/branch.js";

const router = Router();

/**
 * GET /api/github/status
 */
router.get(
  "/status",
  asyncHandler(async (req, res) => {
    res.json({
      ok: true,
      configured: Boolean(env.GITHUB_TOKEN)
    });
  })
);

/**
 * GET /api/github/repos
 */
router.get(
  "/repos",
  asyncHandler(async (req, res) => {
    if (!env.GITHUB_TOKEN) {
      return res.status(400).json({ ok: false, error: "Missing GITHUB_TOKEN in .env" });
    }
    const repos = await listReposForViewer();
    res.json({ ok: true, repos });
  })
);

/**
 * GET /api/github/branches?repo=owner/repo
 */
router.get(
  "/branches",
  asyncHandler(async (req, res) => {
    const repoFull = String(req.query.repo || "");
    if (!repoFull) return res.status(400).json({ ok: false, error: "repo query param is required" });
    if (!env.GITHUB_TOKEN) return res.status(400).json({ ok: false, error: "Missing GITHUB_TOKEN in .env" });

    const { owner, name } = parseRepo(repoFull);
    const octokit = getOctokit();

    const branches = await listBranchesSvc({ octokit, owner, repo: name });
    res.json({ ok: true, branches });
  })
);

router.get("/whoami", async (req, res) => {
  try {
    const { octokit } = await import("../services/github/client.js");
    const { data } = await octokit.request("GET /user");
    res.json({
      login: data.login,
      id: data.id
    });
  } catch (e) {
    res.status(401).json({ error: e.message });
  }
});


export default router;
