## 简体中文

### Esse 1.0.3

- 重新设计多批次浏览体验：按 `Esc` 可从批次明细进入浏览页，浏览按钮提供快捷键提示，并在任一任务排队或运行时实时显示旋转状态。
- 批次卡片实时展示完成进度，并用遮罩区分“进行中”“完成有错”和“已完成”。成功重试会清除历史失败状态，应用中断遗留的任务仍会正确标记为有错。
- 支持直接重试批次中的全部失败任务，并新增中文模糊搜索、可选日期范围和更自然的近期批次分组。
- 图片库、参考图、附件和批次封面缩略图现在完整显示原图；非正方形图片使用留白，不再裁剪内容，同时修复浏览页面不必要的纵向滚动。
- 错误信息现在明确区分上游服务与 Esse 本地错误，便于客户侧排查；私有版只显示通用上游标签，不暴露服务商名称。
- 私有版 macOS 安装包现在仅面向 Apple Silicon（M 系列、arm64）；不再发布 Intel Mac 安装包。
- Windows 与 macOS 安装包当前未做发布者签名或 Apple 公证；Release 提供 SHA256 校验。Windows 可能显示未知发布者，macOS Gatekeeper 可能拒绝打开，请勿关闭系统安全机制。

[查看 v1.0.2...v1.0.3 完整变更](../../compare/v1.0.2...v1.0.3)

## English

### Esse 1.0.3

- Redesigns multi-batch browsing. Press `Esc` from batch details to open the browser, see the shortcut on the Browse button, and watch it show a live spinner whenever any task is queued or running.
- Batch cards now report progress in real time and distinguish In Progress, Completed with Errors, and Completed states. Successful retries clear historical failures, while work interrupted by an application exit remains correctly marked as an error.
- Adds one-click retry for all failed tasks in a batch, Chinese fuzzy search, an optional date range, and a more natural grouping for recently updated batches.
- Shows complete images throughout gallery, reference, attachment, and batch-cover thumbnails. Non-square images are letterboxed instead of cropped, and unnecessary page-level vertical scrolling is removed.
- Error details now distinguish upstream-service failures from local Esse failures for easier customer-side diagnosis. The private edition uses a generic upstream label without exposing provider names.
- The private macOS installer now targets Apple Silicon (M-series, arm64) only. Intel Mac installers are no longer published.
- Windows and macOS installers are currently not publisher-signed or Apple-notarized. SHA256 checksums are provided. Windows may show an unknown-publisher warning, and macOS Gatekeeper may reject the app; do not disable platform security.

[View the full v1.0.2...v1.0.3 changelog](../../compare/v1.0.2...v1.0.3)
