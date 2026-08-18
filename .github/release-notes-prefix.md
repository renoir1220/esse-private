## 简体中文

### Esse 1.1.0-beta.2

- 本版本不改变 `1.1.0-beta.1` 已具备的功能和性能逻辑，继续包含大型资料库、批量状态增量更新、缩略图按需处理、批次公平调度以及失败直接报错等修复。
- Windows x64 和 macOS arm64 安装包现在从同一个 Git tag 在自有 runner 上并行构建、验证来源，并在同一次工作流中发布，减少发布环节本身造成的等待和不确定状态。
- 发布失败会直接显示原始错误，不再隐藏重试、覆盖已有 Release 或从另一轮工作流恢复制品；已有 Release 与 Git tag 均不会被自动改写。
- 构建间的临时交接制品仅保留 1 天，正式安装包仍长期保存在 GitHub Release 中，不影响用户下载。
- Windows 安装包未做发布者签名；macOS arm64 应用使用经过结构校验的 ad-hoc 签名，但未做 Developer ID 签名或 Apple 公证，二者均不建立发布者身份。

[查看 v1.1.0-beta.1...v1.1.0-beta.2 完整变更](../../compare/v1.1.0-beta.1...v1.1.0-beta.2)

## English

### Esse 1.1.0-beta.2

- This release does not change the product behavior or performance work already included in `1.1.0-beta.1`. It retains the large-library fixes, incremental batch updates, on-demand thumbnail work, fair batch scheduling, and direct error reporting.
- Windows x64 and macOS arm64 installers are now built in parallel from the same Git tag on owned runners, provenance-checked, and published within the same workflow run, reducing release-side delays and ambiguous states.
- Publication failures surface their original error without hidden retries, overwriting an existing Release, or recovering artifacts from another workflow run. Existing Releases and Git tags are never rewritten automatically.
- Temporary handoff artifacts expire after one day. Published installers remain attached to the GitHub Release and continue to be available to users.
- Windows installers are not publisher-signed. The macOS arm64 app uses a structurally verified ad-hoc signature without Developer ID signing or Apple notarization; neither mode establishes publisher identity.

[View the full v1.1.0-beta.1...v1.1.0-beta.2 changelog](../../compare/v1.1.0-beta.1...v1.1.0-beta.2)
