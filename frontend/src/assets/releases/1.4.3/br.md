# Frontend 1.4.3 | Backend 1.4.4 | Database 1.2.0

## Detalhes da versão

- Adiciona o virtual host (VH) `sirius-api` para centralizar as chamadas ao backend e tratar cabeçalhos como `X-Forwarded-For` para obter o IP real do cliente.
- Normaliza os valores `IN` e `ALL` para corrigir erros do MongoDB.
- Correção de erros de validação de cores e inicialização de temas.
- Correção da validação de cores.
- Correção da inicialização do serviço de temas.
