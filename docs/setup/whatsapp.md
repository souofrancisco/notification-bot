# WhatsApp Integration Setup

Notification Bot Notifier uses [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys) to connect directly to the WhatsApp Web multi-device infrastructure.

---

## 1. How It Works

```
Notification Bot Notifier ──> Baileys Socket ──> WhatsApp Web Session ──> WhatsApp Groups
```

- **No Official Cloud API Required:** No Twilio accounts, Meta developer portal registrations, or per-message charges.
- **Session Credentials:** WhatsApp issues cryptographic keys during QR pairing. These keys are stored in `data/whatsapp-auth/` and reused across service restarts.

---

## 2. Step 1: Create WhatsApp Groups

1. In WhatsApp on your mobile device, create the target groups:
   - Example: `Notification Bot — GitHub`
   - Example: `Notification Bot — Jira`
2. Add the phone number that will act as the notifier bot to these groups.

---

## 3. Step 2: Authenticate and Scan QR Code

Run the group listing utility:

```bash
npm run list-groups
```

A QR code will render directly in your terminal:

```
================ WhatsApp QR Code ================
Scan the QR code below with WhatsApp:
[██████████████████████████████████]
===================================================
```

1. Open WhatsApp on the bot's phone.
2. Go to **Settings** (or three dots) > **Linked Devices** > **Link a Device**.
3. Scan the terminal QR code.

---

## 4. Step 3: Extract Group JIDs

Once authenticated, the CLI logs all accessible groups with their unique WhatsApp Jabber IDs (`JID`s):

```
[WhatsApp] Conectado! A listar grupos disponíveis:

Notification Bot — GitHub -> 120363041234567890@g.us
Notification Bot — Jira -> 120363098765432100@g.us
```

Copy each JID into your `.env` file:

```env
WHATSAPP_GITHUB_CHAT_ID=120363041234567890@g.us
WHATSAPP_JIRA_CHAT_ID=120363098765432100@g.us
```

---

## 5. Step 4: Normal Execution & Session Persistence

When you start the application (`npm run dev` or `docker compose up -d`):
- It reads credentials saved in `data/whatsapp-auth/`.
- No new QR code will be prompted as long as the session remains active.

---

## 6. How to Re-Authenticate or Log Out

If the session expires or is manually unlinked:

1. Stop the application:
   ```bash
   docker compose down
   # or Ctrl+C
   ```
2. Remove the old authentication directory:
   ```bash
   rm -rf data/whatsapp-auth
   ```
3. Run `npm run list-groups` to scan a fresh QR code.

---

## 7. Security Warning

> [!CAUTION]
> **Never commit or share `data/whatsapp-auth/`!**
> This directory contains authentication keys that allow sending and reading messages from your WhatsApp account.
> Ensure `data/` is present in your `.gitignore` at all times.
