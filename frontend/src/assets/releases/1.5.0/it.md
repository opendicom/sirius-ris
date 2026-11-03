# Frontend 1.5.0 | Backend 1.5.1 | Database 8.2.3

## Dettagli della versione

- Internazionalizzazione (i18n) completa.
- Aggiunto un servizio di temi per l'interfaccia utente.
- Refactoring della logica di assegnazione dell'utente refertatore per migliorare la leggibilità e garantire che i campi obbligatori vengano validati prima di impostare l'utente refertatore.
- Correzione e unificazione del versionamento, e correzione della CVE-2025-14847 (MongoBleed).
- Revisione CVE: `ip` — categorizzazione errata di SSRF in `isPublic` (si applica solo all'albero di sviluppo e non influisce sulla build di produzione [viene aggiunto un override in `package.json` per forzare l'ultima versione]).
- Gli avvisi DoS di `multer` sono risolti per [CVE-2024-52080, CVE-2024-52081, CVE-2024-52082] con la versione attuale; inoltre, vengono aggiunti limiti di dimensione dei file e un middleware per evitare arresti anomali del server dovuti a errori di `multer` [Backend].
- Correzione dell'errore `upload_maxsize` [Frontend].
- Correzione del bug: l'errore "Error during query MongoDB." si verificava durante la creazione di servizi e procedure.

**Nota importante:** Questa versione introduce l'internazionalizzazione completa del sistema.
