import { Router } from "express";

const router = Router();

/**
 * GET /api/health
 * Simple liveness probe
 */
router.get("/", (req, res) => {
  res.json({
    ok: true,
    service: "agentic-digital-twin-server",
    time: new Date().toISOString()
  });
});

export default router;
