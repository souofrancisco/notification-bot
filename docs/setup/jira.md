# Jira Cloud Integration Setup

Notification Bot Notifier integrates with Jira Cloud via **Jira Automation Rules** that send normalized HTTP requests directly to `/webhooks/jira`.

---

## 1. Why Jira Automation Web Requests?

- **No OAuth or Forge Apps:** Notification Bot Notifier does not require Jira API tokens, Connect apps, or Atlassian marketplace apps.
- **Normalized Payloads:** Jira internal custom field IDs (e.g. `customfield_10020`) are converted into clean, human-readable JSON inside Jira's Automation Rule builder before sending.
- **Zero Polling:** Instant notifications when team members update issues.

---

## 2. Common Configuration

Generate a secure authorization secret:

```bash
openssl rand -hex 32
```

Add it to `.env`:
```env
JIRA_WEBHOOK_SECRET=your-generated-jira-secret
```

All Jira Automation rules configured below will send a **POST** request with:
- **Webhook URL:** `https://your-domain.com/webhooks/jira`
- **Header 1:** `Content-Type: application/json`
- **Header 2:** `x-argo-secret: <your-JIRA_WEBHOOK_SECRET>`

---

## 3. Automation Rule 1: Issue Created

1. Open Jira > **Project Settings** > **Automation** > **Create rule**.
2. **Trigger:** `Issue created`.
3. **Action:** `Send web request`.
4. Fill parameters:
   - **Web request URL:** `https://your-domain.com/webhooks/jira`
   - **HTTP method:** `POST`
   - **Headers:**
     - `Content-Type`: `application/json`
     - `x-argo-secret`: `<your-JIRA_WEBHOOK_SECRET>`
   - **Web request body:** `Custom data`
   - **Custom data:**
     ```json
     {
       "event": "issue_created",
       "key": "{{issue.key}}",
       "summary": "{{issue.summary.jsonEncode}}",
       "status": "{{issue.status.name.jsonEncode}}",
       "actor": "{{initiator.displayName.jsonEncode}}",
       "url": "{{issue.url}}"
     }
     ```
5. Name rule: `Notification Bot — Issue Created` and click **Turn on rule**.

---

## 4. Automation Rule 2: Status Transition

1. **Trigger:** `Issue transitioned`.
2. **Action:** `Send web request`.
3. **Custom data:**
   ```json
   {
     "event": "status_changed",
     "key": "{{issue.key}}",
     "summary": "{{issue.summary.jsonEncode}}",
     "fromStatus": "{{fieldChange.fromString.jsonEncode}}",
     "toStatus": "{{fieldChange.toString.jsonEncode}}",
     "actor": "{{initiator.displayName.jsonEncode}}"
   }
   ```
4. Name rule: `Notification Bot — Status Changed` and enable.

> [!NOTE]
> Notification Bot Notifier automatically identifies transitions into `Concluído` / `Done` as completed tasks, and transitions out of completed states as reopened tasks.

---

## 5. Automation Rule 3: Coordinators / Assignee Changed

1. **Trigger:** `Field value changed` (select your custom coordinator field or `Assignee`).
2. **Action:** `Send web request`.
3. **Custom data:**
   ```json
   {
     "event": "coordinators_changed",
     "key": "{{issue.key}}",
     "summary": "{{issue.summary.jsonEncode}}",
     "coordinators": "{{issue.Coordinators.displayName.jsonEncode}}"
   }
   ```
4. Name rule: `Notification Bot — Coordinators Changed` and enable.

---

## 6. Automation Rule 4: Sprint Changed

1. **Trigger:** `Field value changed` (select `Sprint`).
2. **Action:** `Send web request`.
3. **Custom data:**
   ```json
   {
     "event": "sprint_changed",
     "key": "{{issue.key}}",
     "summary": "{{issue.summary.jsonEncode}}",
     "fromSprint": "{{fieldChange.fromString.jsonEncode}}",
     "toSprint": "{{fieldChange.toString.jsonEncode}}"
   }
   ```
4. Name rule: `Notification Bot — Sprint Changed` and enable.

---

## 7. Audit Log & Testing

In Jira:
- Go to **Project Settings** > **Automation** > select the rule > **Audit log**.
- Verify execution status shows `SUCCESS` and response code `200`.
