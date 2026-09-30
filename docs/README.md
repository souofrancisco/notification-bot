# Notification Bot Notifier Documentation

Welcome to the comprehensive documentation for Notification Bot Notifier. Here you will find step-by-step guides for configuration, integrations, deployment, and technical architecture.

---

## Table of Contents

### Getting Started & Configuration
- [Getting Started](getting-started.md) — Prerequisites, installation walkthrough, and initial testing.
- [Configuration](configuration.md) — Complete environment variable reference and runtime validation.

### Integrations & Setup
- [WhatsApp Setup](setup/whatsapp.md) — Authenticating Baileys via QR code, group JID retrieval, and session persistence.
- [GitHub Setup](setup/github.md) — Configuring repository webhooks, HMAC-SHA256 signature verification, and event subscriptions.
- [Jira Setup](setup/jira.md) — Step-by-step Jira Cloud Automation rules, payload structures, and webhook delivery.

### Architecture & Operations
- [Architecture](architecture.md) — System boundaries, Core/Channels/Sources separation, and adding new transports.
- [Deployment](deployment.md) — Docker containerization, Docker Compose, volume persistence, and reverse proxy guidelines.
- [Security](security.md) — Credential protection, data handling, and emergency leak rotation procedures.
- [Troubleshooting](troubleshooting.md) — Diagnostic guide for HTTP 401, 503, session dropouts, and webhook delivery issues.
