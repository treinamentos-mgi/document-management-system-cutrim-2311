# Especificação - Document Management System

## 1. Objetivo

Permitir que um usuário envie, liste e baixe documentos armazenados no filesystem local da aplicação, com metadados mantidos em memória.

## 2. Escopo

### Dentro do escopo

- Upload de um documento por requisição.
- Listagem dos documentos disponíveis para o usuário padrão.
- Download de um documento pelo identificador.
- Armazenamento local em `backend/storage`, usando Multer com `diskStorage`.
- Metadados mantidos em memória durante a execução do processo.
- Interface web em React para envio, listagem e download, integrada à API via `fetch`.

### Fora do escopo

- Autenticação, cadastro de usuários e autorização multiusuário.
- Armazenamento externo, em nuvem ou em banco de dados.
- Versionamento, edição, exclusão ou compartilhamento de documentos.
- Persistência ou recuperação automática dos metadados após reiniciar o processo.
- Restrições por extensão ou tipo MIME do arquivo.

## 3. Requisitos funcionais

| ID | Requisito | Critério de aceite |
| --- | --- | --- |
| RF-01 | O usuário pode enviar um documento usando `multipart/form-data` no campo `file`. | Uma requisição válida retorna `201` e os metadados do documento criado. |
| RF-02 | O sistema rejeita upload sem arquivo ou acima do limite configurado. | Sem arquivo retorna `400`; arquivo acima do limite retorna `413`; nenhuma entrada incompleta fica disponível na listagem. |
| RF-03 | O sistema registra os metadados do documento após salvar o arquivo localmente. | A resposta inclui identificador, nome original, tamanho em bytes, data/hora de upload e dono. |
| RF-04 | O usuário pode listar os documentos disponíveis. | `GET /documents` retorna `200` e uma coleção, inclusive quando vazia. |
| RF-05 | O usuário pode baixar um documento pelo identificador. | Um identificador existente retorna os bytes do arquivo; identificador inexistente ou arquivo ausente retorna `404`. |
| RF-06 | O sistema informa erros de forma consistente. | Erros da API retornam JSON com código e mensagem; o frontend apresenta uma mensagem compreensível sem perder o estado da tela. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos devem ser gravados exclusivamente no filesystem local em `backend/storage`, usando Multer com `diskStorage`. |
| RNF-02 | Os metadados devem permanecer em memória durante a execução. Após reiniciar o processo, eles não são recuperados; arquivos órfãos não são reconciliados automaticamente. |
| RNF-03 | O limite padrão de upload é 10 MiB (10.485.760 bytes), configurável pela variável `MAX_FILE_SIZE_BYTES`. |
| RNF-04 | Todos os tipos de arquivo são aceitos no MVP. O conteúdo baixado deve usar `application/octet-stream`, sem confiar no tipo informado pelo cliente. |
| RNF-05 | A porta deve ser configurável por `PORT`, com padrão `3000`. Configurações numéricas inválidas devem ser rejeitadas na inicialização. |
| RNF-06 | O nome usado no filesystem deve ser gerado pelo servidor. O nome original não pode determinar o caminho de armazenamento; nomes de download devem ser tratados com segurança. |
| RNF-07 | O backend deve seguir dependências unidirecionais: `routes -> controllers -> services -> repositories`. |
| RNF-08 | A aplicação deve tratar falhas de leitura e escrita sem expor caminhos internos ou detalhes sensíveis ao cliente. |

## 5. Modelo de dados (metadados do documento)

### Metadados públicos

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `id` | string | Identificador único, UUID gerado pelo servidor. |
| `originalName` | string | Nome de arquivo submetido pelo cliente, reduzido ao nome-base e seguro para exibição/download. |
| `size` | number | Tamanho do arquivo em bytes. |
| `uploadedAt` | string | Data/hora do upload em ISO 8601 UTC. |
| `owner` | string | Identificador fixo `default` no MVP de usuário único. |

### Dados internos de persistência

O repositório mantém, além dos metadados públicos, o nome gerado para o arquivo e sua localização dentro de `backend/storage`. Esses dados são internos e não devem ser incluídos nas respostas da API. O arquivo só é listado depois de ser gravado com sucesso e associado aos metadados.

## 6. Contratos de API

As rotas abaixo são relativas à raiz do backend. No desenvolvimento, o frontend usa o prefixo `/api`; o proxy Vite o remove ao encaminhar a requisição.

