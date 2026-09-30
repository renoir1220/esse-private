import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const releaseRoot = process.argv[3]
  ? path.resolve(process.argv[3])
  : path.join(repositoryRoot, "release");
const packageJson = JSON.parse(await readFile(path.join(repositoryRoot, "sidecars", "agent", "package.json"), "utf8"));
const product = JSON.parse(await readFile(path.join(repositoryRoot, "sidecars", "agent", "product.json"), "utf8"));
const expectedTag = process.argv[2];

assert.equal(product.releaseVersionPolicy, "independent-sidecar", "Private release metadata requires the independent Sidecar version policy");
assert.equal(expectedTag, `v${packageJson.version}`, "Release tag must match the private Sidecar version");

const targets = [
  { platform: "macos", arch: "arm64", metadata: "macosArm64", extension: "dmg" }
];
const files = await readdir(releaseRoot);
const assets = [];

for (const target of targets) {
  const expectedName = `${product.releasePrefix}-${target.platform}-${target.arch}-v${packageJson.version}.${target.extension}`;
  assert(files.includes(expectedName), `Missing release asset: ${expectedName}`);
  const content = await readFile(path.join(releaseRoot, expectedName));
  assets.push({
    ...target,
    name: expectedName,
    sha256: createHash("sha256").update(content).digest("hex")
  });
}

const metadata = {
  schemaVersion: 1,
  repository: "https://github.com/renoir1220/esse-private",
  version: packageJson.version,
  tag: expectedTag,
  distribution: product.edition
};
for (const asset of assets) {
  metadata[`${asset.metadata}Asset`] = asset.name;
  metadata[`${asset.metadata}Sha256`] = asset.sha256;
}

await writeFile(path.join(releaseRoot, "sidecar-latest.json"), `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
await writeFile(
  path.join(releaseRoot, "checksums.txt"),
  `${assets.map((asset) => `${asset.sha256}  ${asset.name}`).join("\n")}\n`,
  "utf8"
);
console.log(JSON.stringify({ status: "ok", version: packageJson.version, tag: expectedTag, assets: assets.length }));
