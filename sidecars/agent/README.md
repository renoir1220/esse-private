# Esse Agent Sidecar

This private Esse downstream starts at version `1.0.0` and does not inherit the Community release number. Shared behavior is merged from the public upstream; managed onboarding and service integration remain private.

This directory contains the Agent Sidecar distribution of Esse. “Agent Sidecar” is a technical packaging term; the installed application, window, MCP server, skills, and user-facing documentation all call the product **Esse**.

It runs a local Electron workspace and authenticated loopback HTTP MCP for WorkBuddy and other compatible Agents. It has no hosted Esse backend. The managed-service setup path accepts an Esse Key. To use your own Google API key, open Advanced settings → Provider → Add → Google Gemini · Official and save the key; no Esse Key is required. The preconfigured Tuzi connection and custom Provider profiles remain editable together under Advanced settings, and every key is protected by the operating system.

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

Builds without Developer ID credentials are fully ad-hoc signed after Electron fuses and bundle metadata are finalized, then must pass strict structural signature, icon, arm64 architecture, and packaged-app smoke checks. This prevents a corrupted temporary fuse signature from reaching users, but it is not publisher identity or Apple notarization and cannot provide a stable identity across versions. A trusted GitHub Release build must configure the complete private macOS signing and notarization credential set and additionally pass Gatekeeper and notarization-ticket checks; partial configuration fails. User data is stored in `~/Library/Application Support/esse-agent-sidecar`; API keys and the MCP pairing token use Electron `safeStorage` backed by macOS Keychain.

Use `npm start` only for development debugging. Do not commit `out/`, `.vite/`, `node_modules/`, local Provider settings, credentials, inputs, outputs, or QA captures.
