# ARGO Notifications Bot

Serviço leve em Node.js (TypeScript + Fastify + Baileys) para encaminhar notificações essenciais do **GitHub** e do **Jira** para grupos dedicados do **WhatsApp**, sem complexidade desnecessária (zero bases de dados, zero Redis, zero message brokers).

---

## 1. Arquitetura e Decisão de Design

```text
                       INTERNET
                          |
             +------------+-------------+
             |                          |
           GitHub                      Jira
             |                          |
          Webhook                 Automation Rule
             |                   Send web request
             |                          |
             v                          v
     POST /webhooks/github      POST /webhooks/jira
             |                          |
             +------------+-------------+
                          |
                     Notifier
                 Node.js + Fastify
                          |
                 +--------+--------+
                 |                 |
          GitHub Formatter    Jira Formatter
                 |                 |
                 v                 v
        Grupo GitHub WA     Grupo Jira WA
```

- **1 processo Node.js**
- **1 sessão WhatsApp** persistida em volume
- **2 grupos de destino** (`WHATSAPP_GITHUB_CHAT_ID` e `WHATSAPP_JIRA_CHAT_ID`)
- **2 endpoints webhook** (`/webhooks/github` e `/webhooks/jira`)
- **Fail-fast no arranque**: falha se faltarem variáveis de ambiente críticas no `.env`.

---

## 2. Configuração e Variáveis de Ambiente

Copiar o modelo de ambiente:

```bash
cp .env.example .env
```

Campos obrigatórios no `.env`:

```env
PORT=3000

# JIDs dos grupos WhatsApp obtidos via `npm run list-groups`
WHATSAPP_GITHUB_CHAT_ID=12036xxxxxxxx@g.us
WHATSAPP_JIRA_CHAT_ID=12036yyyyyyyy@g.us

# Segredos de validação
GITHUB_WEBHOOK_SECRET=um_segredo_forte_para_github
JIRA_WEBHOOK_SECRET=um_segredo_forte_para_jira

# Branch vigiada para commits
GITHUB_DEFAULT_BRANCH=main
```

---

## 3. Autenticação e Obtenção dos IDs dos Grupos (WhatsApp)

1. Executar o script de discovery:
   ```bash
   npm run list-groups
   ```
2. Um QR Code será impresso no terminal.
3. No WhatsApp do telemóvel, aceder a **Dispositivos Conectados** > **Conectar um dispositivo** e ler o QR Code.
4. Após conectar, o script lista todos os grupos da conta com o respetivo JID:
   ```text
   ARGO — GitHub -> 12036xxxxxxxx@g.us
   ARGO — Jira   -> 12036yyyyyyyy@g.us
   ```
5. Copiar os IDs para `WHATSAPP_GITHUB_CHAT_ID` e `WHATSAPP_JIRA_CHAT_ID` no ficheiro `.env`.
6. As credenciais ficam guardadas localmente em `./data/whatsapp-auth/` para evitar reautenticações futuras.

> ⚠️ **Segurança da Sessão Baileys:** A pasta `data/whatsapp-auth/` contém chaves criptográficas que conferem acesso total à conta WhatsApp ligada. Nunca comite esta pasta nem partilhe os ficheiros de sessão. O diretório está explicitamente ignorado no `.gitignore`.

---

## 4. Configurar Webhook no GitHub

No repositório do GitHub:
1. Aceder a **Settings** > **Webhooks** > **Add webhook**.
2. **Payload URL**: `https://<seu-dominio>/webhooks/github`
3. **Content type**: `application/json`
4. **Secret**: o mesmo valor definido em `GITHUB_WEBHOOK_SECRET`.
5. Selecionar **Let me select individual events**:
   - `Pushes` (notifica pushes na branch configurada em `GITHUB_DEFAULT_BRANCH`)
   - `Pull requests` (opened, reopened, ready_for_review, closed com merge)
   - `Pull request reviews` (apenas approved ou changes_requested)
   - `Workflow runs` (apenas falhas no CI)
6. Guardar o webhook. Todas as entregas são validadas criptograficamente através de HMAC SHA-256 (`X-Hub-Signature-256`).

---

## 5. Configurar Jira Automation Rules

Em vez de criar uma app Atlassian Connect ou Forge, o notifier usa as **Automation Rules** nativas do Jira Cloud com a ação **Send web request**.

### Headers comuns a todas as regras:
- `Content-Type`: `application/json`
- `X-ARGO-Secret`: valor configurado em `JIRA_WEBHOOK_SECRET`
- Método: `POST`
- Webhook URL: `https://<seu-dominio>/webhooks/jira`

### Regras mínimas recomendadas:

#### Regra 1 — Issue Criada
- **Gatilho**: *Issue created*
- **Payload**:
  ```json
  {
    "event": "issue_created",
    "key": "{{issue.key}}",
    "summary": "{{issue.summary}}",
    "status": "{{issue.status.name}}",
    "actor": "{{initiator.displayName}}",
    "url": "{{issue.url}}"
  }
  ```

#### Regra 2 — Estado Alterado (inclui Concluída e Reaberta)
- **Gatilho**: *Issue transitioned*
- **Payload**:
  ```json
  {
    "event": "status_changed",
    "key": "{{issue.key}}",
    "summary": "{{issue.summary}}",
    "status": "{{issue.status.name}}",
    "fromStatus": "{{changelog.status.fromString}}",
    "toStatus": "{{issue.status.name}}",
    "actor": "{{initiator.displayName}}"
  }
  ```

#### Regra 3 — Coordenadores Alterados
- **Gatilho**: *Field value changed* (campo Coordenadores)
- **Payload**:
  ```json
  {
    "event": "coordinators_changed",
    "key": "{{issue.key}}",
    "summary": "{{issue.summary}}",
    "coordinators": "{{issue.Coordenadores.displayName}}"
  }
  ```

#### Regra 4 — Sprint Alterada
- **Gatilho**: *Field value changed* (campo Sprint)
- **Payload**:
  ```json
  {
    "event": "sprint_changed",
    "key": "{{issue.key}}",
    "summary": "{{issue.summary}}",
    "fromSprint": "Backlog",
    "toSprint": "{{issue.Sprint.name}}"
  }
  ```

---

## 6. Códigos de Resposta HTTP

- `200 OK`: Webhook processado (mensagem entregue ou evento ignorado propositadamente).
- `401 Unauthorized`: Assinatura HMAC do GitHub inválida ou header `X-ARGO-Secret` incorreto.
- `400 Bad Request`: Payload ausente ou formato inválido.
- `503 Service Unavailable`: Evento válido e mensagem formatada, mas a sessão WhatsApp encontra-se desconectada ou indisponível. Permite ao emissor identificar a falha de entrega.

---

## 7. Execução e Deployment

### Desenvolvimento Local
```bash
npm install
npm run dev
```

### Build e Execução Manual
```bash
npm run build
npm start
```

### Testes Automatizados
```bash
npm test
```

### Docker & Docker Compose (Produção)
O deployment em produção recomenda uma VPS com armazenamento persistente montado em `./data`:

```bash
docker compose build
docker compose up -d
```

Verificação de saúde:
```bash
curl http://localhost:3000/health
# {"status":"ok","whatsapp":"connected"}
```

---

## 8. Licença

Distribuído sob a licença MIT. Consulte [LICENSE](file:///home/souofrancisco/Documents/ME/notification-bot/LICENSE) para mais informações.
