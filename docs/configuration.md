# Configuration Reference

Notification Bot Notifier is configured through environment variables defined in a `.env` file at the root of the project.

---

## Environment Variables

| Variable | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `PORT` | Number | No | `3000` | Port on which the Fastify HTTP server listens. |
| `WHATSAPP_GITHUB_CHAT_ID` | String | **Yes** | — | WhatsApp group JID for GitHub notifications (e.g. `120363000000000000@g.us`). |
| `WHATSAPP_JIRA_CHAT_ID` | String | **Yes** | — | WhatsApp group JID for Jira notifications (e.g. `120363111111111111@g.us`). |
| `GITHUB_WEBHOOK_SECRET` | String | **Yes** | — | Secret key used to verify HMAC-SHA256 signatures (`x-hub-signature-256`) from GitHub. |
| `JIRA_WEBHOOK_SECRET` | String | **Yes** | — | Shared secret token passed in `x-argo-secret` header by Jira Automation webhooks. |
| `GITHUB_DEFAULT_BRANCH` | String | No | `main` | Branch name monitored for push notifications. Commits to other branches are ignored. |

---

## Runtime Validation

When Notification Bot Notifier starts, `validateRuntimeConfig()` executes before the HTTP listener binds:

```typescript
export function validateRuntimeConfig(): void {
  const missing: string[] = [];

  if (!config.githubWebhookSecret) missing.push('GITHUB_WEBHOOK_SECRET');
  if (!config.jiraWebhookSecret) missing.push('JIRA_WEBHOOK_SECRET');
  if (!config.whatsappGithubChatId) missing.push('WHATSAPP_GITHUB_CHAT_ID');
  if (!config.whatsappJiraChatId) missing.push('WHATSAPP_JIRA_CHAT_ID');

  if (missing.length > 0) {
    throw new Error(
      `[Config] Configuração em falta no .env: ${missing.join(', ')}. Defina todas as variáveis obrigatórias antes de iniciar o servidor.`
    );
  }
}
```

If any mandatory variable is unset or empty, the application prints a clear diagnostic message and halts immediately with exit code `1`.
