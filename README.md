# Esse

> Esse 的私有下游仓库。公开社区上游与私有代码边界、独立版本规则见 [`PRIVATE-DOWNSTREAM.md`](PRIVATE-DOWNSTREAM.md)。Esse 桌面应用从 `1.0.0` 起版，不跟随 Esse Community 版本号。

**语言：简体中文 | [English](README.en.md)**

Esse 是由 Agent 指挥的本地图片工作台。用户只需要说“用 Esse 生成图片”；无论安装的是 Codex Plugin 还是面向 WorkBuddy 等 Agent 的本地客户端，产品名称始终是 Esse。

Esse 在本机保存 Provider 配置、API Key、批次记录和原始图片。只有实际生图或改图请求会把选中的参考图发给用户配置的 Provider或当前 Agent 的图片能力。仓库和发行包不内置 API Key，也不依赖 Esse 云端后端。

## 两种发行形态

- **Codex Plugin**：适用于 Codex/ChatGPT 桌面端，支持 Windows x64、macOS arm64 和 macOS x64。
- **Agent Sidecar**：适用于 WorkBuddy 等支持本地 HTTP MCP 的 Agent；支持 Windows x64、macOS arm64 和 macOS x64，带完整 Esse 工作台和后台任务执行能力。

这是同一个产品的两种技术分发方式，不是两个用户品牌。通常只安装适合当前 Agent 的一种。

## 安装 Codex Plugin

把下面这句话发给 Codex：

> 安装这个插件：https://github.com/renoir1220/esse

Codex 应先阅读 [`INSTALL.md`](INSTALL.md)，再识别平台、下载 Release、校验 SHA256、完成用户目录安装和插件注册。重启桌面端并开启新任务后，说“打开 Esse 设置”，在 Esse 里配置 Provider、API Key 和默认模型。不要把 API Key 发到聊天里。

也可以从 [GitHub Releases](https://github.com/renoir1220/esse/releases) 下载对应平台的 Plugin ZIP，解压后运行 `install.ps1` 或 `install.sh`。

## 安装到 WorkBuddy 等 Agent

从本仓库的私有 Releases 下载与当前平台匹配的 `esse-windows-x64-*.exe` 或 `esse-macos-*-*.dmg`，校验后安装并打开 Esse。在 Esse 的设置页：

1. 在首次引导中填写 Esse Key，并等待连接测试通过。
2. 选择默认模型；高级用户也可以在“高级配置”中添加兼容 Provider。
3. 复制 Agent 配置提示词，粘贴到 WorkBuddy 或其他 Agent 后直接发送。

之后直接对 Agent 说“用 Esse 生成图片”。Agent 把任务交给 Esse 后应立即返回；除非用户明确要求查看或导出结果，否则不应把产物复制回聊天工作区，也不应反复播报价格和进度。

## 本地数据

- Codex Plugin：Windows `%LOCALAPPDATA%\esse`；macOS `~/Library/Application Support/esse`
- Agent Sidecar：Windows `%LOCALAPPDATA%\esse-agent-sidecar`；macOS `~/Library/Application Support/esse-agent-sidecar`

两个目录刻意隔离，Sidecar 安装程序目录也不与任何数据目录重名。迁移仓库不会移动、覆盖或删除旧 `esse-desktop` 数据。Windows API Key 由当前用户 DPAPI 保护；macOS 使用系统 Keychain。

## 代码签名

Agent Sidecar 的签名发行产物遵循仓库公开的 [Code signing policy](CODE_SIGNING.md)。Windows 正式包验证应用程序和安装程序的 Authenticode 签名；macOS 正式包验证 Developer ID 签名、Apple 公证和票据装订。`v0.3.0-alpha.2` 与 `v0.3.0` 是维护者明确允许的 Windows 未签名例外，后续版本仍受签名门禁保护。

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

Agent Sidecar（Windows x64、macOS arm64/x64 使用同一份核心代码）：

```bash
cd sidecars/agent
npm install
npm run typecheck
npm test
npm run make
```

公开上游文件继续适用 [`LICENSE`](LICENSE) 中的 MIT License；私有专有改动适用 [`LICENSE-PROPRIETARY`](LICENSE-PROPRIETARY)，不得公开分发。
