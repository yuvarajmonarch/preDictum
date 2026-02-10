/**
 * Branch helpers:
 * - get SHA of a branch head
 * - create a new branch ref
 */

export async function getBranchSha({ octokit, owner, repo, branch }) {
  const res = await octokit.repos.getBranch({ owner, repo, branch });
  return res.data.commit.sha;
}

export async function createBranch({ octokit, owner, repo, newBranch, fromSha }) {
  const ref = `refs/heads/${newBranch}`;

  try {
    await octokit.git.createRef({
      owner,
      repo,
      ref,
      sha: fromSha
    });
    return { ref, sha: fromSha };
  } catch (e) {
    console.log("\n========== CREATE REF FAILED ==========");
    console.log("owner:", owner);
    console.log("repo :", repo);
    console.log("ref  :", ref);
    console.log("sha  :", fromSha);
    console.log("status:", e?.status);
    console.log("message:", e?.message);
    console.log("request url:", e?.request?.url);
    console.log("request method:", e?.request?.method);
    console.log("request headers auth?:", Boolean(e?.request?.headers?.authorization));
    console.log("response data:", e?.response?.data);
    console.log("======================================\n");
    throw e;
  }
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
