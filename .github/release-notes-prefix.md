## 简体中文

### Esse 1.1.0-beta.4

- 自定义下拉菜单在打开和键盘切换时不再因页面滚动而闪屏或收起；鼠标滚轮滚到菜单边界时保持展开，Windows 与 macOS 行为一致。
- 高级配置现在把预置兔子 Provider 与其他 Provider 平级管理；可编辑 URL、接口格式、并发、密钥和模型，删除模型即禁用，保存后 Esse 与 Agent 立即使用当前配置。
- Agent 的模型能力查询改为读取当前 Provider 注册表；新增或禁用模型会在下一次查询中生效，不再返回旧的内置列表。
- 兔子默认预置加入已通过真实异步生图验证的 `gemini-3.1-flash-image-preview-4k` 模型。
- Windows 安装包未做发布者签名；macOS arm64 应用使用经过结构校验的 ad-hoc 签名，但未做 Developer ID 签名或 Apple 公证，二者均不建立发布者身份。

[查看 v1.1.0-beta.3...v1.1.0-beta.4 完整变更](../../compare/v1.1.0-beta.3...v1.1.0-beta.4)

## English

### Esse 1.1.0-beta.4

- Custom dropdowns no longer flicker or collapse because opening and keyboard navigation scroll the page; wheel scrolling at the menu boundary keeps the menu open consistently on Windows and macOS.
- Advanced settings now manage the preconfigured Tuzi Provider alongside other Providers. URL, endpoint format, concurrency, key, and models are editable; removing a model disables it, and saving immediately updates Esse and the Agent.
- Agent capability queries now read the current Provider registry. Added or disabled models take effect on the next query instead of returning a stale built-in list.
- The Tuzi default preset now includes `gemini-3.1-flash-image-preview-4k`, verified with a real asynchronous image-generation request.
- Windows installers are not publisher-signed. The macOS arm64 app uses a structurally verified ad-hoc signature without Developer ID signing or Apple notarization; neither mode establishes publisher identity.

[View the full v1.1.0-beta.3...v1.1.0-beta.4 changelog](../../compare/v1.1.0-beta.3...v1.1.0-beta.4)
