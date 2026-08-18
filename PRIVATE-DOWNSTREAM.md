# Esse private downstream

This repository is the private downstream of [renoir1220/esse](https://github.com/renoir1220/esse).

The upstream MIT-licensed files retain their upstream license. Private-only onboarding, managed connection behavior, product configuration, release automation, and later paid-service code are confidential and covered by `LICENSE-PROPRIETARY`.

The desktop product is named **Esse**. Its version is independent from Esse Community and starts at `1.0.0`; do not copy the version from the upstream Plugin or Community Sidecar. `sidecars/agent/product.json` is the private product overlay and keeps an independent release line while preserving the existing Esse app data identity.

To reuse Community work, fetch and merge the public upstream, then keep private-only conflict resolution inside the paths declared by `private-overlay.json`:

```bash
git fetch upstream
git merge upstream/main
node scripts/verify-private-overlay.mjs upstream/main
cd sidecars/agent
npm ci
npm run typecheck
npm test
```

Any pull request that carries an `upstream/main` merge must itself be merged with GitHub's **Create a merge commit** strategy. Squash or rebase merging discards the upstream parent relationship even when the resulting files look identical, and will make `verify-private-overlay.mjs` fail on `main`.

The verifier requires the current `upstream/main` to be an ancestor of the private commit and rejects every changed path outside the reviewed overlay. A shared change must therefore land in Community first; adding a new overlay path is an architecture decision, not a conflict-resolution shortcut.

Private runtime and onboarding fields extend the Community `DesktopState` through `ManagedDesktopState`. Do not add edition-only required fields to the shared base state: Community state reducers and tests must remain valid on their own, while generic shared reducers preserve downstream extensions.

Never push private commits to `upstream`. Configure a separate private `origin` before publishing this repository.
