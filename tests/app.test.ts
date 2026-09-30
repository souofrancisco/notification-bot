import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { buildApp } from '../src/index.js';
import { config, validateRuntimeConfig } from '../src/config.js';
import { verifyGitHubSignature } from '../src/sources/github/github.js';
import { verifyJiraSecret } from '../src/sources/jira/jira.js';

test('verifyGitHubSignature validates matching HMAC sha256 and rejects empty secret', () => {
  const secret = 'my-github-secret';
  const body = Buffer.from(JSON.stringify({ action: 'opened' }), 'utf-8');
  const validSig = `sha256=${crypto.createHmac('sha256', secret).update(body).digest('hex')}`;
  const invalidSig = 'sha256=wronghexvalue';

  assert.equal(verifyGitHubSignature(body, validSig, secret), true);
  assert.equal(verifyGitHubSignature(body, invalidSig, secret), false);
  assert.equal(verifyGitHubSignature(body, undefined, secret), false);
  assert.equal(verifyGitHubSignature(body, validSig, ''), false);
});

test('verifyJiraSecret checks expected secret header and rejects empty configured secret', () => {
  const secret = 'jira-secret-123';
  assert.equal(verifyJiraSecret('jira-secret-123', secret), true);
  assert.equal(verifyJiraSecret('wrong-secret', secret), false);
  assert.equal(verifyJiraSecret(undefined, secret), false);
  assert.equal(verifyJiraSecret('jira-secret-123', ''), false);
});

test('validateRuntimeConfig throws when required variables are missing', () => {
  const oldSecret = config.githubWebhookSecret;
  config.githubWebhookSecret = '';
  assert.throws(() => validateRuntimeConfig(), /Configuração em falta no \.env/);
  config.githubWebhookSecret = oldSecret;
});

test('GET /health returns status ok', async () => {
  const app = await buildApp();
  const response = await app.inject({
    method: 'GET',
    url: '/health',
  });

  assert.equal(response.statusCode, 200);
  const json = JSON.parse(response.body);
  assert.equal(json.status, 'ok');
  assert.ok(json.whatsapp === 'connected' || json.whatsapp === 'disconnected');
  await app.close();
});

test('POST /webhooks/github rejects invalid or missing signature with 401', async () => {
  const app = await buildApp();
  const originalSecret = config.githubWebhookSecret;
  config.githubWebhookSecret = 'test-github-secret';

  const responseMissing = await app.inject({
    method: 'POST',
    url: '/webhooks/github',
    headers: {
      'content-type': 'application/json',
      'x-github-event': 'pull_request',
    },
    payload: { action: 'opened' },
  });
  assert.equal(responseMissing.statusCode, 401);

  const responseInvalid = await app.inject({
    method: 'POST',
    url: '/webhooks/github',
    headers: {
      'content-type': 'application/json',
      'x-github-event': 'pull_request',
      'x-hub-signature-256': 'sha256=invalidhex',
    },
    payload: { action: 'opened' },
  });
  assert.equal(responseInvalid.statusCode, 401);

  config.githubWebhookSecret = originalSecret;
  await app.close();
});

test('POST /webhooks/github returns 503 when message delivery fails (WhatsApp offline)', async () => {
  const app = await buildApp();
  const testSecret = 'test-github-secret';
  const originalSecret = config.githubWebhookSecret;
  config.githubWebhookSecret = testSecret;

  const payload = {
    action: 'opened',
    pull_request: {
      number: 10,
      title: 'Test PR',
      user: { login: 'dev' },
      head: { ref: 'feature/test' },
      base: { ref: 'main' },
      html_url: 'https://github.com/test/repo/pull/10',
    },
  };
  const bodyBuffer = Buffer.from(JSON.stringify(payload), 'utf-8');
  const validSig = `sha256=${crypto.createHmac('sha256', testSecret).update(bodyBuffer).digest('hex')}`;

  const response = await app.inject({
    method: 'POST',
    url: '/webhooks/github',
    headers: {
      'content-type': 'application/json',
      'x-github-event': 'pull_request',
      'x-hub-signature-256': validSig,
    },
    payload,
  });

  assert.equal(response.statusCode, 503);
  const json = JSON.parse(response.body);
  assert.equal(json.handled, false);
  assert.ok(json.error.includes('whatsapp'));

  config.githubWebhookSecret = originalSecret;
  await app.close();
});

test('POST /webhooks/github returns 200 with handled: false for ignored events', async () => {
  const app = await buildApp();
  const testSecret = 'test-github-secret';
  const originalSecret = config.githubWebhookSecret;
  config.githubWebhookSecret = testSecret;

  const payload = { ref: 'refs/heads/other-branch', commits: [] };
  const bodyBuffer = Buffer.from(JSON.stringify(payload), 'utf-8');
  const validSig = `sha256=${crypto.createHmac('sha256', testSecret).update(bodyBuffer).digest('hex')}`;

  const response = await app.inject({
    method: 'POST',
    url: '/webhooks/github',
    headers: {
      'content-type': 'application/json',
      'x-github-event': 'push',
      'x-hub-signature-256': validSig,
    },
    payload,
  });

  assert.equal(response.statusCode, 200);
  const json = JSON.parse(response.body);
  assert.equal(json.status, 'ok');
  assert.equal(json.handled, false);

  config.githubWebhookSecret = originalSecret;
  await app.close();
});

test('POST /webhooks/jira rejects invalid or missing secret with 401', async () => {
  const app = await buildApp();
  const originalSecret = config.jiraWebhookSecret;
  config.jiraWebhookSecret = 'test-jira-secret';

  const responseMissing = await app.inject({
    method: 'POST',
    url: '/webhooks/jira',
    headers: {
      'content-type': 'application/json',
    },
    payload: { event: 'issue_created' },
  });
  assert.equal(responseMissing.statusCode, 401);

  const responseInvalid = await app.inject({
    method: 'POST',
    url: '/webhooks/jira',
    headers: {
      'content-type': 'application/json',
      'x-argo-secret': 'wrong-secret',
    },
    payload: { event: 'issue_created' },
  });
  assert.equal(responseInvalid.statusCode, 401);

  config.jiraWebhookSecret = originalSecret;
  await app.close();
});

test('POST /webhooks/jira returns 503 when message delivery fails (WhatsApp offline)', async () => {
  const app = await buildApp();
  const testSecret = 'test-jira-secret';
  const originalSecret = config.jiraWebhookSecret;
  config.jiraWebhookSecret = testSecret;

  const response = await app.inject({
    method: 'POST',
    url: '/webhooks/jira',
    headers: {
      'content-type': 'application/json',
      'x-argo-secret': testSecret,
    },
    payload: {
      event: 'issue_created',
      key: 'SCRUM-10',
      summary: 'Test task',
      status: 'A fazer',
      actor: 'Tester',
      url: 'https://test.atlassian.net/browse/SCRUM-10',
    },
  });

  assert.equal(response.statusCode, 503);
  const json = JSON.parse(response.body);
  assert.equal(json.handled, false);
  assert.ok(json.error.includes('whatsapp'));

  config.jiraWebhookSecret = originalSecret;
  await app.close();
});
