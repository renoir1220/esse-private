import assert from "node:assert/strict";
import test from "node:test";
import { selectReusableArtifact } from "./find-reusable-full-validation.mjs";

const repository = "renoir1220/esse-private";

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
