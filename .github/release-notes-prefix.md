## 简体中文

### Esse 1.1.0-beta.3

- 兔子图片生成改用异步任务接口：提交成功后保存上游 task ID，并用独立的短查询获取 `queued`、`in_progress`、`completed`、失败或过期状态；15 分钟仅作为任务总期限，不再由单个生成长连接占满。
- 任务卡片和详情现在区分参考图读取/提交、上游排队、正式生成和结果保存，并显示上游返回的真实进度、排队耗时、生成耗时、Task ID 与 Request ID。
- Esse 重启后会通过原 task ID 恢复已被上游接受的任务，包括“上游已完成、但结果尚未保存到本地”的短暂窗口；恢复过程不会再次提交生成请求。
- 上游明确返回失败或过期时会在下一次状态查询后结束任务。状态查询的临时网络错误、限流或过载响应只会重查原 task ID，不会创建新任务；总期限后仍无法确认的结果继续标记为扣费状态未知，避免不安全的自动重试。
- Windows 安装包未做发布者签名；macOS arm64 应用使用经过结构校验的 ad-hoc 签名，但未做 Developer ID 签名或 Apple 公证，二者均不建立发布者身份。

[查看 v1.1.0-beta.2...v1.1.0-beta.3 完整变更](../../compare/v1.1.0-beta.2...v1.1.0-beta.3)

## English

### Esse 1.1.0-beta.3

- Tuzi image generation now uses the asynchronous task API. Esse persists the upstream task ID after acceptance and performs independent bounded queries for queued, in-progress, completed, failed, or expired states; the 15-minute limit is now the overall task deadline rather than one long generation connection.
- Task cards and details distinguish reference preparation or submission, upstream queueing, formal generation, and result saving. They show real upstream progress, queue duration, generation duration, Task ID, and Request ID.
- After Esse restarts, accepted work resumes through the original task ID, including the narrow window where the upstream task completed before its result was saved locally. Recovery never submits another generation request.
- Provider-declared failure or expiry ends the task after the next status query. Temporary query transport failures, rate limits, and overload responses recheck the same task ID without creating a new task; an unresolved overall deadline remains an unknown-charge outcome and is not retried automatically.
- Windows installers are not publisher-signed. The macOS arm64 app uses a structurally verified ad-hoc signature without Developer ID signing or Apple notarization; neither mode establishes publisher identity.

[View the full v1.1.0-beta.2...v1.1.0-beta.3 changelog](../../compare/v1.1.0-beta.2...v1.1.0-beta.3)
