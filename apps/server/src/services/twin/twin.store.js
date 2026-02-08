/**
 * Digital Twin Store (in-memory)
 * - Single source of truth for live system mirror
 * - Fast, safe updates via helper methods
 * - Used by: twin.events.js + twin.ws.js + /api/twin/state
 */

const MAX_TIMELINE = 250;

const defaultTwin = () => ({
  codeTwin: {
    status: "IDLE", // IDLE | STARTED | CREATING_BRANCH | PUSHING_CHANGE | PR_CREATED | ERROR | ...
    repo: null,
    baseBranch: "main",
    altBranch: null,
    prUrl: null,
    lastAction: "Waiting",
    updatedAt: new Date().toISOString()
  },
  timeline: [] // [{t, type, msg, meta?}]
});

let _twin = defaultTwin();

function clampTimeline(arr) {
  if (!Array.isArray(arr)) return [];
  if (arr.length <= MAX_TIMELINE) return arr;
  return arr.slice(arr.length - MAX_TIMELINE);
}

export function getTwinSnapshot() {
  // Return a deep-ish copy so callers can’t mutate store accidentally
  return JSON.parse(JSON.stringify(_twin));
}

export function resetTwin() {
  _twin = defaultTwin();
}

export function setTwin(nextTwin) {
  _twin = nextTwin ? nextTwin : defaultTwin();
}

/**
 * Partial merge update for codeTwin
 */
export function mergeCodeTwin(patch) {
  _twin.codeTwin = {
    ..._twin.codeTwin,
    ...(patch || {}),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Append an item to timeline
 */
export function appendTimeline(item) {
  const entry = {
    t: item?.t || new Date().toISOString(),
    type: String(item?.type || "EVENT"),
    msg: String(item?.msg || ""),
    meta: item?.meta ?? undefined
  };

  _twin.timeline = clampTimeline([...(Array.isArray(_twin.timeline) ? _twin.timeline : []), entry]);
}

/**
 * Replace timeline (rarely needed)
 */
export function setTimeline(items) {
  _twin.timeline = clampTimeline(Array.isArray(items) ? items : []);
}
