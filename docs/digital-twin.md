# Digital Twin

## What is the Digital Twin here?
A **Digital Twin** is a live mirror of the system’s automation workflow:
- current state (`status`, `repo`, `branches`, `prUrl`)
- event timeline (what happened, when)
- UI reflects the twin in realtime

---

## Twin State Model (example)
```json
{
  "codeTwin": {
    "status": "RUNNING",
    "repo": "user/repo",
    "baseBranch": "main",
    "altBranch": "alternate/2026-02-07-1",
    "prUrl": null,
    "lastAction": "Branch created",
    "updatedAt": 1738930000000
  },
  "timeline": [
    { "type": "agent.started", "msg": "Run started", "t": 1738930000000 }
  ],
  "meta": {
    "runId": "run_abc123",
    "startedAt": 1738930000000,
    "finishedAt": null
  }
}
