# Frontend 1.5.0 | Backend 1.5.1 | Database 8.2.3

## Detalles de la versión

- Internacionalización (i18n) completa.
- Se agrega un servicio de temas para la interfaz de usuario.
- Refactorización de la lógica de asignación del usuario informador para mejorar la legibilidad y garantizar que los campos requeridos se validen antes de establecer el usuario informador.
- Corrección y unificación del versionado, y corrección de CVE-2025-14847 (MongoBleed).
- Revisión de CVE: `ip` — categorización incorrecta de SSRF en `isPublic` (aplica solo al árbol de desarrollo y no afecta la compilación de producción [se agrega un override en `package.json` para forzar la última versión]).
- Se resuelven las alertas de DoS de `multer` para [CVE-2024-52080, CVE-2024-52081, CVE-2024-52082] con la versión actual; además, se agregan límites de tamaño de archivo y un middleware para evitar caídas del servidor por errores de `multer` [Backend].
- Corrección del error de `upload_maxsize` [Frontend].
- Corrección del error "Error during query MongoDB." que ocurría al intentar crear servicios y procedimientos.

**Nota importante:** Esta versión introduce la internacionalización completa del sistema.
