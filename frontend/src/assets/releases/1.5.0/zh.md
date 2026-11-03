# Frontend 1.5.0 | Backend 1.5.1 | Database 8.2.3

## 版本详情

- 完整的国际化（i18n）。
- 新增用户界面主题服务。
- 重构报告用户分配逻辑，以提高可读性，并确保在设置报告用户之前验证必填字段。
- 修复并统一版本管理，并修复 CVE-2025-14847（MongoBleed）。
- CVE 审查：`ip` — `isPublic` 中 SSRF 的错误分类（仅适用于开发树，不影响生产构建 [已在 `package.json` 中添加 override 以强制使用最新版本]）。
- 已在当前版本中解决 `multer` 的 DoS 警报 [CVE-2024-52080、CVE-2024-52081、CVE-2024-52082]；此外，新增文件大小限制和中间件，以防止因 `multer` 错误导致服务器崩溃 [Backend]。
- 修复 `upload_maxsize` 错误 [Frontend]。
- 修复错误：创建服务和程序时出现“Error during query MongoDB.”。

**重要提示：** 此版本引入了完整的系统国际化。
