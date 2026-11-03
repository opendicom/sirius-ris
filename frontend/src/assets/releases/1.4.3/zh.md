# Frontend 1.4.3 | Backend 1.4.4 | Database 1.2.0

## 版本详情

- 新增虚拟主机（VH）`sirius-api`，用于集中处理发往后端的请求，并处理 `X-Forwarded-For` 等请求头以获取客户端的真实 IP。
- 规范化 `IN` 和 `ALL` 的值，以修复 MongoDB 错误。
- 修复颜色验证错误并初始化主题。
- 修复颜色验证。
- 修复主题服务初始化。
