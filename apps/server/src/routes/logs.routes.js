// apps/server/src/routes/logs.routes.js
import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { listRuns, getRunWithLogs } from "../services/logs/changeLogger.js";

const router = Router();

/**
 * GET /api/logs/runs?limit=50
 * Returns recent runs
 */
router.get(
  "/runs",
  asyncHandler(async (req, res) => {
    const limitRaw = req.query.limit;
    let limit = 50;

    if (limitRaw !== undefined) {
      const parsed = Number(limitRaw);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return res.status(400).json({ ok: false, error: "limit must be a positive number" });
      }
      limit = Math.min(parsed, 200);
    }

    const runs = listRuns(limit);
    res.json({ ok: true, runs });
  })
);

/**
 * GET /api/logs/runs/:runId?logLimit=300
 * Returns a run with its logs
 */
router.get(
  "/runs/:runId",
  asyncHandler(async (req, res) => {
    const runId = req.params.runId;
    if (!runId || typeof runId !== "string") {
      return res.status(400).json({ ok: false, error: "runId is required" });
    }

    const logLimitRaw = req.query.logLimit;
    let logLimit = 300;

    if (logLimitRaw !== undefined) {
      const parsed = Number(logLimitRaw);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return res.status(400).json({ ok: false, error: "logLimit must be a positive number" });
      }
      logLimit = Math.min(parsed, 1000);
    }

    const data = getRunWithLogs(runId, logLimit);

    if (!data?.run) {
      return res.status(404).json({ ok: false, error: "Run not found" });
    }

    res.json({ ok: true, run: data.run, logs: data.logs });
  })
);

export default router;
