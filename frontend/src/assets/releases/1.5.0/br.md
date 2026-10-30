# Frontend 1.5.0 | Backend 1.5.1 | Database 8.2.3

## Detalhes da versão

- Internacionalização (i18n) completa.
- Adiciona um serviço de temas para a interface do usuário.
- Refatoração da lógica de atribuição do usuário relator para melhorar a legibilidade e garantir que os campos obrigatórios sejam validados antes de definir o usuário relator.
- Correção e unificação do versionamento, e correção da CVE-2025-14847 (MongoBleed).
- Revisão de CVE: `ip` — categorização incorreta de SSRF em `isPublic` (aplica-se somente à árvore de desenvolvimento e não afeta o build de produção [é adicionado um override no `package.json` para forçar a versão mais recente]).
- Alertas de DoS do `multer` resolvidos para [CVE-2024-52080, CVE-2024-52081, CVE-2024-52082] com a versão atual; além disso, são adicionados limites de tamanho de arquivo e um middleware para evitar quedas do servidor por erros do `multer` [Backend].
- Correção do erro de `upload_maxsize` [Frontend].
- Correção do erro "Error during query MongoDB." que ocorria ao tentar criar serviços e procedimentos.

**Nota importante:** Esta versão introduz a internacionalização completa do sistema.
