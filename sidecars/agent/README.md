# Esse Agent Sidecar

This private Esse downstream starts at version `1.0.0` and does not inherit the Community release number. Shared behavior is merged from the public upstream; managed onboarding and service integration remain private.

This directory contains the Agent Sidecar distribution of Esse. “Agent Sidecar” is a technical packaging term; the installed application, window, MCP server, skills, and user-facing documentation all call the product **Esse**.

It runs a local Electron workspace and authenticated loopback HTTP MCP for WorkBuddy and other compatible Agents. It has no hosted Esse backend. The ordinary setup path accepts only an Esse Key; connection details stay internal, custom Provider profiles remain available under Advanced settings, and every key is protected by the operating system.

## Shared implementation

Windows and macOS use the same TypeScript/Electron core for Provider settings, secure credentials, batches, image storage, the UI, and loopback MCP. `src/platform.ts`, native packaging, signing, window chrome, and application lifecycle contain the operating-system adaptations; do not fork the product core into a macOS copy.

## Development on Windows

```powershell
npm install
npm run typecheck
npm test
npm run make
npm run verify:icons:windows
```

Builds without signing environment variables emit an unsigned installer under `out/make/squirrel.windows/x64/Esse-Setup.exe`. A release with both Windows signing secrets configured must pass `npm run verify:signatures`; a release with neither secret configured verifies and publishes explicitly disclosed unsigned artifacts. Supplying only one secret fails the release.

The Squirrel application ID is `esse-agent-sidecar-app`, which is intentionally different from both the Codex Plugin data root and `%LOCALAPPDATA%\esse-agent-sidecar` runtime data root. Never change it back to `esse` or to a data-directory name.

## Development on macOS

Run on the target architecture (`arm64` or `x64`):

```bash
npm install
npm run typecheck
npm test
arch="$(uname -m | sed 's/x86_64/x64/')"
npm run "make:macos:$arch"
bash scripts/verify-macos-bundle.sh "$arch"
```

When the complete macOS signing and notarization credential set is configured, a GitHub Release build must pass strict Developer ID signature, Gatekeeper, notarization-ticket, icon, architecture, and packaged-app smoke checks. When none is configured, the release runs all non-signing checks and publishes explicitly disclosed unsigned artifacts; a partial credential set fails the release. User data is stored in `~/Library/Application Support/esse-agent-sidecar`; API keys and the MCP pairing token use Electron `safeStorage` backed by macOS Keychain.

Use `npm start` only for development debugging. Do not commit `out/`, `.vite/`, `node_modules/`, local Provider settings, credentials, inputs, outputs, or QA captures.
