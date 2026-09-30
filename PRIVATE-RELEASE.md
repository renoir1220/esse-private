# Esse macOS release workflow

This publicly visible downstream keeps the independent Esse Sidecar version line. Repository visibility does not change the MIT/proprietary license boundary in `PRIVATE-DOWNSTREAM.md`. Shared application behavior still lands in Community first.

## CI and resource use

- PRs and pushes to `main` run inheritance and release-policy checks on standard `ubuntu-24.04`. Feature-branch pushes alone do not start another CI run; open a PR instead.
- Documentation, versioned notes, release metadata helpers and policy tests use the fast tier without dependency installation or application packaging. Product code, dependencies, workflows, installers and unknown paths require full verification.
- Full CI uses one standard `macos-15` Apple Silicon runner. It checks the inherited Plugin source and the Sidecar, runs thumbnail stress E2E, packages only the macOS ARM64 Sidecar, and verifies its structure, signature and isolated packaged-app smoke test. It does not package or publish the separately released Community Plugin.
- npm download caches are keyed by both lockfiles on CI and by the Sidecar lockfile on release. No credentials, user data, compiled applications or `node_modules` are cached.
- New commits cancel obsolete runs for the same PR/ref. Policy, verification and release jobs have bounded timeouts. A main push can skip duplicate packaging only after finding a successful same-repository PR run for exactly the same Git tree in the new macOS-only receipt namespace. Missing/expired receipts repeat verification; old Windows-era receipts are not accepted.
- CI uploads only a tiny verification receipt for one day. Release handoff uploads only the DMG and provenance for one day, uncompressed. No permanent CI installer archives are retained.
- Standard hosted runners are free for public repositories under GitHub's current policy; storage, account settings and any larger-runner usage are separate considerations. This workflow never selects a larger runner or an owned runner.

## Preparing a release

1. Update the independent Sidecar package version and lockfile as a reviewed change.
2. Add `.github/release-notes/<tag>.md` and its exact path to the governance group in `private-overlay.json`. Follow `.github/release-notes/README.md`: Simplified Chinese first, English second, exact version headings and an absolute previous-tag comparison link at the end of each section. Derive changes from Git history; do not copy the prior release's notes or handwritten signing claims.
3. Merge the reviewed PR only after full macOS CI. Tagging and publication are separate authorized actions; this migration does not create a tag or Release.
4. Pushing an approved `v*` tag (or dispatching the existing tag) starts `Esse release`. It verifies the package version, main ancestry and exact version-specific notes before building.

## Release and signing

The release job builds macOS ARM64 once on `macos-15`; Windows and Intel Mac artifacts are no longer produced. Existing releases remain available unchanged. All six Apple signing/notarization secrets must be present together, or all absent:

- `MACOS_CERTIFICATE_P12_BASE64`
- `MACOS_CERTIFICATE_PASSWORD`
- `MACOS_NOTARY_API_KEY_BASE64`
- `MACOS_NOTARY_API_KEY_ID`
- `MACOS_NOTARY_API_ISSUER_ID`
- `MACOS_SIGN_IDENTITY`

A partial set fails. A complete set requires Developer ID, Gatekeeper and notarization-ticket validation. An absent set produces a structurally verified ad-hoc signed app, without publisher identity or Apple notarization; Gatekeeper may block it. CI does not create Apple credentials or bypass platform security. Temporary signing material is removed at job end. Ordinary PR CI receives no signing secrets.

A separate Ubuntu publish job alone gets `contents: write`. It downloads the exact same-run artifact name, verifies tag/commit/filename/size/SHA256 provenance, creates `sidecar-latest.json` and checksums, appends the verified signing mode to both note languages, and creates one GitHub Release. It refuses to overwrite an existing Release and never moves tags or reuses another run's installers.

## Updates and handoff

`sidecar-latest.json` retains schema version 1 and `macosArm64Asset`/`macosArm64Sha256`. New releases omit Windows fields. The Sidecar has no automatic updater/feed in its current source: download the requested Release's DMG and matching metadata using `INSTALL.md`. GitHub's latest stable Release excludes prereleases; a beta must be selected by explicit tag. The Community Plugin's `latest.json` and update checker still point to `renoir1220/esse` and are unchanged.

A successful GitHub build is not a physical-device installation acceptance. Verify the new DMG through the documented user flow on an authorized Apple Silicon Mac before calling a release fully handed off. There is no Windows user-path acceptance for new Mac-only releases.

## Failure behavior

No automatic network retries, Release overwrite, moved tag or cross-run artifact recovery. Re-run failed jobs only after checking no Release was created. If publication created an incomplete Release, report it and obtain an explicit cleanup decision before removal. Rebuild if the package job failed, its one-day handoff expired, or code changed.
