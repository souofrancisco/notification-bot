# Notification Bot Notifier

[![Node.js](https://img.shields.io/badge/Node.js-22%2B-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> A lightweight, modular notification service that transforms GitHub and Jira webhooks into clean, real-time WhatsApp updates.

```
🟣 Notification Bot GitHub — Pull Request
#42 Plugin Registry
Aberta por Francisco
feature/plugin-registry -> main
https://github.com/org/repo/pull/42
```

---

## What is Notification Bot Notifier?

Notification Bot Notifier is a self-hosted webhook consumer built with Fastify, TypeScript, and Baileys (WhatsApp Web API). It centralizes engineering activity from GitHub and Jira, formats events into structured Markdown-like messages, and delivers them directly to dedicated WhatsApp groups without requiring third-party bot platforms or complex cloud orchestration.

## Features

- **GitHub Integration:** PRs (opened, reopened, ready for review, merged), reviews (approved, changes requested), branch pushes, CI failures (`workflow_run`).
- **Jira Integration:** Task creation, transitions (in progress, completed, reopened), coordinator updates, sprint changes.
- **Zero Third-Party Cloud Fees:** Direct WhatsApp Web socket session using Baileys — no Twilio or Business API billing.
- **Secure Webhooks:** Strict HMAC SHA-256 signature verification for GitHub and token authorization for Jira.
- **Clean Architecture:** Strict decoupling between event sources (`sources/`), delivery channels (`channels/`), and the shared core contract (`core/`).

## How It Works

```
GitHub ──┐
         ├──> [ Sources ] ──> [ Notifier Composition ] ──> [ Channels ] ──> WhatsApp
Jira ────┘
```

## Architecture

The codebase enforces unidirectional responsibility:
- **`src/core/`**: Minimal contracts (e.g. `MessageChannel`). Independent of external platforms.
- **`src/sources/`**: Webhook receivers, HMAC/token verification, and event formatters (`github`, `jira`). Sources do not know which channel delivers the message.
- **`src/channels/`**: Delivery adapters (`whatsapp`). Channels do not know where events originate or what they mean.
- **`src/index.ts`**: Composition root injecting channels into source handlers.

Detailed guide: [Architecture Documentation](docs/architecture.md)

---

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-org/argo-notifier.git
cd argo-notifier

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env

# 4. Authenticate WhatsApp and retrieve Group JIDs
npm run list-groups

# 5. Populate .env with secrets and group JIDs
# (See Configuration section below)

# 6. Start in development mode
npm run dev
```

---

## Setup Guides

Follow the step-by-step setup guides:
- [WhatsApp Setup](docs/setup/whatsapp.md) — Session authentication and group IDs.
- [GitHub Setup](docs/setup/github.md) — Webhooks, secrets, and supported events.
- [Jira Setup](docs/setup/jira.md) — Jira Automation rules and payload formats.

---

## Configuration

| Variable | Required | Example | Purpose |
| :--- | :--- | :--- | :--- |
| `PORT` | No | `3000` | HTTP server port |
| `WHATSAPP_GITHUB_CHAT_ID` | Yes | `120363000000000000@g.us` | WhatsApp group JID for GitHub |
| `WHATSAPP_JIRA_CHAT_ID` | Yes | `120363111111111111@g.us` | WhatsApp group JID for Jira |
| `GITHUB_WEBHOOK_SECRET` | Yes | `32-byte-hex-secret` | GitHub HMAC-SHA256 secret |
| `JIRA_WEBHOOK_SECRET` | Yes | `32-byte-hex-secret` | Jira webhook authorization secret |
| `GITHUB_DEFAULT_BRANCH` | No | `main` | Branch monitored for push notifications |

Detailed configuration: [Configuration Documentation](docs/configuration.md)

---

## Running the Application

```bash
# Run tests
npm test

# Build TypeScript
npm run build

# Start production server
npm start

# Or using Docker Compose
docker compose up -d --build
```

Health check:
```bash
curl http://localhost:3000/health
# Response: {"status":"ok","whatsapp":"connected"}
```

---

## Documentation Index

| Guide | Description |
| :--- | :--- |
| [Documentation Overview](docs/README.md) | Complete documentation index and navigation |
| [Getting Started](docs/getting-started.md) | Full setup checklist from prerequisites to production |
| [Configuration](docs/configuration.md) | Environment variables and runtime validation |
| [Architecture](docs/architecture.md) | Core contracts, sources, channels, and extending |
| [WhatsApp Setup](docs/setup/whatsapp.md) | Baileys pairing, JID discovery, and session lifecycle |
| [GitHub Setup](docs/setup/github.md) | Webhook delivery, HMAC verification, and events |
| [Jira Setup](docs/setup/jira.md) | Jira Automation Rules step-by-step with payloads |
| [Deployment](docs/deployment.md) | Docker, persistent volumes, reverse proxy, and systemd |
| [Security](docs/security.md) | Secret handling, credential rotation, and attack mitigation |
| [Troubleshooting](docs/troubleshooting.md) | Common errors (401, 503, disconnects) and diagnostics |

---

## Security

**Never commit credentials or auth state:**
- Never commit `.env` or `.env.*`
- Never commit or upload `data/` or `data/whatsapp-auth/`
- Review our [Security Guide](docs/security.md) and [SECURITY.md](SECURITY.md) to report vulnerabilities.

---

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for pull request workflows and architectural guidelines.

## License

This project is licensed under the [MIT License](LICENSE).