### Formato de erro

Erros da API usam `application/json` no formato:

```json
{
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "Documento não encontrado."
  }
}
```

`code` é estável para tratamento pelo cliente; `message` é uma descrição segura e legível. Erros internos não incluem stack trace nem caminhos locais.

### `POST /upload`

- **Entrada:** `multipart/form-data`, com um arquivo no campo `file`. Campos de identidade enviados pelo cliente não são aceitos nem usados.
- **Sucesso:** `201 Created`, `application/json`.

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "originalName": "relatorio.pdf",
  "size": 2048,
  "uploadedAt": "2026-11-23T12:00:00.000Z",
  "owner": "default"
}
```

- **Erros:** `400 Bad Request` para campo ausente ou requisição multipart inválida; `413 Payload Too Large` acima do limite; `500 Internal Server Error` para falha de armazenamento. Em caso de falha após a gravação, o arquivo parcial deve ser removido sempre que possível e não deve haver metadados publicados.

### `GET /documents`

- **Entrada:** sem corpo ou parâmetros obrigatórios.
- **Sucesso:** `200 OK`, `application/json`.

```json
{
  "documents": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "originalName": "relatorio.pdf",
      "size": 2048,
      "uploadedAt": "2026-11-23T12:00:00.000Z",
      "owner": "default"
    }
  ]
}
```

Uma lista vazia é representada como `{"documents": []}`. Os resultados contêm somente metadados públicos; caminhos e nomes internos de armazenamento são omitidos.

### `GET /documents/:id/download`

- **Entrada:** identificador do documento no parâmetro `id`.
- **Sucesso:** `200 OK` com conteúdo binário, `Content-Type: application/octet-stream` e `Content-Disposition: attachment` com o nome original seguro.
- **Erros:** `404 Not Found` se o identificador não estiver registrado ou se o arquivo local não existir; `500 Internal Server Error` para outra falha de leitura.
- A resposta não deve revelar o caminho físico do arquivo. O caminho é resolvido a partir do registro interno, nunca diretamente do parâmetro recebido.

## 7. Decisões arquiteturais

- **Routes:** declaram `POST /upload`, `GET /documents` e `GET /documents/:id/download` e encaminham as chamadas aos controllers.
- **Controllers:** adaptam requisição/resposta HTTP, validam dados básicos de entrada e traduzem resultados/erros para status e formatos da API.
- **Services:** concentram regras de upload, listagem e download, incluindo validação do limite e consistência entre arquivo e metadados.
- **Repositories:** encapsulam a gravação/leitura local e o armazenamento em memória dos metadados. O mecanismo de arquivos deve permanecer local; não adicionar provedores externos.
- **Multer:** usar `diskStorage` na fronteira de entrada do upload, com destino em `backend/storage`, limite de tamanho configurado e nome físico gerado pelo servidor.
- **Frontend:** componentes React organizados em `components/`, `pages/` e `services/`; chamadas HTTP com `fetch` sob o prefixo `/api` no desenvolvimento.
- **Identidade:** MVP de usuário único sem autenticação; o backend atribui `owner: "default"`. Listagem e download cobrem os documentos desse usuário padrão.
- **Volatilidade:** arquivos são locais e podem sobreviver ao processo, mas metadados em memória não. Reconciliação, limpeza automática e recuperação após reinicialização ficam fora do escopo.

## 8. Plano de execução

1. **Fundação do backend:** configurar servidor, variáveis de ambiente e tratamento comum de erros; manter o endpoint de saúde existente.
2. **Persistência local:** definir a gravação com Multer `diskStorage` e os repositórios para arquivos e metadados em memória, incluindo falhas e limpeza de gravações incompletas.
3. **Casos de uso e API:** implementar upload, listagem e download pelas quatro camadas, com os contratos e status descritos nesta especificação.
4. **Interface web:** criar os fluxos de envio, listagem, estados vazios/erro e download em React, consumindo a API por `fetch`.
5. **Verificação:** cobrir contratos, limite de upload, arquivo ausente, persistência durante a execução e comportamento de erros; executar os testes do backend e verificar manualmente os fluxos do frontend.

Este documento define o escopo e a ordem das etapas. A implementação dos arquivos de backend e frontend ocorre em etapas posteriores.