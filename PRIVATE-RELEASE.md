# Private release workflow

The private Agent Sidecar uses one release workflow from tag to publication.

## Pull requests

- Every pull request runs inheritance checks, type checks, linting, unit tests, and a fake-asset release rehearsal.
- Product code, dependencies, installers, signing configuration, the build workflow, and unknown paths require complete Windows x64 and macOS arm64 package verification.
- Documentation, release notes, metadata helpers, and their policy tests use the fast tier.
- A complete pull-request run records its exact Git tree. The main-branch run may reuse that result only when the merged tree is byte-for-byte identical and the successful pull request came from this repository. Otherwise it fails closed and repeats complete verification.

## Tag release

Pushing a version tag starts **Esse release** on the owned Windows x64 and macOS arm64 runners. Each platform builds and verifies its installer once, then uploads its installer and provenance for the publish job in that same workflow run.

The publish job verifies the tag, commit, provenance, filenames, sizes, and SHA256 values before creating the GitHub Release exactly once. Only this job receives `contents: write`; build jobs remain read-only. The handoff artifacts expire after one day, while user-facing installers remain attached to the GitHub Release.

## Failure behavior

The workflow does not automatically retry network calls, overwrite an existing Release, move a tag, or recover artifacts from another workflow run. A failed step reports its original error.

Use GitHub's **Re-run failed jobs** only after checking that no Release was created. If GitHub created an incomplete Release before returning an error, inspect and remove that incomplete Release first, then rerun the failed job with the unchanged tag. Rebuild the complete workflow only when a platform build or its verification failed, the one-day handoff expired, or the product commit must genuinely change.
