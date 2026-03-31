// apps/server/src/services/agent/patcher.js
import { env } from "../../config/env.js";

/**
 * patchSummary(): shown in logs / PR body
 */
export function patchSummary({ editFile, prompt, model = "none" }) {
  return {
    touchedFiles: [editFile],
    message: `Updated ${editFile} based on user request.`,
    promptPreview: String(prompt || "").slice(0, 140),
    model
  };
}

/**
 * generatePatchedContent():
 * - Reads old content
 * - Uses Gemini to generate a response block based on prompt
 * - Appends or injects it in README.md
 */
export async function generatePatchedContent({ oldContent, prompt, runId, actor, repo, baseBranch }) {
  const oldText = String(oldContent || "");
  const cleanPrompt = String(prompt || "").trim();

  // fallback content (if Gemini isn't configured / fails)
  const fallback = buildBlock({
    title: "Agent Response (fallback)",
    body: `Prompt: ${cleanPrompt || "(empty)"}\n\n(LLM not configured or request failed)`,
    runId,
    actor
  });

  // If no prompt, just append fallback
  if (!cleanPrompt) return oldText + "\n\n" + fallback;

  // If no Gemini key, fallback
  if (!env.GEMINI_API_KEY) return oldText + "\n\n" + fallback;

  // Try Gemini
  try {
    const llmText = await callGemini(cleanPrompt, {
      repo,
      baseBranch,
      runId,
      actor
    });

    const block = buildBlock({
      title: "Agent Response",
      body: llmText,
      runId,
      actor
    });

    // ✅ Replace previous agent block if exists, else append
    const next = upsertAgentSection(oldText, block);
    return next;
  } catch (err) {
    const msg = err?.message ? String(err.message) : "Gemini failed";
    const failBlock = buildBlock({
      title: "Agent Response (error)",
      body: `Prompt: ${cleanPrompt}\n\nGemini error: ${msg}`,
      runId,
      actor
    });

    return upsertAgentSection(oldText, failBlock);
  }
}

/* ---------------- helpers ---------------- */

function buildBlock({ title, body, runId, actor }) {
  const stamp = new Date().toISOString();
  return [
    `## ${title}`,
    ``,
    `**Run:** ${runId}`,
    `**Actor:** ${actor}`,
    `**Time:** ${stamp}`,
    ``,
    `---`,
    ``,
    body,
    ``,
    `---`
  ].join("\n");
}

/**
 * Replace existing section (between markers) or append new section.
 */
function upsertAgentSection(oldText, newBlock) {
  const start = "<!-- AGENTIC_TWIN:START -->";
  const end = "<!-- AGENTIC_TWIN:END -->";

  const wrapped = [start, newBlock, end].join("\n");

  if (oldText.includes(start) && oldText.includes(end)) {
    const before = oldText.split(start)[0];
    const after = oldText.split(end)[1] || "";
    return `${before}${wrapped}${after}`.trim() + "\n";
  }

  return (oldText.trim() + "\n\n" + wrapped + "\n").trim() + "\n";
}

async function callGemini(prompt, ctx) {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");

  const modelName = env.GEMINI_MODEL || "gemini-2.5-flash";
  const client = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  const model = client.getGenerativeModel({ model: modelName });

  const system = [
    "You are an automation agent inside a GitHub PR tool.",
    "Return the answer as clean markdown.",
    "Be precise, structured, and short where possible.",
    "If user asks to convert code languages, explain what would change and show a small example.",
    "",
    `Context: repo=${ctx.repo || "unknown"}, baseBranch=${ctx.baseBranch || "main"}, run=${ctx.runId}`
  ].join("\n");

  const fullPrompt = `${system}\n\nUser request:\n${prompt}`;

  const res = await model.generateContent(fullPrompt);

  const text = res?.response?.text?.() || "";
  return text.trim() || "(Empty response from Gemini)";
}
