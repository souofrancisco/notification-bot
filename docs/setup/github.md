# GitHub Integration Setup

Notification Bot Notifier receives GitHub events via official repository webhooks and verifies each request using HMAC-SHA256 signatures.

---

## 1. Prerequisites

- Admin access to your GitHub repository or organization.
- A public HTTPS endpoint pointing to your Notification Bot Notifier server (e.g. `https://notifier.example.com`).
- A secure webhook secret generated via:
  ```bash
  openssl rand -hex 32
  ```

Add this secret to `.env`:
```env
GITHUB_WEBHOOK_SECRET=your-generated-hex-secret
```

---

## 2. Creating the Webhook in GitHub

1. Navigate to your repository on GitHub.
2. Go to **Settings** > **Webhooks** > **Add webhook**.
3. Configure the webhook fields:
   - **Payload URL:** `https://your-domain.com/webhooks/github`
   - **Content type:** `application/json`
   - **Secret:** Enter the exact value from `GITHUB_WEBHOOK_SECRET`.
   - **SSL verification:** Enable SSL verification.
4. Select **"Let me select individual events"**.

---

## 3. Monitored Events

Check the following checkboxes in GitHub:

| Event | Actions Handled by Notification Bot Notifier |
| :--- | :--- |
| **Pull requests** | `opened`, `reopened`, `ready_for_review`, `closed` (only when merged). |
| **Pull request reviews** | `submitted` (when state is `approved` or `changes_requested`). |
| **Pushes** | Pushes directed to `GITHUB_DEFAULT_BRANCH` (default `main`). Formats up to 5 commit messages. |
| **Workflow runs** | `completed` events where conclusion is `failure`. Notifies CI build breaks. |

Uncheck all other events to reduce unnecessary network traffic.

---

## 4. HMAC-SHA256 Signature Verification

GitHub signs every webhook request using HMAC-SHA256 and sends the signature in the `x-hub-signature-256` header:

```
GitHub (signs body with GITHUB_WEBHOOK_SECRET)
               │
               ▼
POST /webhooks/github (Header: x-hub-signature-256: sha256=...)
               │
               ▼
Notification Bot: Recalculates HMAC on rawBody Buffer using timingSafeEqual()
               │
      ┌────────┴────────┐
      ▼                 ▼
   Valid (200/503)   Invalid (401 Unauthorized)
```

If signatures do not match, Notification Bot Notifier responds with `401 Unauthorized` and ignores the payload.

---

## 5. Testing and Deliveries

In GitHub under **Settings > Webhooks > Your Webhook > Recent Deliveries**:
- Inspect request payloads and HTTP response codes.
- Click **Redeliver** to test event handling without creating dummy PRs or commits.
