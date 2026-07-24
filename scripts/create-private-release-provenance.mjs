import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, stat, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [expectedTag, commit, platform, arch, releaseRootArgument] = process.argv.slice(2);
const releaseRoot = releaseRootArgument
  ? path.resolve(releaseRootArgument)
  : path.join(repositoryRoot, "release");
const packageJson = JSON.parse(
  await readFile(path.join(repositoryRoot, "sidecars", "agent", "package.json"), "utf8")
);
const product = JSON.parse(
  await readFile(path.join(repositoryRoot, "sidecars", "agent", "product.json"), "utf8")
);

const targets = new Map([
  ["windows-x64", { extension: "exe" }],
  ["macos-arm64", { extension: "dmg" }]
]);
const targetKey = `${platform}-${arch}`;
const target = targets.get(targetKey);

assert(target, `Unsupported private release target: ${targetKey}`);
assert.equal(expectedTag, `v${packageJson.version}`, "Release tag must match the private Sidecar version");
assert.match(commit ?? "", /^[0-9a-f]{40}$/, "Release provenance requires a full Git commit SHA");

const assetName = `${product.releasePrefix}-${platform}-${arch}-v${packageJson.version}.${target.extension}`;
const assetPath = path.join(releaseRoot, assetName);
const content = await readFile(assetPath);
const details = await stat(assetPath);
assert(details.isFile() && details.size > 0, `Release asset is empty: ${assetName}`);

const provenance = {
  schemaVersion: 1,
  repository: "renoir1220/esse-private",
  workflow: ".github/workflows/release.yml",
  tag: expectedTag,
  commit,
  version: packageJson.version,
  target: { platform, arch },
  asset: {
    name: assetName,
    size: details.size,
    sha256: createHash("sha256").update(content).digest("hex")
  }
};
const provenanceName = `provenance-${platform}-${arch}.json`;
await writeFile(
  path.join(releaseRoot, provenanceName),
  `${JSON.stringify(provenance, null, 2)}\n`,
  "utf8"
);
console.log(JSON.stringify({ status: "ok", provenance: provenanceName, asset: assetName }));
