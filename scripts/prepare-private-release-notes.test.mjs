import assert from "node:assert/strict";
import test from "node:test";
import { validateReleaseNotes, appendSigningDisclosure } from "./prepare-private-release-notes.mjs";
const tag = "v1.1.0-beta.7";
const previous = "v1.1.0-beta.6";
const link = `https://github.com/renoir1220/esse-private/compare/${previous}...${tag}`;
const notes = `## 简体中文\n\n### Esse 1.1.0-beta.7\n\n- 在 GitHub 构建 macOS ARM64。\n\n[完整变更](${link})\n\n## English\n\n### Esse 1.1.0-beta.7\n\n- Build macOS ARM64 on GitHub.\n\n[Full changelog](${link})\n`.replaceAll("\n", "\n");

test("rejects reused version notes, wrong comparisons and missing language", () => {
  assert.equal(validateReleaseNotes(notes, tag, previous), notes.trim());
  assert.throws(() => validateReleaseNotes(notes.replaceAll("### Esse 1.1.0-beta.7", "### Esse 1.1.0-beta.5"), tag, previous));
  assert.throws(() => validateReleaseNotes(notes.replaceAll(link, "../../compare/old...new"), tag, previous));
  assert.throws(() => validateReleaseNotes(notes.split("## English")[0], tag, previous));
});

test("signing disclosure follows actual verification and preserves final comparison links", () => {
  const unsigned = appendSigningDisclosure(notes, "false");
  assert.match(unsigned, /未做 Developer ID/);
  assert.match(unsigned, /without Developer ID/);
  for (const part of unsigned.split("## English")) assert(part.trim().endsWith(`](${link})`));
  assert.match(appendSigningDisclosure(notes, "true"), /passed Developer ID/);
  assert.throws(() => appendSigningDisclosure(notes, ""));
});
