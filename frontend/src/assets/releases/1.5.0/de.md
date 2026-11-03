# Frontend 1.5.0 | Backend 1.5.1 | Database 8.2.3

## Versionsdetails

- Vollständige Internationalisierung (i18n).
- Theme-Service für die Benutzeroberfläche hinzugefügt.
- Refactoring der Zuweisungslogik für berichtende Benutzer zur besseren Lesbarkeit und zur Sicherstellung, dass erforderliche Felder vor dem Festlegen des berichtenden Benutzers validiert werden.
- Korrektur und Vereinheitlichung der Versionierung sowie Korrektur für CVE-2025-14847 (MongoBleed).
- CVE-Prüfung: `ip` — fehlerhafte Kategorisierung von SSRF in `isPublic` (betrifft nur den Entwicklungsbaum und nicht den Produktions-Build [in `package.json` wird ein Override hinzugefügt, um die neueste Version zu erzwingen]).
- DoS-Warnungen für `multer` werden für [CVE-2024-52080, CVE-2024-52081, CVE-2024-52082] mit der aktuellen Version behoben; zusätzlich werden Dateigrößenlimits und eine Middleware hinzugefügt, um Serverabstürze durch `multer`-Fehler zu verhindern [Backend].
- `upload_maxsize`-Fehler behoben [Frontend].
- Fehler behoben: „Error during query MongoDB.“ trat beim Erstellen von Diensten und Prozeduren auf.

**Wichtiger Hinweis:** Diese Version führt die vollständige Internationalisierung des Systems ein.
