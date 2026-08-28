## 简体中文

### Esse 1.1.0-beta.5

- 兔子 Provider 带参考图时改用官方异步 `images/edits` multipart 接口；纯文字生图继续使用 `images/generations`，减少 TU4 参考图提交阶段长时间无响应。
- 继续保留上游 taskId、状态轮询和 15 分钟总期限；提交超时仍标记为扣费状态未知，不会盲目重试。
- Windows 安装包未做发布者签名；macOS arm64 应用使用经过结构校验的 ad-hoc 签名，但未做 Developer ID 签名或 Apple 公证，二者均不建立发布者身份。

[查看 v1.1.0-beta.4...v1.1.0-beta.5 完整变更](../../compare/v1.1.0-beta.4...v1.1.0-beta.5)

## English

### Esse 1.1.0-beta.5

- Tuzi Provider requests with reference images now use the official asynchronous `images/edits` multipart endpoint; text-only generation remains on `images/generations`, reducing long stalls before a task ID is returned for TU4 reference jobs.
- The persisted upstream task ID, status polling, and 15-minute overall deadline remain in place; submit timeouts stay marked as charge state unknown and are not blindly retried.
- Windows installers are not publisher-signed. The macOS arm64 app uses a structurally verified ad-hoc signature without Developer ID signing or Apple notarization; neither mode establishes publisher identity.

[View the full v1.1.0-beta.4...v1.1.0-beta.5 changelog](../../compare/v1.1.0-beta.4...v1.1.0-beta.5)
