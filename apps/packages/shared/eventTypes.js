// packages/shared/eventTypes.js

export const EVENT_TYPES = {
  // Agent lifecycle
  AGENT_STARTED: "agent.started",
  AGENT_COMPLETED: "agent.completed",
  AGENT_FAILED: "agent.failed",

  // GitHub actions
  GITHUB_REPO_SELECTED: "github.repo.selected",
  GITHUB_BRANCH_CREATED: "github.branch.created",
  GITHUB_COMMIT_PUSHED: "github.commit.pushed",
  GITHUB_PR_CREATED: "github.pr.created",

  // Digital Twin
  TWIN_INITIALIZED: "twin.initialized",
  TWIN_UPDATED: "twin.updated",
  TWIN_RESET: "twin.reset",

  // Timeline / logging
  TIMELINE_EVENT: "timeline.event",

  // System
  SYSTEM_ERROR: "system.error"
};

export const EVENT_SOURCE = {
  AGENT: "agent",
  GITHUB: "github",
  TWIN: "twin",
  SYSTEM: "system"
};
