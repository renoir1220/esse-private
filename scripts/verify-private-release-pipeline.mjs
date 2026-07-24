import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
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
const tag = `v${packageJson.version}`;
const commit = "0123456789abcdef0123456789abcdef01234567";
const releaseRoot = await mkdtemp(path.join(tmpdir(), "esse-private-release-pipeline-"));
const targets = [
  { platform: "windows", arch: "x64", extension: "exe" },
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
run("create-private-release-metadata.mjs", tag, releaseRoot);

const metadata = JSON.parse(await readFile(path.join(releaseRoot, "sidecar-latest.json"), "utf8"));
assert.equal(metadata.tag, tag);
assert.equal(metadata.version, packageJson.version);
assert.equal(metadata.windowsX64Asset.endsWith(".exe"), true);
assert.equal(metadata.macosArm64Asset.endsWith(".dmg"), true);
const checksums = await readFile(path.join(releaseRoot, "checksums.txt"), "utf8");
assert.equal(checksums.trim().split(/\r?\n/).length, 2);

console.log(JSON.stringify({ status: "ok", tag, targets: targets.length }));
