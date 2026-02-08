/**
 * Central Event Bus
 * - Used to broadcast internal events (agent stages, PR created, errors, etc.)
 * - Digital Twin can subscribe to these events to keep state consistent
 *
 * Design:
 * - Lightweight Node EventEmitter (fast + stable)
 * - One bus for the whole backend process
 */

import { EventEmitter } from "events";

class EventBus extends EventEmitter {
  emit(event, payload) {
    // Guard: never allow crashes from event handlers to bring down the app
    try {
      return super.emit(event, payload);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("EventBus handler error for event:", event, err);
      return false;
    }
  }
}

export const eventBus = new EventBus();

// Optional: set max listeners higher for scaling
eventBus.setMaxListeners(50);

/**
 * Common event names (you can keep these in packages/shared/eventTypes.js later)
 * - AGENT_RUN_STARTED
 * - AGENT_STAGE
 * - AGENT_RUN_COMPLETED
 * - AGENT_RUN_FAILED
 */
