# Historical self-hosted runners

This repository's CI and Release workflows now use standard GitHub-hosted runners only: `ubuntu-24.04` for policy/publication and `macos-15` for Apple Silicon verification/packaging. Do not reintroduce the old private-runner labels into workflows for this public repository. See `PRIVATE-RELEASE.md`.

The former Windows and macOS runners were configured while the downstream was private. Migrating the workflow does not unregister them, stop their processes, revoke their registration or change GitHub's fork-approval settings. Those are separate administrator actions and were not performed by this PR. Until this PR is merged, the default branch still contains the old routing; older workflow revisions may also reference it. Review and retire the old registrations separately.

Do not publish runner credentials, personal machine paths, provider keys or signing material. New maintenance tasks do not require starting a local runner or building on the maintainer's workstation.
