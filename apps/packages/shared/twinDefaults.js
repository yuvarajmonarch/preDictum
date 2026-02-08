// packages/shared/twinDefaults.js

export function createInitialTwinState() {
  return {
    codeTwin: {
      status: "IDLE",            // IDLE | RUNNING | PR_CREATED | ERROR
      repo: null,
      baseBranch: "main",
      altBranch: null,
      prUrl: null,
      lastAction: null,
      updatedAt: null
    },

    timeline: [],                // chronological events

    meta: {
      runId: null,
      startedAt: null,
      finishedAt: null
    }
  };
}

export function createTimelineEvent({ type, msg, meta }) {
  return {
    type,
    msg: msg || "",
    meta: meta || null,
    t: Date.now()
  };
}
