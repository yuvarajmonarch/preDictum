/**
 * Branch helpers:
 * - get SHA of a branch head
 * - create a new branch ref
 */

export async function getBranchSha({ octokit, owner, repo, branch }) {
  const ref = await octokit.git.getRef({
    owner,
    repo,
    ref: `heads/${branch}`
  });
  return ref.data.object.sha;
}

export async function createBranch({ octokit, owner, repo, newBranch, fromSha }) {
  // newBranch should be like "alternate/ai-..."
  await octokit.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${newBranch}`,
    sha: fromSha
  });
}

/**
 * List branches in a repo
 */
export async function listBranches({ octokit, owner, repo }) {
  const res = await octokit.repos.listBranches({ owner, repo, per_page: 100 });
  return res.data.map((b) => ({
    name: b.name,
    protected: Boolean(b.protected)
  }));
}
