import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";

// Twin store (to be implemented next)
import { getTwinSnapshot, resetTwin } from "../services/twin/twin.store.js";

const router = Router();

/**
 * GET /api/twin/state
 * Returns the current digital twin snapshot (for polling fallback)
 */
router.get(
  "/state",
  asyncHandler(async (req, res) => {
    const snapshot = getTwinSnapshot();
    res.json({ ok: true, twin: snapshot });
  })
);

/**
 * POST /api/twin/reset
 * Resets twin to defaults (useful for demos)
 */
router.post(
  "/reset",
  asyncHandler(async (req, res) => {
    resetTwin();
    res.json({ ok: true, message: "Twin reset" });
  })
);

export default router;
