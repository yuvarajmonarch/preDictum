import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { env } from "../config/env.js";

const router = Router();

// GET /api/llm/models
router.get(
  "/models",
  asyncHandler(async (req, res) => {
    if (!env.GEMINI_API_KEY) {
      return res.status(400).json({ ok: false, error: "Missing GEMINI_API_KEY" });
    }

    // NOTE: Some SDK versions don't expose listModels().
    // So we call the official REST endpoint directly.
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${env.GEMINI_API_KEY}`;

    const r = await fetch(url);
    const j = await r.json();

    if (!r.ok) {
      return res.status(r.status).json({ ok: false, error: j?.error?.message || "Failed to list models", raw: j });
    }

    const models = (j.models || []).map((m) => ({
      name: m.name, // e.g. "models/gemini-..."
      displayName: m.displayName,
      supportedGenerationMethods: m.supportedGenerationMethods || []
    }));

    res.json({ ok: true, models });
  })
);

export default router;
