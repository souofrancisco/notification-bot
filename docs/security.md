# Security & Credential Protection

This guide outlines security practices, classification of sensitive assets, and incident recovery procedures for Notification Bot Notifier.

---

## 1. Sensitive vs Public Assets

### 🚫 STRICTLY CONFIDENTIAL (Never Commit or Share)
- `.env`, `.env.local`, `.env.*`
- `data/` and `data/whatsapp-auth/` (contains WhatsApp private keys and active login session)
- Real WhatsApp Group `JID`s (e.g. `120363041234567890@g.us`)
- `GITHUB_WEBHOOK_SECRET`
- `JIRA_WEBHOOK_SECRET`
- Private infrastructure IPs, SSH keys, or reverse proxy certificates

### 🟢 SAFE FOR PUBLIC REPOSITORIES
- `.env.example` (with empty or placeholder values)
- Source code under `src/` and `tests/`
- `Dockerfile` and `docker-compose.yml`
- Documentation and architecture diagrams
- Example mock JIDs (e.g. `120363000000000000@g.us`)

---

## 2. Attack Mitigation

### GitHub Webhook HMAC Verification
All requests hitting `/webhooks/github` are validated against `x-hub-signature-256`. Notification Bot uses Node's `crypto.timingSafeEqual` over the `rawBody` Buffer to prevent timing side-channel attacks.

### Jira Webhook Secret
Requests hitting `/webhooks/jira` require an exact match against `x-argo-secret` or `authorization`. Unauthenticated calls are rejected with `401 Unauthorized` before payload parsing.

---

## 3. Incident Response & Secret Rotation Checklist

If credentials or secrets are leaked:

### Case A: `GITHUB_WEBHOOK_SECRET` Exposed
1. Generate a new secret: `openssl rand -hex 32`
2. Update `.env` with the new secret.
3. Update the secret in GitHub: **Repository > Settings > Webhooks > Edit**.
4. Restart Notification Bot Notifier (`docker compose restart` or `npm start`).

### Case B: `JIRA_WEBHOOK_SECRET` Exposed
1. Generate a new secret: `openssl rand -hex 32`
2. Update `.env` with the new secret.
3. Update the `x-argo-secret` header in all Jira Automation rules.
4. Restart Notification Bot Notifier.

### Case C: WhatsApp Authentication (`data/whatsapp-auth/`) Exposed
1. **Immediately unlink the device:**
   - Open WhatsApp on the host phone.
   - Go to **Settings > Linked Devices**.
   - Tap the linked device and select **Log Out**.
2. Remove the local auth folder:
   ```bash
   rm -rf data/whatsapp-auth
   ```
3. Run `npm run list-groups` to pair with a completely fresh session.
