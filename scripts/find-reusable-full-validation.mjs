import { appendFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const artifactPrefix = "esse-private-full-validation-";

export function selectReusableArtifact(artifacts, runsById, repository) {
  for (const artifact of artifacts) {
    const runId = artifact.workflow_run?.id;
    const run = runsById.get(runId);
    if (
      !artifact.expired &&
      run?.status === "completed" &&
      run?.conclusion === "success" &&
      run?.event === "pull_request" &&
      run?.name === "CI" &&
      run?.head_repository?.full_name === repository
    ) {
      return { artifact, run };
    }
  }
  return undefined;
}

async function githubJson(url, token) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28"
    }
  });
  if (!response.ok) {
    throw new Error(`GitHub API request failed with HTTP ${response.status}: ${url}`);
  }
  return response.json();
}

async function writeOutputs(reusable, runId = "") {
  const output = process.env.GITHUB_OUTPUT;
  if (!output) return;
  await appendFile(output, `reusable=${reusable}\nsource_run_id=${runId}\n`, "utf8");
}

async function main() {
  const tree = process.argv[2];
  const repository = process.env.GITHUB_REPOSITORY;
  const token = process.env.GITHUB_TOKEN;
  const apiUrl = process.env.GITHUB_API_URL ?? "https://api.github.com";

  if (!/^[0-9a-f]{40}$/.test(tree ?? "")) {
    throw new Error("A full 40-character Git tree SHA is required.");
  }
  if (!repository || !token) {
    throw new Error("GITHUB_REPOSITORY and GITHUB_TOKEN are required.");
  }

  const name = `${artifactPrefix}${tree}`;
  const listing = await githubJson(
    `${apiUrl}/repos/${repository}/actions/artifacts?name=${encodeURIComponent(name)}&per_page=100`,
    token
  );
  const runsById = new Map();
  for (const artifact of listing.artifacts ?? []) {
    const runId = artifact.workflow_run?.id;
    if (runId && !runsById.has(runId)) {
      runsById.set(
        runId,
        await githubJson(`${apiUrl}/repos/${repository}/actions/runs/${runId}`, token)
      );
    }
  }

  const selected = selectReusableArtifact(listing.artifacts ?? [], runsById, repository);
  await writeOutputs(Boolean(selected), selected?.run.id ?? "");
  console.log(
    JSON.stringify({
      status: "ok",
      tree,
      reusable: Boolean(selected),
      sourceRunId: selected?.run.id ?? null
    })
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
