# Architecture & Design

Notification Bot Notifier is designed around a clean separation of concerns: isolating event intake from message delivery.

---

## Architectural Overview

```
              INPUT SOURCES

          GitHub          Jira
            │               │
            ▼               ▼
      source handlers (verify, parse, format)
            │
            │ formatted string message
            ▼
      COMPOSITION ROOT (src/index.ts)
            │
            ▼
         CHANNEL (src/channels/whatsapp)
            │
            ▼
        WhatsApp (via Baileys socket)
```

---

## Directory Structure

```
src/
├── core/
│   └── MessageChannel.ts        # Minimal shared delivery contract
│
├── channels/
│   └── whatsapp/
│       ├── WhatsAppChannel.ts   # Baileys client & MessageChannel implementation
│       └── list-groups.ts       # CLI tool for JID discovery
│
├── sources/
│   ├── github/
│   │   ├── github.ts            # Webhook signature verification & handler factory
│   │   └── messages.ts          # Event data interfaces & text formatters
│   │
│   └── jira/
│       ├── jira.ts              # Token authentication & handler factory
│       └── messages.ts          # Event data interfaces & text formatters
│
├── config.ts                    # Environment loading & validation
└── index.ts                     # Fastify bootstrap & composition root
```

---

## 1. Core (`src/core/`)

Contains only contracts shared across boundaries. The primary abstraction is:

```typescript
export interface MessageChannel {
  readonly name: string;
  isReady(): boolean;
  send(destination: string, message: string): Promise<boolean>;
}
```

- **Invariant:** `core/` has zero external dependencies (no Fastify, Baileys, GitHub, or Jira imports).
- It defines what a delivery transport must satisfy, without any transport-specific assumptions.

---

## 2. Sources (`src/sources/`)

Responsible for the incoming side of the pipeline:
- **Verification:** Verifies incoming authenticity (HMAC-SHA256 for GitHub, secret token for Jira).
- **Parsing:** Extracts domain objects from vendor-specific payloads.
- **Filtering:** Discards unmonitored events (e.g. non-main branches, irrelevant actions).
- **Formatting:** Produces clean, emoji-badged, multi-line notification strings.

### Factory Pattern for Handlers
Source handlers do not import channels. Instead, they are created as higher-order functions accepting `channel` and `destination`:

```typescript
export function createGitHubWebhookHandler(
  channel: MessageChannel,
  destination: string,
) {
  return async function handleGitHubWebhook(req: FastifyRequest, reply: FastifyReply) {
    // 1. Verify HMAC
    // 2. Parse payload
    // 3. Format message
    // 4. Deliver via channel.send(destination, message)
  };
}
```

- **Benefit:** GitHub and Jira handlers can be tested in isolation with mock channels, and neither knows whether messages go to WhatsApp, Discord, or Slack.

---

## 3. Channels (`src/channels/`)

Responsible for delivery transports:
- Manages connection lifecycle and persistent session state.
- Exposes `send(destination, message)`.
- Does not know anything about GitHub, Jira, PRs, or issues.

---

## 4. Composition Root (`src/index.ts`)

`index.ts` is the single place where all components are instantiated and wired together:

```typescript
const whatsapp = new WhatsAppChannel();

app.post(
  '/webhooks/github',
  createGitHubWebhookHandler(whatsapp, config.whatsappGithubChatId)
);

app.post(
  '/webhooks/jira',
  createJiraWebhookHandler(whatsapp, config.whatsappJiraChatId)
);
```

---

## Future Extensibility: Adding Discord or Slack

To add Discord support:
1. Create `src/channels/discord/DiscordChannel.ts` implementing `MessageChannel`.
2. In `src/index.ts`, instantiate `new DiscordChannel()` and pass it to handlers.
3. **Zero lines of code change in `src/sources/github/` or `src/sources/jira/`.**
