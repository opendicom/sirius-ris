# Frontend 1.4.1 | Backend 1.4.1 | Database 1.2.0

## バージョン詳細

- `serDefaultEmail` を修正しました（デフォルトのメールアドレスを生成する際にスペースを削除）。
- `mongoose` を更新し、CVE-2025-23061 を防ぐために `checkDBConnection` ミドルウェアを追加しました。
