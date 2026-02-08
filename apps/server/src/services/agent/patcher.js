/**
 * Patcher (MVP)
 * Generates a safe, deterministic "change" based on prompt.
 *
 * For MVP: append a clearly formatted block to a target file.
 * Later: real code patching using diffs, AST transforms, LLM tool calls, etc.
 */

export function generatePatchedContent({ oldContent, prompt, runId, actor }) {
  const now = new Date().toISOString();

  const banner = [
    "",
    "## Agent Automation Update",
    `- Run ID: ${runId}`,
    `- Actor: ${actor || "user"}`,
    `- Time: ${now}`,
    `- Request: ${sanitizeLine(prompt)}`,
    ""
  ].join("\n");

  const base = typeof oldContent === "string" ? oldContent : "";
  return base.endsWith("\n") ? base + banner : base + "\n" + banner;
}

export function patchSummary({ editFile, prompt }) {
  return {
    touchedFiles: [editFile],
    message: `Updated ${editFile} based on user request.`,
    promptPreview: String(prompt || "").slice(0, 140)
  };
}

function sanitizeLine(s) {
  // prevent weird formatting/newline injection in the block
  return String(s || "").replace(/\s+/g, " ").trim();
}
