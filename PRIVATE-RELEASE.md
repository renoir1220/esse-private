# Private release workflow

The private Agent Sidecar release pipeline separates expensive package construction from publication.

## Pull requests

- Every pull request runs inheritance checks, type checks, linting, unit tests, and a fake-asset release rehearsal.
- Product code, dependencies, installers, signing configuration, the build workflow, and unknown paths require complete Windows x64 and macOS arm64 package verification.
- Documentation, release notes, publish-only automation, metadata helpers, and their policy tests use the fast tier.
- A complete pull-request run records its exact Git tree. The main-branch run may reuse that result only when the merged tree is byte-for-byte identical and the successful pull request came from this repository. Otherwise it fails closed and repeats complete verification.

## Tag build

Pushing a version tag starts **Esse release build**. Each platform builds once, verifies its signing mode, and uploads an artifact plus provenance binding the asset hash to the tag and commit.

The successful build automatically starts **Esse release publish**. Publication checks the current tag, build commit, artifact provenance, filenames, sizes, and SHA256 values before creating a draft Release and making it public.

## Retry a publication failure

Do not rerun the build or move the tag when only publication fails.

1. Open **Esse release publish** in GitHub Actions and choose **Run workflow**.
2. Enter the successful **Esse release build** run ID and the unchanged version tag.
3. Keep the self-hosted publisher unless it is unavailable and a hosted fallback is intentionally selected.

The retry downloads only artifacts from that successful build run. Existing Release assets are downloaded and compared with those immutable artifacts; mismatches and unexpected files stop publication. A partially uploaded draft can therefore be resumed safely without rebuilding either installer.

Run a new build only when package construction or package verification failed, the artifact retention period expired, or the product commit/tag must genuinely change.
