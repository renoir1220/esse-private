# Esse

> Esse 的私有下游仓库。公开社区上游与私有代码边界、独立版本规则见 [`PRIVATE-DOWNSTREAM.md`](PRIVATE-DOWNSTREAM.md)。Esse 桌面应用从 `1.0.0` 起版，不跟随 Esse Community 版本号。

**语言：简体中文 | [English](README.en.md)**

Esse 是面向 WorkBuddy 等 Agent 的私有本地图片工作台；用户只需要说“用 Esse 生成图片”。公开 Codex Plugin 由上游独立发布并显示为 `Esse Community`，私有 Agent Sidecar 显示为 `Esse`。

Esse 在本机保存 Provider 配置、API Key、批次记录和原始图片。只有实际生图或改图请求会把选中的参考图发给用户配置的 Provider或当前 Agent 的图片能力。仓库和发行包不内置 API Key，也不依赖 Esse 云端后端。

## 两种发行形态

- **Esse Community Codex Plugin**：由公开上游发布，适用于 Codex/ChatGPT 桌面端，支持 Windows x64、macOS arm64 和 macOS x64。
- **Agent Sidecar**：适用于 WorkBuddy 等支持本地 HTTP MCP 的 Agent；支持 Windows x64 和 Apple Silicon macOS（arm64），带完整 Esse 工作台和后台任务执行能力，不再发布 Intel Mac 安装包。

两个仓库共享开源行为，但发行与版本线独立。通常只安装适合当前 Agent 的一种。

## 安装 Codex Plugin

把下面这句话发给 Codex：

> 安装这个插件：https://github.com/renoir1220/esse

Codex 应先阅读公开上游的 [`INSTALL.md`](https://github.com/renoir1220/esse/blob/main/INSTALL.md)，再识别平台、下载 Esse Community Release、校验 SHA256、完成用户目录安装和插件注册。重启桌面端并开启新任务后，说“打开 Esse Community 设置”，在设置界面配置 Provider、API Key 和默认模型。不要把 API Key 发到聊天里。

也可以从 [GitHub Releases](https://github.com/renoir1220/esse/releases) 下载对应平台的 Plugin ZIP，解压后运行 `install.ps1` 或 `install.sh`。

## 安装到 WorkBuddy 等 Agent

从本仓库的私有 Releases 下载与当前平台匹配的 `esse-windows-x64-*.exe` 或 `esse-macos-*-*.dmg`，校验后安装并打开 Esse。在 Esse 的设置页：

1. 在首次引导中填写 Esse Key，并等待连接测试通过。
2. 选择默认模型；高级用户也可以在“高级配置”中编辑预置兔子 Provider、禁用或新增模型，或添加其他兼容 Provider。
3. 复制 Agent 配置提示词，粘贴到 WorkBuddy 或其他 Agent 后直接发送。

之后直接对 Agent 说“用 Esse 生成图片”。Agent 把任务交给 Esse 后应立即返回；除非用户明确要求查看或导出结果，否则不应把产物复制回聊天工作区，也不应反复播报价格和进度。

## 本地数据

- Esse Community Codex Plugin：Windows `%LOCALAPPDATA%\esse`；macOS `~/Library/Application Support/esse`
- Agent Sidecar：Windows `%LOCALAPPDATA%\esse-agent-sidecar`；macOS `~/Library/Application Support/esse-agent-sidecar`

两个目录刻意隔离，Sidecar 安装程序目录也不与任何数据目录重名。迁移仓库不会移动、覆盖或删除旧 `esse-desktop` 数据。Windows API Key 由当前用户 DPAPI 保护；macOS 使用系统 Keychain。

## 代码签名

私有 Agent Sidecar 的正式产物遵循独立的[私有发行签名策略](PRIVATE-CODE-SIGNING.md)；公开 Community 的 SignPath 策略不覆盖专有源码。当前发布者签名凭据未就绪时，CI 会明确验证 Windows 产物未签名、macOS 应用具有结构有效的 ad-hoc 签名，并在 Release 说明中披露两者均不代表发布者身份。某个平台的凭据一旦完整配置，工作流会自动恢复并强制执行 Windows Authenticode 或 macOS Developer ID、公证、Gatekeeper 与票据装订验证；只配置部分凭据会阻断发布。不得把校验哈希或 ad-hoc 签名等同于发布者签名，也不得要求用户关闭系统安全机制。

## 仓库结构

```text
plugins/codex/       Codex Plugin
sidecars/agent/      面向本地 Agent 的 Sidecar
apps/standalone/     未来独立应用占位
docs/                路线图、协议和开发文档
```

暂时不抽取共享 Core。两个运行形态必须独立构建，不得相互产生运行时依赖；有意义的行为移植记录在 [`SYNC.md`](SYNC.md)。

## 开发

Codex Plugin：

```bash
cd plugins/codex
npm install
npm run check
```

Agent Sidecar（私有版发布 Windows x64 和 macOS arm64，使用同一份核心代码）：

```bash
cd sidecars/agent
npm install
npm run typecheck
npm test
npm run make
```

公开上游文件继续适用 [`LICENSE`](LICENSE) 中的 MIT License；私有专有改动适用 [`LICENSE-PROPRIETARY`](LICENSE-PROPRIETARY)，不得公开分发。
