/**
 * Planner (simple MVP, scalable later)
 * Turns a user prompt into a structured execution plan.
 * Later: add tool selection, multi-step reasoning, file targeting, risk scoring, etc.
 */

export function buildPlan({ repo, baseBranch, altBranch, prompt, editFile, dryRun }) {
  const steps = [
    {
      id: "step_policy_check",
      type: "POLICY_CHECK",
      title: "Safety check",
      detail: `Ensure base branch "${baseBranch}" is not modified directly`
    },
    {
      id: "step_create_branch",
      type: "CREATE_ALT_BRANCH",
      title: "Create alternate branch",
      detail: `Create "${altBranch}" from "${baseBranch}"`
    },
    {
      id: "step_generate_patch",
      type: "GENERATE_PATCH",
      title: "Generate patch",
      detail: `Prepare content update for "${editFile}"`
    },
    {
      id: "step_push_change",
      type: "PUSH_CHANGE",
      title: "Push change to alternate branch",
      detail: `Commit update on "${altBranch}"`
    },
    {
      id: "step_open_pr",
      type: "OPEN_PR",
      title: "Open Pull Request",
      detail: `Create draft PR from "${altBranch}" → "${baseBranch}"`
    }
  ];

  const notes = [];
  if (dryRun) notes.push("Dry-run enabled: no GitHub writes will occur.");

  // Tiny heuristic: if prompt mentions "docs/readme", keep editFile as README.md
  // Later you can extend this to file selection.
  const normalized = String(prompt || "").toLowerCase();
  if (normalized.includes("readme")) notes.push("Prompt suggests README-related change.");
  if (normalized.includes("documentation") || normalized.includes("docs")) notes.push("Prompt suggests documentation update.");

  return {
    repo,
    baseBranch,
    altBranch,
    editFile,
    dryRun,
    steps,
    notes
  };
}
