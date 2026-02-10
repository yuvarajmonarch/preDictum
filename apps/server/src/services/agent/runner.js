import crypto from "crypto";
import { env } from "../../config/env.js";
import { buildPlan } from "./planner.js";
import { generatePatchedContent, patchSummary } from "./patcher.js";

/**
 * Main Agent Runner
 * - Always creates an alternate branch (safe workflow)
 * - Applies changes only on alternate branch
 * - Opens a draft PR back to base
 * - Streams updates to the Digital Twin (when twin module exists)
 * - Logs run steps (SQLite) safely (no FOREIGN KEY failures)
 *
 * NOTE: This file uses lazy imports so the server can boot even if
 * github/twin/log modules are not created yet. Once you add them, it will use them.
 */

function makeAltBranch(prefix = "alternate") {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const stamp =
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-` +
    `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  return `${prefix}/ai-${stamp}`;
}

async function safeImport(path) {
  try {
    return await import(path);
  } catch {
    return null;
  }
}

async function emitEvent(type, payload) {
  const mod = await safeImport("../../events/eventBus.js");
  if (!mod?.eventBus?.emit) return;
  mod.eventBus.emit(type, payload);
}

async function twinUpdate(kind, payload) {
  // Optional: only works after you implement services/twin/twin.events.js
  const mod = await safeImport("../twin/twin.events.js");
  if (!mod) return;

  const fn =
    kind === "code"
      ? mod.updateCodeTwin
      : kind === "timeline"
      ? mod.appendTwinTimeline
      : null;

  if (typeof fn === "function") fn(payload);
}

/**
 * Logging bridge
 * - ensures run row exists (prevents FOREIGN KEY constraint failed)
 * - logs steps to logs table
 * - updates run status/fields when needed
 */
async function ensureRunRow(run) {
  const mod = await safeImport("../logs/changeLogger.js");
  if (!mod?.ensureRun) return;
  mod.ensureRun(run);
}

async function updateRunRow(runId, patch) {
  const mod = await safeImport("../logs/changeLogger.js");
  if (!mod?.updateRun) return;
  mod.updateRun(runId, patch);
}

async function logStep(runId, type, message, meta) {
  const mod = await safeImport("../logs/changeLogger.js");
  if (!mod?.logStep) return;
  mod.logStep(runId, type, message, meta);
}

/**
 * Public API used by routes/agent.routes.js
 */
