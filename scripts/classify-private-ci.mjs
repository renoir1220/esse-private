import { appendFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const lightweightExactPaths = new Set([
  ".gitattributes",
  ".gitignore",
  ".github/release-notes-prefix.md",
  "PRIVATE-RELEASE.md",
  "scripts/prepare-private-release-notes.mjs",
  "private-overlay.json",
  "scripts/create-private-release-metadata.mjs",
  "scripts/create-private-release-provenance.mjs",
  "scripts/verify-private-release-pipeline.mjs",
  "scripts/verify-private-release-provenance.mjs"
]);

function normalize(candidate) {
  return candidate.replaceAll("\\", "/").replace(/^\.\//, "");
}

export function classifyPaths(candidates) {
  const paths = [...new Set(candidates.map(normalize).filter(Boolean))].sort();
  if (paths.length === 0) {
    return {
      fullValidation: true,
      reason: "No changed paths were resolved, so validation fails closed.",
      paths
    };
  }

  const heavyweight = paths.filter((candidate) => {
    if (candidate.endsWith(".md")) return false;
    if (candidate.endsWith(".test.mjs") && candidate.startsWith("scripts/")) return false;
    return !lightweightExactPaths.has(candidate);
  });

  if (heavyweight.length > 0) {
    return {
      fullValidation: true,
      reason: `Package-affecting or unknown paths require full validation: ${heavyweight.join(", ")}`,
      paths
    };
  }

  return {
    fullValidation: false,
    reason: "Only documentation, publishing, metadata, or policy-test paths changed.",
    paths
  };
}

function readArgument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function git(...args) {
  return execFileSync("git", args, {
    cwd: repositoryRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  }).trim();
}

async function main() {
  const forced = process.argv.includes("--force-full");
  let result;

  if (forced) {
    result = {
      fullValidation: true,
      reason: "Full validation was explicitly requested.",
      paths: []
    };
  } else {
    const base = readArgument("--base");
    const head = readArgument("--head") ?? "HEAD";
    if (!base || /^0+$/.test(base)) {
      result = {
        fullValidation: true,
        reason: "The comparison base is unavailable, so validation fails closed.",
        paths: []
      };
    } else {
      const changed = git("diff", "--name-only", "--diff-filter=ACMRTUXBD", base, head)
        .split(/\r?\n/)
        .filter(Boolean);
      result = classifyPaths(changed);
    }
  }

  const payload = {
    status: "ok",
    fullValidation: result.fullValidation,
    reason: result.reason,
    changedPaths: result.paths
  };
  console.log(JSON.stringify(payload));

  if (process.env.GITHUB_OUTPUT) {
    await appendFile(
      process.env.GITHUB_OUTPUT,
      [
        `full_required=${result.fullValidation}`,
        `reason=${result.reason.replaceAll(/\r?\n/g, " ")}`,
        `changed_count=${result.paths.length}`
      ].join("\n") + "\n",
      "utf8"
    );
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
