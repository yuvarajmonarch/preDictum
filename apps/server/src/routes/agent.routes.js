import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { env } from "../config/env.js";

// Service (to be implemented next)
import { runAgentAutomation } from "../services/agent/runner.js";

const router = Router();

/**
 * POST /api/agent/run
 * Body:
 * {
 *   repo: "owner/repo",
 *   baseBranch: "main",
 *   prompt: "describe change",
 *   altPrefix: "alternate",
 *   editFile: "README.md",
 *   dryRun: false
 * }
 */
router.post(
  "/run",
  asyncHandler(async (req, res) => {
    const {
      repo,
      baseBranch = "main",
      prompt,
      altPrefix = "alternate",
      editFile = "README.md",
      dryRun = false
    } = req.body || {};

    // Basic validation
    if (!repo || typeof repo !== "string") {
      return res.status(400).json({ ok: false, error: "repo is required (owner/repo)" });
    }
    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 3) {
      return res.status(400).json({ ok: false, error: "prompt is required" });
    }

    // If GitHub token missing, fail fast (clear message)
    if (!env.GITHUB_TOKEN) {
      return res.status(400).json({
        ok: false,
        error: "Missing GITHUB_TOKEN in apps/server/.env (needed to run automation)"
      });
    }

    const result = await runAgentAutomation({
      repo,
      baseBranch,
      prompt,
      altPrefix,
      editFile,
      dryRun,
      actor: "user" // later can be actual username/session
    });

    res.json({ ok: true, result });
  })
);

export default router;
