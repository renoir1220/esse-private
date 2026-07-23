## 简体中文

### Esse 1.0.1

- Agent 批次现在按任务隔离 Prompt、参考图和请求大小。多个任务仍可并发执行，但不会再把不同任务的参考图合并进同一次图片服务请求，从而避免单任务未超限却因批次总量触发 `request body too large`。
- 当前批次名称旁新增复制按钮，图片右键菜单新增“复制图片 ID”。用户可以把准确的 `batchId` 和 `imageId` 直接粘贴给 Agent，明确指定要修改的批次和图片。
- 批次清理现在会等待后台写入结束，避免刚删除的批次因未完成的持久化操作在重启后重新出现。
- 修复 `fast-uri` 的高危 URI authority 混淆漏洞，并更新桌面端构建与测试工具链，消除多项已知的开发依赖安全问题。
- 私人版窗口标题现在始终显示为 Esse，并保留 Esse Key、托管连接、默认模型和 Agent 配置引导等私有版体验。

[查看 v1.0.0...v1.0.1 完整变更](../../compare/v1.0.0...v1.0.1)

## English

### Esse 1.0.1

- Agent batches now isolate each job's prompt, references, and request-size budget. Independent jobs can still run concurrently, but references from different jobs are never combined into one image-service request, preventing `request body too large` when every individual job is below the limit.
- A copy control now sits beside the active batch name, and image context menus include **Copy image ID**. Users can paste exact `batchId` and `imageId` values into an Agent conversation to identify the batch and image to modify.
- Batch cleanup now waits for pending background writes, preventing a recently deleted batch from reappearing after restart.
- Fixes the high-severity `fast-uri` URI authority confusion vulnerability and updates the desktop build and test toolchain to remove multiple known development-dependency security issues.
- The private window title now consistently displays Esse while preserving the Esse Key, managed connection, default-model, and Agent setup experience.

[View the full v1.0.0...v1.0.1 changelog](../../compare/v1.0.0...v1.0.1)
