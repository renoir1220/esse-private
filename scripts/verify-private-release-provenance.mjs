import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [expectedTag, expectedCommit, releaseRootArgument] = process.argv.slice(2);
const releaseRoot = releaseRootArgument
  ? path.resolve(releaseRootArgument)
  : path.join(repositoryRoot, "release");
const packageJson = JSON.parse(
  await readFile(path.join(repositoryRoot, "sidecars", "agent", "package.json"), "utf8")
);
const product = JSON.parse(
  await readFile(path.join(repositoryRoot, "sidecars", "agent", "product.json"), "utf8")
);

assert.equal(expectedTag, `v${packageJson.version}`, "Release tag must match the private Sidecar version");
assert.match(expectedCommit ?? "", /^[0-9a-f]{40}$/, "Expected commit must be a full Git SHA");

const targets = [
  { platform: "windows", arch: "x64", extension: "exe" },
  { platform: "macos", arch: "arm64", extension: "dmg" }
];
const expectedFiles = new Set();

for (const target of targets) {
  const assetName = `${product.releasePrefix}-${target.platform}-${target.arch}-v${packageJson.version}.${target.extension}`;
  const provenanceName = `provenance-${target.platform}-${target.arch}.json`;
  expectedFiles.add(assetName);
  expectedFiles.add(provenanceName);

  const provenance = JSON.parse(await readFile(path.join(releaseRoot, provenanceName), "utf8"));
  assert.equal(provenance.schemaVersion, 1);
  assert.equal(provenance.repository, "renoir1220/esse-private");
  assert.equal(provenance.workflow, ".github/workflows/release.yml");
  assert.equal(provenance.tag, expectedTag);
  assert.equal(provenance.commit, expectedCommit);
  assert.equal(provenance.version, packageJson.version);
  assert.deepEqual(provenance.target, { platform: target.platform, arch: target.arch });
  assert.equal(provenance.asset.name, assetName);

  const assetPath = path.join(releaseRoot, assetName);
  const content = await readFile(assetPath);
  const details = await stat(assetPath);
  assert.equal(provenance.asset.size, details.size);
  assert.equal(provenance.asset.sha256, createHash("sha256").update(content).digest("hex"));
}

const actualFiles = (await readdir(releaseRoot)).filter((name) => !name.startsWith("."));
assert.deepEqual(
  new Set(actualFiles),
  expectedFiles,
  `Downloaded build artifacts contain unexpected or missing files: ${actualFiles.join(", ")}`
);
console.log(
  JSON.stringify({
    status: "ok",
    tag: expectedTag,
    commit: expectedCommit,
    targets: targets.length
  })
);
