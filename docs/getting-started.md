# Getting Started

This guide walks you through setting up and running Notification Bot Notifier from a clean environment.

---

## 1. Prerequisites

Before starting, ensure you have:
- **Node.js**: v22.0.0 or later (v24 recommended).
- **npm**: v10 or later.
- **WhatsApp Account**: A phone number capable of linking WhatsApp Web.
- **GitHub Repository**: Admin access to configure webhooks.
- **Jira Project**: Project Admin or Jira Admin privileges to create Automation Rules.
- **Public URL**: A public HTTPS endpoint for webhooks (e.g. VPS, Cloudflare Tunnel, or ngrok).

---

## 2. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/your-org/argo-notifier.git
cd argo-notifier

npm install
```

---

## 3. Environment File Scaffolding

Copy the example environment file:

```bash
cp .env.example .env
```

Generate secure secrets for your webhooks:

```bash
# Generate GitHub secret
openssl rand -hex 32

# Generate Jira secret
openssl rand -hex 32
```

Add these values to your `.env` file under `GITHUB_WEBHOOK_SECRET` and `JIRA_WEBHOOK_SECRET`.

---

## 4. Service Integrations

Now configure the three integrations in order:

1. **WhatsApp Authentication & Group IDs:**
   Follow [WhatsApp Setup](setup/whatsapp.md) to scan the QR code and obtain `WHATSAPP_GITHUB_CHAT_ID` and `WHATSAPP_JIRA_CHAT_ID`.
2. **GitHub Webhook:**
   Follow [GitHub Setup](setup/github.md) to register the webhook URL and select monitored events.
3. **Jira Automation Rules:**
   Follow [Jira Setup](setup/jira.md) to create the 4 automation rules in Jira Cloud.

---

## 5. Starting the Service

### Development Mode
Runs with automatic reload on code changes:

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

### Docker Mode

```bash
docker compose up -d --build
```

---

## 6. Verifying Service Health

Verify the server status:

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "whatsapp": "connected"
}
```

If `"whatsapp": "disconnected"`, see [Troubleshooting](troubleshooting.md#whatsapp-says-disconnected).