export async function runAgentAutomation({
  repo,
  baseBranch = "main",
  prompt,
  altPrefix = "alternate",
  editFile = "README.md",
  dryRun = false,
  actor = "user"
}) {
  const runId = crypto.randomUUID();
  const altBranch = makeAltBranch(altPrefix);

  // Create run row FIRST (prevents FK failure when logging)
  await ensureRunRow({
    id: runId,
    repo,
    baseBranch,
    altBranch,
    editFile,
    prompt,
    dryRun,
    status: "RUNNING"
  });

  // Twin: starting state
  await twinUpdate("code", {
    status: "STARTED",
    repo,
    baseBranch,
    altBranch,
    lastAction: "Run started",
    updatedAt: Date.now()
  });

  await logStep(runId, "agent.started", "Automation run started", {
    repo,
    baseBranch,
    altBranch,
    editFile,
    dryRun,
    actor
  });

  // Build plan (structured + displayable)
  const plan = buildPlan({ repo, baseBranch, altBranch, prompt, editFile, dryRun });

  await logStep(runId, "agent.plan", "Execution plan built", {
    steps: plan.steps.map((s) => s.type)
  });

  await twinUpdate("timeline", {
    t: Date.now(),
    type: "PLAN_BUILT",
    msg: `Plan built with ${plan.steps.length} steps`
  });

  // Generate patch summary (MVP)
  const summary = patchSummary({ editFile, prompt });

  // DRY RUN: no GitHub writes
  if (dryRun) {
    await twinUpdate("code", {
      status: "DRY_RUN",
      repo,
      baseBranch,
      altBranch,
      lastAction: "Dry run completed (no GitHub writes)",
      updatedAt: Date.now()
    });

    await updateRunRow(runId, { status: "DONE", altBranch });

    await logStep(runId, "agent.completed", "Dry run completed", {
      summary,
      plan,
      dryRun: true
    });

    return {
      runId,
      repo,
      baseBranch,
      altBranch,
      editFile,
      dryRun: true,
      plan,
      summary,
      prUrl: null
    };
  }

  // ---- GitHub write phase ----
  if (!env.GITHUB_TOKEN) {
    const err = new Error("GITHUB_TOKEN missing in apps/server/.env");
    err.status = 400;
    await updateRunRow(runId, { status: "ERROR", error: err.message });
    await logStep(runId, "agent.failed", err.message);
    throw err;
  }

  await twinUpdate("code", {
    status: "CONNECTING_GITHUB",
    repo,
    baseBranch,
    altBranch,
    lastAction: "Connecting to GitHub",
    updatedAt: Date.now()
  });

  await logStep(runId, "github.connect", "Preparing GitHub operations");

  // Lazy-load GitHub services
  const githubClient = await safeImport("../github/client.js");
  const githubBranch = await safeImport("../github/branch.js");
  const githubCommit = await safeImport("../github/commit.js");
  const githubPR = await safeImport("../github/pr.js");

  if (!githubClient || !githubBranch || !githubCommit || !githubPR) {
    const err = new Error(
      "GitHub modules missing. Create services/github/client.js, branch.js, commit.js, pr.js"
    );
    err.status = 500;
    await updateRunRow(runId, { status: "ERROR", error: err.message });
    await logStep(runId, "system.error", err.message);
    throw err;
  }

  const octokit = githubClient.getOctokit();
  const { owner, repo: repoName } = githubClient.parseRepo(repo);

  try {
    // 1) Create alternate branch from base
    await twinUpdate("code", {
      status: "CREATING_BRANCH",
      repo,
      baseBranch,
      altBranch,
      lastAction: `Creating ${altBranch}`,
      updatedAt: Date.now()
    });

    await logStep(runId, "github.branch.create", `Creating alternate branch ${altBranch}`);

    const baseSha = await githubBranch.getBranchSha({
      octokit,
      owner,
      repo: repoName,
      branch: baseBranch
    });

    await githubBranch.createBranch({
      octokit,
      owner,
      repo: repoName,
      newBranch: altBranch,
      fromSha: baseSha
    });

    await updateRunRow(runId, { altBranch });

    await logStep(runId, "github.branch.created", `Branch created: ${altBranch}`, { baseSha });

    await twinUpdate("timeline", {
      t: Date.now(),
      type: "BRANCH_CREATED",
      msg: `Created ${altBranch} from ${baseBranch}`
    });

    // 2) Read file content on alt branch
    await twinUpdate("code", {
      status: "READING_FILE",
      repo,
      baseBranch,
      altBranch,
      lastAction: `Reading ${editFile}`,
      updatedAt: Date.now()
    });

    await logStep(runId, "github.file.read", `Reading ${editFile} on ${altBranch}`);

    const fileObj = await githubCommit.getFile({
      octokit,
      owner,
      repo: repoName,
      path: editFile,
      branch: altBranch
    });

    // 3) Patch content
    const newContent = generatePatchedContent({
      oldContent: fileObj.content,
      prompt,
      runId,
      actor
    });

    await logStep(runId, "agent.patch", `Patch prepared for ${editFile}`, {
      bytesOld: fileObj.content?.length || 0,
      bytesNew: newContent?.length || 0
    });

    // 4) Commit change to alt branch
    await twinUpdate("code", {
      status: "PUSHING_CHANGE",
      repo,
      baseBranch,
      altBranch,
      lastAction: `Updating ${editFile} on ${altBranch}`,
      updatedAt: Date.now()
    });

    await githubCommit.updateFile({
      octokit,
      owner,
      repo: repoName,
      path: editFile,
      branch: altBranch,
      sha: fileObj.sha,
      message: `Agent update: ${editFile} (run ${runId})`,
      content: newContent
    });

    await logStep(runId, "github.commit.pushed", `Change pushed to ${altBranch}`, {
      editFile
    });

    await twinUpdate("timeline", {
      t: Date.now(),
      type: "CHANGE_PUSHED",
      msg: `Updated ${editFile} on ${altBranch}`
    });

    // 5) Open draft PR
    await twinUpdate("code", {
      status: "OPENING_PR",
      repo,
      baseBranch,
      altBranch,
      lastAction: "Creating draft PR",
      updatedAt: Date.now()
    });

    await logStep(runId, "github.pr.create", "Creating draft PR");

    const prUrl = await githubPR.createDraftPR({
      octokit,
      owner,
      repo: repoName,
      head: altBranch,
      base: baseBranch,
      title: `Agent Automation (run ${runId})`,
      body: [
        "This PR was created by the agent automation.",
        "",
        `- Run ID: ${runId}`,
        `- Base: ${baseBranch}`,
        `- Head: ${altBranch}`,
        `- File: ${editFile}`,
        "",
        `Request: ${prompt}`
      ].join("\n")
    });

    await updateRunRow(runId, { status: "DONE", prUrl, altBranch });

    await logStep(runId, "github.pr.created", "Draft PR created", { prUrl });

    await twinUpdate("code", {
      status: "PR_CREATED",
      repo,
      baseBranch,
      altBranch,
      prUrl,
      lastAction: "Draft PR created",
      updatedAt: Date.now()
    });

    await twinUpdate("timeline", {
      t: Date.now(),
      type: "PR_CREATED",
      msg: `Draft PR opened: ${prUrl}`
    });

    // Optional events
    await emitEvent("agent.completed", { runId, repo, baseBranch, altBranch, prUrl });

    await logStep(runId, "agent.done", "Automation completed successfully");

    return {
      runId,
      repo,
      baseBranch,
      altBranch,
      editFile,
      dryRun: false,
      plan,
      summary,
      prUrl
    };
  } catch (e) {
    const message = e?.message || "Unknown automation failure";

    await updateRunRow(runId, { status: "ERROR", error: message });

    await logStep(runId, "agent.failed", message, {
      stack: e?.stack || null
    });

    await twinUpdate("code", {
      status: "ERROR",
      repo,
      baseBranch,
      altBranch,
      lastAction: message,
      updatedAt: Date.now()
    });

    await twinUpdate("timeline", {
      t: Date.now(),
      type: "ERROR",
      msg: message
    });

    await emitEvent("agent.failed", { runId, repo, baseBranch, altBranch, error: message });

    throw e;
  }
}
