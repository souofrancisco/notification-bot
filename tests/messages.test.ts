import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatPROpened,
  formatPRMerged,
  formatPRReview,
  formatPush,
  formatWorkflowRunFailure,
} from '../src/sources/github/messages.js';
import {
  formatJiraIssueCreated,
  formatJiraStatusChanged,
  formatJiraCoordinatorsChanged,
  formatJiraSprintChanged,
} from '../src/sources/jira/messages.js';

test('formatPROpened matches expected format for opened, reopened and ready_for_review', () => {
  const opened = formatPROpened({
    number: 42,
    title: 'Plugin Registry',
    author: 'Francisco',
    head: 'feature/plugin-registry',
    base: 'main',
    url: 'https://github.com/org/repo/pull/42',
    action: 'opened',
  });
  assert.ok(opened.includes('🟣 ARGO GitHub — Pull Request'));
  assert.ok(opened.includes('#42 Plugin Registry'));
  assert.ok(opened.includes('Aberta por Francisco'));
  assert.ok(opened.includes('feature/plugin-registry -> main'));
  assert.ok(opened.includes('https://github.com/org/repo/pull/42'));

  const reopened = formatPROpened({
    number: 42,
    title: 'Plugin Registry',
    author: 'Francisco',
    head: 'feature/plugin-registry',
    base: 'main',
    url: 'https://github.com/org/repo/pull/42',
    action: 'reopened',
  });
  assert.ok(reopened.includes('Reaberta por Francisco'));

  const ready = formatPROpened({
    number: 42,
    title: 'Plugin Registry',
    author: 'Francisco',
    head: 'feature/plugin-registry',
    base: 'main',
    url: 'https://github.com/org/repo/pull/42',
    action: 'ready_for_review',
  });
  assert.ok(ready.includes('Pronta para review por Francisco'));
});

test('formatPRMerged matches expected format', () => {
  const output = formatPRMerged({
    number: 42,
    title: 'Plugin Registry',
    mergedBy: 'Tiago',
  });

  assert.ok(output.includes('✅ ARGO GitHub — PR merged'));
  assert.ok(output.includes('#42 Plugin Registry'));
  assert.ok(output.includes('Merge por Tiago'));
});

test('formatPRReview matches approved and changes requested', () => {
  const approved = formatPRReview({
    number: 42,
    title: 'Plugin Registry',
    state: 'approved',
    reviewer: 'Tiago',
  });
  assert.ok(approved.includes('✅ ARGO GitHub — PR aprovada'));
  assert.ok(approved.includes('Review: Tiago'));

  const changes = formatPRReview({
    number: 42,
    title: 'Plugin Registry',
    state: 'changes_requested',
    reviewer: 'Tiago',
  });
  assert.ok(changes.includes('⚠️ ARGO GitHub — Alterações pedidas'));
  assert.ok(changes.includes('Review: Tiago'));
});

test('formatPush limits commits to 5 and shows count', () => {
  const output = formatPush({
    branch: 'main',
    sender: 'Francisco',
    commits: [
      { id: '1111111a', message: 'Add plugin manifest' },
      { id: '2222222b', message: 'Add registry validation' },
      { id: '3333333c', message: 'Fix version parsing' },
      { id: '4444444d', message: 'Commit 4' },
      { id: '5555555e', message: 'Commit 5' },
      { id: '6666666f', message: 'Commit 6' },
      { id: 'a81bc210', message: 'Final commit' },
    ],
  });

  assert.ok(output.includes('🟣 ARGO GitHub — Push para main'));
  assert.ok(output.includes('Francisco enviou 7 commits'));
  assert.ok(output.includes('• Add plugin manifest'));
  assert.ok(output.includes('• Commit 5'));
  assert.ok(!output.includes('• Commit 6'));
  assert.ok(output.includes('+ 2 outros commits'));
  assert.ok(output.includes('Último commit: a81bc21'));
});

test('formatWorkflowRunFailure matches expected format', () => {
  const output = formatWorkflowRunFailure({
    name: 'Build & Test',
    branch: 'main',
    commitSha: 'a81bc219999',
    url: 'https://github.com/org/repo/actions/runs/1234',
  });

  assert.ok(output.includes('❌ ARGO CI'));
  assert.ok(output.includes('Build & Test falhou'));
  assert.ok(output.includes('Branch: main'));
  assert.ok(output.includes('Commit: a81bc21'));
  assert.ok(output.includes('https://github.com/org/repo/actions/runs/1234'));
});

test('formatJiraIssueCreated matches expected format', () => {
  const output = formatJiraIssueCreated({
    key: 'SCRUM-50',
    summary: 'Implementar Plugin Loader',
    status: 'A fazer',
    actor: 'Francisco',
    url: 'https://jira.atlassian.net/browse/SCRUM-50',
  });

  assert.ok(output.includes('🔵 ARGO Jira — Nova task'));
  assert.ok(output.includes('SCRUM-50 — Implementar Plugin Loader'));
  assert.ok(output.includes('Estado: A fazer'));
  assert.ok(output.includes('Criada por: Francisco'));
  assert.ok(output.includes('https://jira.atlassian.net/browse/SCRUM-50'));
});

test('formatJiraStatusChanged handles regular transition, completion and reopening', () => {
  const regular = formatJiraStatusChanged({
    key: 'SCRUM-14',
    summary: 'Arquitetura baseline',
    fromStatus: 'A fazer',
    toStatus: 'Em andamento',
    actor: 'Rafael',
  });
  assert.ok(regular.includes('🔵 ARGO Jira — Estado alterado'));
  assert.ok(regular.includes('A fazer -> Em andamento'));
  assert.ok(regular.includes('Por: Rafael'));

  const completed = formatJiraStatusChanged({
    key: 'SCRUM-14',
    summary: 'Arquitetura baseline',
    fromStatus: 'Em andamento',
    toStatus: 'Concluído',
    actor: 'Rafael',
  });
  assert.ok(completed.includes('✅ ARGO Jira — Task concluída'));
  assert.ok(completed.includes('Por: Rafael'));

  const reopened = formatJiraStatusChanged({
    key: 'SCRUM-14',
    summary: 'Arquitetura baseline',
    fromStatus: 'Concluído',
    toStatus: 'Em andamento',
    actor: 'Rafael',
  });
  assert.ok(reopened.includes('↩️ ARGO Jira — Task reaberta'));
  assert.ok(reopened.includes('Concluído -> Em andamento'));
});

test('formatJiraCoordinatorsChanged matches expected format', () => {
  const output = formatJiraCoordinatorsChanged({
    key: 'SCRUM-15',
    summary: 'Modelo de domínio',
    coordinators: 'Francisco, Henrique',
  });

  assert.ok(output.includes('👥 ARGO Jira — Coordenadores alterados'));
  assert.ok(output.includes('Francisco, Henrique'));
});

test('formatJiraSprintChanged matches expected format', () => {
  const output = formatJiraSprintChanged({
    key: 'SCRUM-19',
    summary: 'Plugin Registry',
    fromSprint: 'Backlog',
    toSprint: 'S2 — Base Técnica e Plugins',
  });

  assert.ok(output.includes('🏃 ARGO Jira — Sprint alterada'));
  assert.ok(output.includes('Backlog -> S2 — Base Técnica e Plugins'));
});
