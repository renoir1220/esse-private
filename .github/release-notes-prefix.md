## 简体中文

### Esse 1.0.2

- Windows 与 macOS 的图片服务请求改用独立的 Chromium 网络会话，更一致地跟随系统代理、DNS 和网络切换状态。
- 网络故障仍不会自动重试，避免扣费状态不明时产生重复调用；在并发请求全部结束后，Esse 会刷新连接池、DNS 和代理配置，让用户下一次明确提交通常无需重启应用。
- 网络错误现在显示 `ETIMEDOUT`、`ERR_NETWORK_CHANGED` 等脱敏诊断码，不暴露 API 地址、Key 或原始错误内容，便于判断本机网络、代理、DNS 与服务端响应问题。
- 修复 Windows 原生标题栏预留高度导致的空白纵向滚动条；窗口左上角现在显示准确版本，例如 `Esse 1.0.2`。
- 本版本 Windows 与 macOS 安装包未进行发布者签名或 Apple 公证；Release 同时提供 SHA256 校验值。Windows 可能显示未知发布者提示，macOS Gatekeeper 可能拒绝打开；请勿关闭系统安全机制。

[查看 v1.0.1...v1.0.2 完整变更](../../compare/v1.0.1...v1.0.2)

## English

### Esse 1.0.2

- Routes Windows and macOS image-service requests through an isolated Chromium network session so system proxy, DNS, and network changes are handled consistently.
- A transport failure is still never retried automatically when the charge state may be unknown. After concurrent requests settle, Esse refreshes pooled connections, DNS, and proxy state so the next explicit submission normally does not require an app restart.
- Network failures now expose safe diagnostic codes such as `ETIMEDOUT` and `ERR_NETWORK_CHANGED` without revealing API URLs, keys, or raw error content, making local network, proxy, DNS, and service-response issues easier to distinguish.
- Fixes the empty vertical scrollbar caused by reserved native-titlebar height on Windows. The upper-left window title now includes the exact version, for example `Esse 1.0.2`.
- Windows and macOS installers in this release are not publisher-signed or Apple-notarized; SHA256 checksums are published alongside them. Windows may show an unknown-publisher warning, and macOS Gatekeeper may reject the app. Do not disable platform security.

[View the full v1.0.1...v1.0.2 changelog](../../compare/v1.0.1...v1.0.2)
