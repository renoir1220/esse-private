# Esse

**Language: [简体中文](README.md) | English**

Esse is the private local image workspace for WorkBuddy and similar Agents; users only need to say “use Esse to generate images.” The public Codex Plugin is released separately upstream as `Esse Community`, while the private Agent Sidecar is displayed as `Esse`.

Provider settings, API keys, batch records, and original images stay on the local computer. Selected references leave the computer only for an actual generation or edit request to the configured Provider or the current Agent image capability. No API key is bundled, and no hosted Esse backend is required.

## Two distributions

- **Esse Community Codex Plugin**, released from the public upstream for the Codex/ChatGPT desktop app on Windows x64, macOS arm64, and macOS x64.
- **Agent Sidecar** for WorkBuddy and other Agents that support a local HTTP MCP. It supports Windows x64 and Apple Silicon macOS (arm64) with the complete Esse workspace and background task execution. Intel Mac installers are no longer published.

The repositories share open-source behavior but have independent distributions and version lines. Most users install only the form that matches their Agent.

## Install the Codex Plugin

Send this to Codex:

> Install this plugin: https://github.com/renoir1220/esse

Codex should read the public upstream [`INSTALL.md`](https://github.com/renoir1220/esse/blob/main/INSTALL.md), detect the platform, download the Esse Community Release, verify SHA256, install it in the user profile, and register the plugin. After restarting the desktop app and opening a new task, say “Open Esse Community settings,” then configure the Provider, API key, and default model in its settings UI. Never paste an API key into chat.

You can also download the matching Plugin ZIP from [GitHub Releases](https://github.com/renoir1220/esse/releases), extract it, and run `install.ps1` or `install.sh`.

## Install for WorkBuddy and other Agents

Download the matching `esse-agent-sidecar-windows-x64-*.exe` or `esse-agent-sidecar-macos-*-*.dmg` from [GitHub Releases](https://github.com/renoir1220/esse/releases), verify it against `sidecar-latest.json` or `checksums.txt`, and open Esse after installation. In Esse settings:

1. Enter an Esse Key in the first-run guide and wait for the connection test to pass.
2. Select a default model; advanced users can edit the preconfigured Tuzi Provider, disable or add models, or add another compatible Provider under Advanced settings.
3. Copy the Agent setup prompt, paste it into WorkBuddy or another Agent, and send it directly.

Then simply tell the Agent to “use Esse to generate images.” Once durable background work is accepted, the Agent should return control immediately. It should not copy outputs back into the chat workspace or narrate prices and progress unless the user explicitly asks.

## Local data

- Esse Community Codex Plugin: `%LOCALAPPDATA%\esse` on Windows; `~/Library/Application Support/esse` on macOS
- Agent Sidecar: `%LOCALAPPDATA%\esse-agent-sidecar` on Windows; `~/Library/Application Support/esse-agent-sidecar` on macOS

The directories are intentionally isolated, and the Sidecar installer never owns a directory used for data. Repository migration does not move, overwrite, or delete legacy `esse-desktop` data. Windows API keys are protected with current-user DPAPI; macOS uses Keychain.

## Code signing

Formal private Agent Sidecar artifacts follow the separate [private release signing policy](PRIVATE-CODE-SIGNING.md); the public Community SignPath policy does not cover proprietary source. While publisher credentials are unavailable, CI explicitly verifies unsigned Windows artifacts and structurally valid ad-hoc macOS app signatures, and the GitHub Release discloses that neither establishes publisher identity. Once a platform's complete credential set is configured, the workflow automatically restores and enforces Windows Authenticode or macOS Developer ID, notarization, Gatekeeper, and stapled-ticket verification; a partial credential set blocks the release. A verified checksum or ad-hoc signature is not a publisher signature, and users must never be asked to disable platform security.

## Repository layout

```text
plugins/codex/       Codex Plugin
sidecars/agent/      Sidecar for local Agents
apps/standalone/     Placeholder for a future standalone app
docs/                Roadmap, contracts, and development documentation
```

A shared Core is intentionally deferred. Each distribution must build and run independently; meaningful behavior ports are recorded in [`SYNC.md`](SYNC.md).

## Development

Codex Plugin:

```bash
cd plugins/codex
npm install
npm run check
```

Agent Sidecar (one shared core released for Windows x64 and macOS arm64):

```bash
cd sidecars/agent
npm install
npm run typecheck
npm test
npm run make
```

Licensed under MIT; see [`LICENSE`](LICENSE).
