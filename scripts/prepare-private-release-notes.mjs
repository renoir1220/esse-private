import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function validateReleaseNotes(notes, tag, previousTag) {
  assert.match(tag, /^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/, "Invalid release tag");
  assert.match(previousTag, /^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/, "Invalid previous tag");
  assert.notEqual(tag, previousTag, "Previous tag must differ from the release tag");
  const parts = notes.split(/^## English\s*$/m);
  assert.equal(parts.length, 2, "Notes require Simplified Chinese followed by English");
  assert.match(parts[0], /^## 简体中文\s*$/m);
  const compare = `https://github.com/renoir1220/esse-private/compare/${previousTag}...${tag}`;
  for (const part of parts) {
    assert(part.includes(`### Esse ${tag.slice(1)}\n`), `Notes must name ${tag}`);
    assert(part.trim().endsWith(`](${compare})`), `Each language must end with the exact full-changelog link: ${compare}`);
    assert.match(part, /^- \S.+/m, "Each language requires version-specific changes");
    assert.doesNotMatch(part, /TODO|TBD|待填写|占位/i, "Release notes still contain placeholders");
  }
  return notes.trim();
}

export function appendSigningDisclosure(notes, signed) {
  assert(["true", "false"].includes(signed), "Signing verification result must be explicit");
  const zh = signed === "true"
    ? "macOS ARM64：本次制品已通过 Developer ID 签名、Gatekeeper 和 Apple 公证票据验证。"
    : "macOS ARM64：本次制品仅通过 ad-hoc 结构签名校验，未做 Developer ID 签名或 Apple 公证；不建立发布者身份，Gatekeeper 仍可能阻止运行。";
  const en = signed === "true"
    ? "macOS ARM64: this artifact passed Developer ID signature, Gatekeeper and Apple notarization-ticket verification."
    : "macOS ARM64: this artifact has only a verified ad-hoc structural signature, without Developer ID signing or Apple notarization. It does not establish publisher identity and Gatekeeper may block it.";
  const [chinese, english] = notes.split(/^## English\s*$/m);
  // Keep the full-changelog link at the end of each language section.
  const insert = (section, disclosure) => section.replace(/(\n\[[^\n]+\]\(https:\/\/github\.com\/renoir1220\/esse-private\/compare\/[^\n]+\)\s*)$/, `\n- ${disclosure}\n$1`);
  return `${insert(chinese, zh).trim()}\n\n## English\n${insert(english, en).trim()}\n`;
}

async function main() {
  const [tag, mode] = process.argv.slice(2);
  assert.match(tag ?? "", /^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/);
  const pkg = JSON.parse(await readFile(path.join(root, "sidecars/agent/package.json"), "utf8"));
  assert.equal(tag, `v${pkg.version}`, "Release notes tag must match the Sidecar version");
  const previousTag = execFileSync("git", ["describe", "--tags", "--abbrev=0", "--match", "v*", "--exclude", tag, "HEAD"], { cwd: root, encoding: "utf8" }).trim();
  const notes = validateReleaseNotes(await readFile(path.join(root, ".github/release-notes", `${tag}.md`), "utf8"), tag, previousTag);
  if (mode === "--check") return;
  await mkdir(path.join(root, "release"), { recursive: true });
  await writeFile(path.join(root, "release/release-notes.md"), appendSigningDisclosure(notes, mode), "utf8");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
