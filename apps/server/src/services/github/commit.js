/**
 * File content helpers using GitHub Contents API:
 * - getFile: read file content & sha
 * - updateFile: commit new content to a branch
 */

function decodeBase64(b64) {
  return Buffer.from(b64, "base64").toString("utf-8");
}

function encodeBase64(str) {
  return Buffer.from(str, "utf-8").toString("base64");
}

export async function getFile({ octokit, owner, repo, path, branch }) {
  const res = await octokit.repos.getContent({
    owner,
    repo,
    path,
    ref: branch
  });

  if (Array.isArray(res.data)) {
    const err = new Error(`"${path}" is a directory, expected a file.`);
    err.status = 400;
    throw err;
  }

  const content = decodeBase64(res.data.content || "");
  const sha = res.data.sha;

  return { content, sha };
}

export async function updateFile({ octokit, owner, repo, path, branch, sha, message, content }) {
  const res = await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    branch,
    sha,
    message,
    content: encodeBase64(String(content ?? ""))
  });

  return {
    commitSha: res.data.commit?.sha || null,
    contentPath: res.data.content?.path || path
  };
}
