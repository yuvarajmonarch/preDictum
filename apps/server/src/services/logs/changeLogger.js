// apps/server/src/services/logs/changeLogger.js
import { db } from "../../db/db.js";

function now() {
  return Date.now();
}

// ------------------------
// RUNS: create + update
// ------------------------
export function ensureRun({
  id,
  repo,
  baseBranch,
  altBranch = null,
  editFile = null,
  prompt = null,
  dryRun = false,
  status = "RUNNING",
  prUrl = null,
  error = null
}) {
  const created = now();

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO runs
      (id, repo, base_branch, alt_branch, edit_file, prompt, dry_run, status, pr_url, error, created_at, updated_at)
    VALUES
      (?,  ?,   ?,           ?,          ?,        ?,      ?,       ?,      ?,     ?,     ?,          ?)
  `);

  stmt.run(
    id,
    repo,
    baseBranch,
    altBranch,
    editFile,
    prompt,
    dryRun ? 1 : 0,
    status,
    prUrl,
    error,
    created,
    created
  );
}

export function updateRun(runId, patch = {}) {
  const fields = [];
  const values = [];

  if (patch.status !== undefined) {
    fields.push("status = ?");
    values.push(patch.status);
  }
  if (patch.altBranch !== undefined) {
    fields.push("alt_branch = ?");
    values.push(patch.altBranch);
  }
  if (patch.prUrl !== undefined) {
    fields.push("pr_url = ?");
    values.push(patch.prUrl);
  }
  if (patch.error !== undefined) {
    fields.push("error = ?");
    values.push(patch.error);
  }

  fields.push("updated_at = ?");
  values.push(now());

  const stmt = db.prepare(`UPDATE runs SET ${fields.join(", ")} WHERE id = ?`);
  stmt.run(...values, runId);
}

// ------------------------
// LOGS: insert step
// ------------------------
export function logStep(runId, type, message, meta = null) {
  // Ensure parent run exists (prevents FOREIGN KEY failures)
  db.prepare(`
    INSERT OR IGNORE INTO runs
      (id, repo, base_branch, dry_run, status, created_at, updated_at)
    VALUES
      (?, 'unknown/unknown', 'main', 1, 'RUNNING', ?, ?)
  `).run(runId, now(), now());

  const stmt = db.prepare(`
    INSERT INTO logs (run_id, type, message, meta, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run(runId, type, message, meta ? JSON.stringify(meta) : null, now());
}

// ------------------------
// READ APIs (used by logs.routes.js)
// ------------------------
export function listRuns(limit = 50) {
  const stmt = db.prepare(`
    SELECT
      id,
      repo,
      base_branch as baseBranch,
      alt_branch as altBranch,
      edit_file as editFile,
      dry_run as dryRun,
      status,
      pr_url as prUrl,
      error,
      created_at as createdAt,
      updated_at as updatedAt
    FROM runs
    ORDER BY created_at DESC
    LIMIT ?
  `);

  const rows = stmt.all(limit);
  return rows.map((r) => ({ ...r, dryRun: !!r.dryRun }));
}

export function getRunWithLogs(runId, logLimit = 300) {
  const runStmt = db.prepare(`
    SELECT
      id,
      repo,
      base_branch as baseBranch,
      alt_branch as altBranch,
      edit_file as editFile,
      prompt,
      dry_run as dryRun,
      status,
      pr_url as prUrl,
      error,
      created_at as createdAt,
      updated_at as updatedAt
    FROM runs
    WHERE id = ?
    LIMIT 1
  `);

  const run = runStmt.get(runId);
  if (!run) return { run: null, logs: [] };

  const logsStmt = db.prepare(`
    SELECT
      id,
      run_id as runId,
      type,
      message,
      meta,
      created_at as createdAt
    FROM logs
    WHERE run_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `);

  const logs = logsStmt.all(runId, logLimit).map((l) => ({
    ...l,
    meta: l.meta ? safeJsonParse(l.meta) : null
  }));

  return { run: { ...run, dryRun: !!run.dryRun }, logs };
}

function safeJsonParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}
