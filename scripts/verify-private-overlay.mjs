import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(repositoryRoot, "private-overlay.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const upstreamRef = process.argv[2] || `upstream/${manifest.upstream?.branch || "main"}`;

assert.equal(manifest.schemaVersion, 1, "Unsupported private overlay schema");
assert.match(manifest.upstream?.repository || "", /^https:\/\/github\.com\/[^/]+\/[^/]+(?:\.git)?$/, "Overlay manifest must declare the public upstream repository");
assert.match(manifest.upstream?.branch || "", /^[A-Za-z0-9._/-]+$/, "Overlay manifest must declare a valid upstream branch");
assert(Array.isArray(manifest.overlayGroups) && manifest.overlayGroups.length > 0, "Overlay manifest must declare overlayGroups");

const normalize = (value) => value.replaceAll("\\", "/").replace(/^\.\/+/, "");
const groupedPaths = [];
for (const group of manifest.overlayGroups) {
  assert.match(group.name || "", /^[a-z0-9-]+$/, "Every overlay group needs a stable kebab-case name");
  assert(typeof group.reason === "string" && group.reason.trim().length >= 20, `Overlay group ${group.name} needs an explicit reason`);
  assert(Array.isArray(group.paths) && group.paths.length > 0, `Overlay group ${group.name} must declare exact paths`);
  groupedPaths.push(...group.paths.map(normalize));
}
const allowedPaths = new Set(groupedPaths);

for (const candidate of allowedPaths) {
  assert(candidate && candidate !== "." && !candidate.startsWith("/") && !candidate.split("/").includes(".."), `Unsafe overlay path: ${candidate}`);
}
assert.equal(allowedPaths.size, groupedPaths.length, "Overlay manifest contains a path in more than one group");

const git = (...args) => execFileSync("git", args, {
  cwd: repositoryRoot,
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"]
}).trim();

try {
  git("rev-parse", "--verify", upstreamRef);
} catch {
  throw new Error(`Missing ${upstreamRef}. Fetch ${manifest.upstream.repository} ${manifest.upstream.branch} before verifying the private overlay.`);
}

try {
  git("merge-base", "--is-ancestor", upstreamRef, "HEAD");
} catch {
  const mergeBase = git("merge-base", upstreamRef, "HEAD");
  throw new Error(
    `${upstreamRef} is not an ancestor of HEAD (merge base ${mergeBase}). ` +
    `Merge the current Community branch before changing or releasing the private downstream.`
  );
}

const changedPaths = git("diff", "--name-only", "-z", upstreamRef, "--")
  .split("\0")
  .map(normalize)
  .filter(Boolean);
const outsideOverlay = changedPaths.filter((changedPath) => !allowedPaths.has(changedPath));

if (outsideOverlay.length) {
  throw new Error(
    `Private changes escaped the documented overlay:\n${outsideOverlay.map((entry) => `- ${entry}`).join("\n")}\n` +
    "Move shared behavior to Community first, or explicitly review and document a genuine private overlay path."
  );
}

const upstreamCommit = git("rev-parse", upstreamRef);
const headCommit = git("rev-parse", "HEAD");
console.log(JSON.stringify({
  status: "ok",
  upstreamRef,
  upstreamCommit,
  headCommit,
  changedPaths: changedPaths.length,
  overlayGroups: manifest.overlayGroups.length,
  allowedExactPaths: allowedPaths.size
}));
