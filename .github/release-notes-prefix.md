## 简体中文

### Esse 1.0.1

- Agent 批次现在按任务隔离 Prompt、参考图和请求大小。多个任务仍可并发执行，但不会再把不同任务的参考图合并进同一次图片服务请求，从而避免单任务未超限却因批次总量触发 `request body too large`。
- 修复 `fast-uri` 的高危 URI authority 混淆漏洞，并更新桌面端构建与测试工具链，消除多项已知的开发依赖安全问题。
- 保留 Esse Key、托管连接、默认模型和 Agent 配置引导等私有版体验，同时继承 Community 的共享任务与 MCP 修复。

[查看 v1.0.0...v1.0.1 完整变更](../../compare/v1.0.0...v1.0.1)

## English

### Esse 1.0.1

- Agent batches now isolate each job's prompt, references, and request-size budget. Independent jobs can still run concurrently, but references from different jobs are never combined into one image-service request, preventing `request body too large` when every individual job is below the limit.
- Fixes the high-severity `fast-uri` URI authority confusion vulnerability and updates the desktop build and test toolchain to remove multiple known development-dependency security issues.
- Preserves the private edition's Esse Key, managed connection, default-model, and Agent setup experience while inheriting shared task and MCP fixes from Community.

[View the full v1.0.0...v1.0.1 changelog](../../compare/v1.0.0...v1.0.1)
