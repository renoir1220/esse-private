# Esse Private Self-hosted Runners

This repository prefers repository-scoped self-hosted runners for ordinary CI
and uses GitHub-hosted runners only when a required machine is offline or when
the workflow is explicitly forced to hosted mode.

## Runner inventory

| Target | Required custom label | Preferred host |
| --- | --- | --- |
| Windows x64 | `esse-private-windows-x64` | Windows 10/11 x64 |
| macOS ARM64 | `esse-private-macos-arm64` | Apple Silicon on macOS 15 or later |

Keep the default `self-hosted`, operating-system, and architecture labels. Add
the common custom label `esse-private` and the target-specific label above.
Register each runner against `renoir1220/esse-private`, not at organization
scope.

The CI router uses a small GitHub-hosted job and the workflow `GITHUB_TOKEN` to
read repository runner status. An online runner is selected even when it is
busy, so jobs queue on owned hardware instead of consuming hosted minutes. If
no matching runner is online, CI selects `windows-latest` or `macos-15`.
Explicit `runner_mode=self` dispatches route on the Windows runner as well,
which allows owned-hardware validation while hosted Actions billing is
temporarily unavailable.

## Security boundary

- Run the listener under a dedicated standard user with no administrator
  rights.
- Do not store provider credentials, signing material, SSH keys, browser
  sessions, or personal files in that account.
- Keep the runner root and `_work` readable only by the runner user, the local
  system, and local administrators.
- Do not reuse a developer checkout as `_work`. `actions/checkout` owns the
  runner worktree and may clean it.
- Do not expose these runners to public repositories or untrusted fork pull
  requests.
- PR jobs receive no release-signing secrets. Signing and notarization remain
  release-only concerns.
- Leave automatic runner updates enabled. GitHub may stop assigning jobs to a
  runner that is too far behind.

Self-hosted jobs execute repository code with all permissions of the runner
user. The dedicated account and directory are the primary isolation boundary.

## Installed Windows runner

The maintainer Windows machine currently uses:

- Runner name: `esse-private-windows-x64-renoi`
- Runner version: `2.336.0`
- Root: `E:\github-runners\esse-private-windows-x64`
- Work directory: `E:\github-runners\esse-private-windows-x64\_work`
- Labels: `self-hosted`, `Windows`, `X64`, `esse-private`,
  `esse-private-windows-x64`
- Startup entry:
  `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\Esse Private GitHub Runner.lnk`

The runner is launched under the current standard user instead of being
installed as an elevated Windows service. It is therefore online after that
user signs in. Its registration credentials and worktree remain on drive E.

Repository administrators can check the registered state without printing
credentials:

```powershell
gh api repos/renoir1220/esse-private/actions/runners `
  --jq '.runners[] | {name,status,busy,labels:[.labels[].name]}'
```

## Apple Silicon Mac requirements

Use an M1 or newer Mac. The practical minimum is 8 GB memory and 30 GB free
SSD space; 16 GB memory is preferred. Install:

- current macOS 15 or later updates;
- Xcode Command Line Tools;
- Git;
- GitHub CLI authenticated as a repository administrator.

Node and Bun are provisioned by pinned GitHub Actions during jobs. Avoid a
machine-wide Node replacement merely for the runner.

Use a dedicated standard macOS account when practical. The recommended layout
inside that account is:

```text
~/github-runners/esse-private-macos-arm64
~/github-runners/esse-private-macos-arm64/_work
```

If a separate development checkout is synchronized to the Mac, keep it outside
this directory.

### Mac installation contract for Codex

Codex configuring the Mac must:

1. Read `AGENTS.md` and this file completely.
2. Confirm `uname -m` is `arm64`, the OS is macOS, and at least 30 GB is free.
3. Query the latest release of `actions/runner`, select the
   `actions-runner-osx-arm64-<version>.tar.gz` asset, and verify its SHA256
   against the asset `digest` returned by the GitHub Releases API.
4. Extract only into
   `~/github-runners/esse-private-macos-arm64`.
5. Obtain a short-lived repository registration token through `gh api` without
   printing or persisting it.
6. Configure the runner unattended with:
   - repository `https://github.com/renoir1220/esse-private`;
   - name `esse-private-macos-arm64-<hostname>`;
   - labels `esse-private,esse-private-macos-arm64`;
   - work directory `_work`;
   - automatic runner updates enabled.
7. Restrict the runner directory with `chmod -R go-rwx`.
8. Install and start the provided user-level `launchd` service with `svc.sh`.
   Do not run the listener as root.
9. Confirm through the repository API that the runner is `online`, has the
   default `self-hosted`, `macOS`, and `ARM64` labels plus both custom labels,
   and is not unexpectedly busy.
10. Dispatch CI on the current task branch with `runner_mode=self` and
    `run_macos=true`, wait for `Verify macOS ARM64`, and report the workflow URL
    and terminal result.

The registration token must stay in process memory only. Do not paste it into
chat, save it in the repository, write it to a shell-history file, or include
it in the final report.

### Prompt to hand to Codex on the Mac

```text
请在这个仓库中完整阅读 AGENTS.md 和 SELF-HOSTED-RUNNERS.md。按文档把这台
Apple Silicon Mac 配置为 renoir1220/esse-private 的仓库级 Self-hosted
Runner。Runner 根目录放在
~/github-runners/esse-private-macos-arm64，使用标签
esse-private 和 esse-private-macos-arm64，以当前低权限用户的 launchd
服务运行。注册令牌只允许在进程内临时使用，不得输出、写入文件或回复给我。
完成后通过仓库 API 验证在线状态，并在当前任务分支触发 runner_mode=self、
run_macos=true 的 CI，等待 macOS ARM64 检查结束后给我 workflow 链接和结果。
```

## Manual routing and recovery

CI normally uses `runner_mode=auto`. Maintainers can explicitly test owned
hardware:

```powershell
gh workflow run ci.yml --repo renoir1220/esse-private `
  --ref <branch> `
  -f runner_mode=self `
  -f run_macos=true
```

Use `runner_mode=hosted` to bypass both owned runners. When manually testing
Windows before the Mac is registered, set `run_macos=false`.

GitHub evaluates the runner status before target jobs are queued. A runner that
disconnects after routing can still leave a job queued. In that rare case,
cancel the run and dispatch it again with `runner_mode=hosted`.

Automatic fallback requires GitHub to start the small routing job. If Actions
is blocked at the account level by a payment failure or spending limit, use
explicit `runner_mode=self` until billing is restored; GitHub-hosted fallback
cannot start while GitHub itself rejects hosted jobs.
