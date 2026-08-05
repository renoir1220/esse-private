## 简体中文

### Esse 1.0.5

- 图片网格、参考图和批次浏览改用最长边 512 像素的缓存预览，不再将 2K/4K 原图直接作为缩略图解码；原图保持不变，仅在查看大图、下载、复制、导出或提交参考图时读取。
- 缩略图只在接近可视区域时加载，离开较远区域后会主动卸载，离屏卡片也会跳过绘制。跨平台压力测试会用 120 个历史批次验证加载数量始终有界，并拒绝批量原图请求。
- 预览生成按顺序执行并自动合并重复请求，磁盘缓存限制为约 256 MB；缓存缺失或原图变化时会自动重建，预览异常也不会影响原图使用。
- 更新网络边界相关依赖，修复上游已披露的 SSRF 分类绕过、HTTP 客户端解析与缓存问题，以及本地服务 CORS 正则拒绝服务问题。
- 测试和 QA 会话改用临时 MCP 配对令牌，不再触发或污染 macOS 钥匙串；普通用户会话仍使用受保护的持久令牌。macOS 包启动 smoke 也不再因进程未响应而无限等待。
- Windows 安装包仍未做发布者签名；macOS arm64 应用使用经过结构校验的 ad-hoc 签名，但未做 Developer ID 签名或 Apple 公证，二者均不建立发布者身份。

[查看 v1.0.4...v1.0.5 完整变更](../../compare/v1.0.4...v1.0.5)

## English

### Esse 1.0.5

- Gallery grids, reference lists, and the batch browser now use cached previews capped at a 512-pixel long edge instead of decoding 2K/4K originals as thumbnails. Originals remain unchanged and are read only for full-image viewing, download, copy, export, or Provider reference submission.
- Thumbnails load only near the viewport and unload again when far away, while offscreen cards skip paint work. Cross-platform stress coverage opens 120 historical batches, keeps the loaded set bounded, and rejects bulk original-image requests.
- Preview generation is serialized and deduplicated, with an approximately 256 MB disk-cache limit. Missing or stale previews rebuild automatically, while preview failures never make the original unavailable.
- Updates network-boundary dependencies to address disclosed upstream SSRF-classification bypasses, HTTP client parsing and cache issues, and a CORS regular-expression denial of service in the local server stack.
- Test and QA sessions now use ephemeral MCP pairing tokens instead of prompting for or contaminating the macOS Keychain; ordinary user sessions still use protected persistent tokens. The packaged macOS smoke test also has bounded process cleanup.
- Windows artifacts remain unsigned by a publisher. The macOS arm64 app uses a structurally verified ad-hoc signature without Developer ID signing or Apple notarization; neither platform mode establishes publisher identity.

[View the full v1.0.4...v1.0.5 changelog](../../compare/v1.0.4...v1.0.5)
