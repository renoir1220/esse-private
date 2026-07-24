import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";
import { selectReusableArtifact } from "./find-reusable-validation.mjs";

const repository = "renoir1220/esse-private";
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("reuses only a successful same-repository pull-request validation", () => {
  const artifacts = [
    { id: 1, expired: false, workflow_run: { id: 10 } },
    { id: 2, expired: false, workflow_run: { id: 20 } }
  ];
  const runs = new Map([
    [
      10,
      {
        id: 10,
        status: "completed",
        conclusion: "failure",
        event: "pull_request",
        name: "CI",
        head_repository: { full_name: repository }
      }
    ],
    [
      20,
      {
        id: 20,
        status: "completed",
        conclusion: "success",
        event: "pull_request",
        name: "CI",
        head_repository: { full_name: repository }
      }
    ]
  ]);
  assert.equal(selectReusableArtifact(artifacts, runs, repository)?.artifact.id, 2);
});

test("rejects expired, push, and foreign-repository artifacts", () => {
  const validRun = {
    status: "completed",
    conclusion: "success",
    event: "pull_request",
    name: "CI",
    head_repository: { full_name: repository }
  };
  assert.equal(
    selectReusableArtifact([{ expired: true, workflow_run: { id: 1 } }], new Map([[1, validRun]]), repository),
    undefined
  );
  assert.equal(
    selectReusableArtifact(
      [{ expired: false, workflow_run: { id: 2 } }],
      new Map([[2, { ...validRun, event: "push" }]]),
      repository
    ),
    undefined
  );
  assert.equal(
    selectReusableArtifact(
      [{ expired: false, workflow_run: { id: 3 } }],
      new Map([[3, { ...validRun, head_repository: { full_name: "someone/fork" } }]]),
      repository
    ),
    undefined
  );
});

test("records every successful PR tier and skips duplicate main validation", async () => {
  const workflow = await readFile(
    path.join(repositoryRoot, ".github", "workflows", "ci.yml"),
    "utf8"
  );
  assert.equal(
    [...workflow.matchAll(/if: needs\.classify\.outputs\.reused_run_id == ''/g)].length,
    2
  );
  assert.match(workflow, /name: Record exact-tree PR validation/);
  assert.match(workflow, /github\.event_name == 'pull_request'/);
  assert.match(workflow, /tier = if \(\$fullValidation\) \{ 'full' \} else \{ 'fast' \}/);
  assert.match(workflow, /name: esse-private-validation-\$\{\{ steps\.receipt\.outputs\.tree \}\}/);
});
