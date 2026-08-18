## 简体中文

### Esse 1.1.0-beta.1

- 修复大型资料库和批量任务运行期间主进程可能持续高 CPU 的问题。批次和单张图片的变化现在只增量更新对应状态，不再牵动无关批次或反复广播、解析完整资料库。
- 图片资料库只在启动时建立一次内存索引，之后随单张图片的创建和删除增量维护；批次列表改为一次批量查询所需图片，避免重复扫描输出目录和重复解析 `library.json`。
- 调度器按批次公平推进，每轮每个批次只领取一个任务；参考图按顺序编码，避免一次任务瞬间并行解码多张原图。内置服务仍默认并发 10，并按用户设置执行，不会被内部默认值静默压低。
- Provider 或网络请求失败时直接将该任务标记为失败并显示原始错误，不进行隐藏的自动重试或全局网络恢复等待。扣费状态未知的任务仍需用户明确确认后才能手动重试，避免重复扣费。
- 这是面向严重性能问题的测试版本。发布制品仍会从同一个 Git tag 分别在 Windows x64 和 macOS arm64 上完整构建、测试并校验来源；不会复用旧版本安装包。
- Windows 安装包未做发布者签名；macOS arm64 应用使用经过结构校验的 ad-hoc 签名，但未做 Developer ID 签名或 Apple 公证，二者均不建立发布者身份。

[查看 v1.0.5...v1.1.0-beta.1 完整变更](../../compare/v1.0.5...v1.1.0-beta.1)

## English

### Esse 1.1.0-beta.1

- Fixes sustained main-process CPU usage that could occur with large libraries and active batch workloads. Batch and image changes now update only their corresponding state instead of touching unrelated batches or repeatedly broadcasting and parsing the complete library.
- The image library builds its in-memory index once at startup and maintains it incrementally as individual images are created or removed. Batch listing now fetches the required images in one batched lookup instead of repeatedly scanning outputs or reparsing `library.json`.
- The scheduler advances batches fairly, taking one job from each batch per pass. Reference images are encoded sequentially so one job cannot suddenly decode many originals in parallel. The managed service still defaults to 10 concurrent jobs and honors the user setting without silently reducing it through an internal default.
- Provider and network failures now fail the affected job immediately with the original error instead of entering hidden automatic retries or a global network-recovery wait. Jobs with unknown charge state still require explicit user confirmation before a manual retry to avoid duplicate charges.
- This is a beta release for a serious performance issue. Release artifacts will still be fully built, tested, and provenance-checked for Windows x64 and macOS arm64 from the same Git tag; no older installer will be reused.
- Windows installers are not publisher-signed. The macOS arm64 app uses a structurally verified ad-hoc signature without Developer ID signing or Apple notarization; neither mode establishes publisher identity.

[View the full v1.0.5...v1.1.0-beta.1 changelog](../../compare/v1.0.5...v1.1.0-beta.1)
