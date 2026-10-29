# Frontend 1.5.0 | Backend 1.5.1 | Database 8.2.3

## Version details

- Full internationalization (i18n).
- Add theme service for the user interface.
- Refactor reporting user assignment logic to improve readability and ensure required fields are validated before setting the reporting user.
- Fix and unify versioning and Fix to CVE-2025-14847 (MongoBleed).
- CVE review: `ip` — SSRF improper categorization in `isPublic` (This only applies to the dev tree, it does not affect the prod build [an override is added to `package.json` to force the latest version]).
- DoS alerts for `multer` are resolved for [CVE-2024-52080, CVE-2024-52081, CVE-2024-52082] with the current version; additionally, file size limits and middleware are added to prevent server crashes due to `multer` errors [Backend].
- Fix `upload_maxsize` error [Frontend].
- Fix Bug: "Error during query MongoDB." occurs when trying to create services and procedures.

**Important Note:** This release introduces full system internationalization.
