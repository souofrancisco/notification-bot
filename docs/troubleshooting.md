# Troubleshooting Guide

Common issues, failure symptoms, and resolutions when operating Notification Bot Notifier.

---

## 1. Webhook HTTP Status Codes

### `401 Unauthorized` on `/webhooks/github`
- **Cause:** HMAC signature verification failed (`x-hub-signature-256` mismatch or missing).
- **Checks:**
  - Verify `GITHUB_WEBHOOK_SECRET` in `.env` exactly matches the Secret in GitHub Webhook settings.
  - Ensure reverse proxies pass raw headers and do not alter payload encodings.

### `401 Unauthorized` on `/webhooks/jira`
- **Cause:** Missing or invalid `x-argo-secret` header.
- **Checks:**
  - In Jira Automation Rule > Send Web Request > Headers, ensure `x-argo-secret` is defined and matches `JIRA_WEBHOOK_SECRET`.

### `503 Service Unavailable` on any Webhook
- **Cause:** The webhook was successfully parsed and validated, but message delivery failed (e.g. WhatsApp is offline or group JID is invalid).
- **Response:**
  ```json
  {
    "error": "Falha ao entregar mensagem via whatsapp",
    "handled": false
  }
  ```
- **Checks:**
  - Check `curl http://localhost:3000/health`. If `"whatsapp": "disconnected"`, restart the service or check WhatsApp socket status.
  - Verify that `WHATSAPP_GITHUB_CHAT_ID` or `WHATSAPP_JIRA_CHAT_ID` in `.env` is not blank.

---

## 2. WhatsApp Connectivity

### "WhatsApp disconnected" in logs or `/health`
- Check server internet connectivity.
- Verify if the linked device was logged out from the phone's WhatsApp application.
- Check Baileys automatic reconnection attempts in application logs.

### Terminal prompts QR code on every container restart
- **Cause:** Missing persistent volume mount.
- **Resolution:** In `docker-compose.yml`, ensure `volumes: - ./data:/app/data` is present so credentials inside `data/whatsapp-auth/` persist across container recreations.

### `npm run list-groups` shows no groups
- Ensure the WhatsApp account running the bot has been added as a participant to the groups.
- Wait a few seconds after connecting before closing the utility.
