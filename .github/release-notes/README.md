# Versioned release notes

Before each new tag, add `<tag>.md` here with `## 简体中文` first and `## English` second. Each language must include `### Esse <version>`, user-visible changes based on the previous-tag comparison, and end with the absolute full-changelog URL `https://github.com/renoir1220/esse-private/compare/<previous-tag>...<tag>`.

The release workflow validates the exact version and previous tag before building. It appends the signing status actually verified by that run. Do not copy old version notes or include signing claims in the handwritten changes. There is deliberately no release note for an unapproved future version; a new tag without its reviewed notes fails closed.

The historical `release-notes-prefix.md` is no longer used. Existing GitHub Releases are unchanged by this migration.
