# Frontend 1.4.1 | Backend 1.4.1 | Database 1.2.0

## Сведения о версии

- Исправлена функция `serDefaultEmail` (при создании адресов электронной почты по умолчанию удаляются пробелы).
- Обновлён `mongoose` и добавлен middleware `checkDBConnection` для предотвращения CVE-2025-23061.
