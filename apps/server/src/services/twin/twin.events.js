/**
 * Digital Twin Events Layer
 * - “Official” way to update the Twin
 * - Adds semantic helpers: updateCodeTwin, appendTwinTimeline, setError, etc.
 * - Also triggers WebSocket broadcasts (if ws is attached)
 */

import { mergeCodeTwin, appendTimeline, getTwinSnapshot } from "./twin.store.js";
import { broadcastTwin } from "./twin.ws.js";

function safeBroadcast() {
  try {
    broadcastTwin(getTwinSnapshot());
  } catch {
    // ignore if ws not ready
  }
}

export function updateCodeTwin(patch) {
  mergeCodeTwin(patch);
  safeBroadcast();
}

export function appendTwinTimeline({ t, type, msg, meta }) {
  appendTimeline({ t, type, msg, meta });
  safeBroadcast();
}

export function setTwinError(message, meta) {
  mergeCodeTwin({
    status: "ERROR",
    lastAction: message || "Error"
  });

  appendTimeline({
    type: "ERROR",
    msg: message || "Unknown error",
    meta
  });

  safeBroadcast();
}

/**
 * Optional helper for your agent runner
 */
export function markStage(stage, details = {}) {
  updateCodeTwin({
    status: stage,
    ...details
  });

  appendTwinTimeline({
    type: stage,
    msg: details?.lastAction || `Stage: ${stage}`,
    meta: details
  });
}
