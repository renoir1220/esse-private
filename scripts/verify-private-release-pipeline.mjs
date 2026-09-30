import assert from "node:assert/strict";
import { access, mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = JSON.parse(
  await readFile(path.join(repositoryRoot, "sidecars", "agent", "package.json"), "utf8")
);
const product = JSON.parse(
  await readFile(path.join(repositoryRoot, "sidecars", "agent", "product.json"), "utf8")
);
const releaseWorkflow = await readFile(
  path.join(repositoryRoot, ".github", "workflows", "release.yml"),
  "utf8"
);
const tag = `v${packageJson.version}`;
const commit = "0123456789abcdef0123456789abcdef01234567";
const releaseRoot = await mkdtemp(path.join(tmpdir(), "esse-private-release-pipeline-"));
const targets = [
  { platform: "macos", arch: "arm64", extension: "dmg" }
];

function run(script, ...args) {
  const result = spawnSync(process.execPath, [path.join(repositoryRoot, "scripts", script), ...args], {
    cwd: repositoryRoot,
    encoding: "utf8"
  });
  assert.equal(result.status, 0, `${script} failed:\n${result.stdout}\n${result.stderr}`);
}

for (const target of targets) {
  const name = `${product.releasePrefix}-${target.platform}-${target.arch}-v${packageJson.version}.${target.extension}`;
  await writeFile(path.join(releaseRoot, name), `fake-${target.platform}-${target.arch}`, "utf8");
  run(
    "create-private-release-provenance.mjs",
    tag,
    commit,
    target.platform,
    target.arch,
    releaseRoot
  );
}

run("verify-private-release-provenance.mjs", tag, commit, releaseRoot);
// Reject a different commit, tampered bytes, and an obsolete Windows artifact.
function rejectVerification(expectedCommit = commit) {
  const result = spawnSync(process.execPath, [path.join(repositoryRoot, "scripts/verify-private-release-provenance.mjs"), tag, expectedCommit, releaseRoot], { encoding: "utf8" });
  assert.notEqual(result.status, 0, "Invalid provenance unexpectedly passed");
}
rejectVerification("a".repeat(40));
const dmg = path.join(releaseRoot, `${product.releasePrefix}-macos-arm64-v${packageJson.version}.dmg`);
const original = await readFile(dmg);
await writeFile(dmg, "tampered");
rejectVerification();
await writeFile(dmg, original);
const obsolete = path.join(releaseRoot, "obsolete-windows.exe");
await writeFile(obsolete, "obsolete");
rejectVerification();
await rm(obsolete);
run("create-private-release-metadata.mjs", tag, releaseRoot);

const metadata = JSON.parse(await readFile(path.join(releaseRoot, "sidecar-latest.json"), "utf8"));
assert.equal(metadata.tag, tag);
assert.equal(metadata.version, packageJson.version);
assert.equal(metadata.windowsX64Asset, undefined);
assert.equal(metadata.macosArm64Asset.endsWith(".dmg"), true);
const checksums = await readFile(path.join(releaseRoot, "checksums.txt"), "utf8");
assert.equal(checksums.trim().split(/\r?\n/).length, 1);
assert.match(releaseWorkflow, /name: Esse release/);
assert.match(releaseWorkflow, /needs: package/);
assert.match(releaseWorkflow, /actions\/download-artifact/);
assert.match(releaseWorkflow, /verify-private-release-provenance\.mjs/);
assert.match(releaseWorkflow, /create-private-release-metadata\.mjs/);
assert.match(releaseWorkflow, /refusing to overwrite it/);
assert.match(releaseWorkflow, /contents: write/);
assert.match(releaseWorkflow, /retention-days: 1/);
assert.doesNotMatch(releaseWorkflow, /self-hosted|windowsX64Asset|matrix:/);
assert.match(releaseWorkflow, /runs-on: macos-15/);
assert.match(releaseWorkflow, /runs-on: ubuntu-24.04/);
assert.match(releaseWorkflow, /prepare-private-release-notes\.mjs/);
assert.equal((releaseWorkflow.match(/actions\/upload-artifact/g) ?? []).length, 1);
assert.doesNotMatch(releaseWorkflow, /workflow_run:|build_run_id|run-id:|github-token:/);
assert.doesNotMatch(releaseWorkflow, /Start-Sleep|--clobber|publish-private-release/);
assert.doesNotMatch(releaseWorkflow, /windows-latest|runner_mode|release-notes-prefix\.md/);
await assert.rejects(access(path.join(repositoryRoot, ".github", "workflows", "release-publish.yml")));

await rm(releaseRoot, { recursive: true, force: true });
console.log(JSON.stringify({ status: "ok", tag, targets: targets.length, negativeChecks: 3 }));
