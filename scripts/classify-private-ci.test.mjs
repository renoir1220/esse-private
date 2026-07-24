import assert from "node:assert/strict";
import test from "node:test";
import { classifyPaths } from "./classify-private-ci.mjs";

test("documentation and publish-only changes use the fast validation tier", () => {
  const result = classifyPaths([
    "README.md",
    ".github/workflows/release-publish.yml",
    "PRIVATE-RELEASE.md",
    "scripts/publish-private-release.ps1",
    "scripts/test-publish-private-release.ps1",
    "scripts/verify-private-release-pipeline.mjs"
  ]);
  assert.equal(result.fullValidation, false);
});

test("product and packaging changes require full validation", () => {
  for (const candidate of [
    "plugins/codex/src/providers/http.ts",
    "sidecars/agent/package-lock.json",
    ".github/workflows/release.yml",
    ".github/workflows/ci.yml",
    "scripts/find-reusable-validation.mjs",
    "install.ps1"
  ]) {
    assert.equal(classifyPaths([candidate]).fullValidation, true, candidate);
  }
});

test("unknown paths and an empty diff fail closed", () => {
  assert.equal(classifyPaths(["new-unclassified-file.txt"]).fullValidation, true);
  assert.equal(classifyPaths([]).fullValidation, true);
});
