/**
 * PR helpers:
 * - createDraftPR
 */

export async function createDraftPR({ octokit, owner, repo, head, base, title, body }) {
  const res = await octokit.pulls.create({
    owner,
    repo,
    head,
    base,
    title,
    body,
    draft: true
  });

  return res.data.html_url;
}
