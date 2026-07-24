## 简体中文

### Esse 1.0.4

- 修复 1.0.3 macOS 应用包的结构签名损坏问题。该问题可能导致 macOS 钥匙串拒绝 Esse 读取原有本地凭据，进而使 MCP 服务无法启动；无 Developer ID 凭据时，构建现在会完整执行 ad-hoc 签名并通过严格结构校验。
- 图片生成请求的等待上限从 5 分钟延长到 15 分钟，避免 Nano Banana 等耗时模型在仍有可能正常返回时被客户端提前中断。请求在没有收到 HTTP 响应时不会自动重试，扣费状态仍会保留为待复核。
- 错误归因现在明确区分上游服务返回的错误、未收到 HTTP 响应的请求链路问题和 Esse 本地错误，便于判断应检查服务端、网络链路还是本机；私有版继续隐藏上游服务商名称。
- 整合桌面端交互样式优化，统一批次标题栏、复制与更多菜单控件的聚焦和悬停反馈。
- 本版本替代存在上述 macOS 阻断问题的 1.0.3。Windows 安装包仍未做发布者签名；macOS arm64 应用已通过结构有效的 ad-hoc 签名校验，但未做 Developer ID 签名或 Apple 公证，二者均不建立发布者身份。

[查看 v1.0.3...v1.0.4 完整变更](../../compare/v1.0.3...v1.0.4)

## English

### Esse 1.0.4

- Fixes the structurally invalid signature in the 1.0.3 macOS application bundle. That issue could make macOS Keychain reject access to existing local Esse credentials and prevent the MCP service from starting. Builds without Developer ID credentials now receive a complete ad-hoc signature and pass strict structural verification.
- Extends the image-generation request timeout from 5 to 15 minutes so slower models such as Nano Banana are not interrupted by the client while they may still complete normally. Requests that never receive an HTTP response are not retried automatically, and their charge state remains pending review.
- Clearly separates errors returned by the upstream service, request-path failures with no HTTP response, and local Esse errors. This helps identify whether to inspect the service, network path, or local application while the private edition continues to hide upstream provider names.
- Integrates desktop interaction polish with consistent focus and hover feedback for the batch title bar, copy control, and overflow menus.
- This release supersedes 1.0.3 because of the macOS blocking issue above. Windows artifacts remain unsigned by a publisher. The macOS arm64 app passes structurally valid ad-hoc signature verification but is not Developer ID-signed or Apple-notarized; neither platform mode establishes publisher identity.

[View the full v1.0.3...v1.0.4 changelog](../../compare/v1.0.3...v1.0.4)
