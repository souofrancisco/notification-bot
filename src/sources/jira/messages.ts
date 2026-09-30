export interface JiraIssueData {
  key: string;
  summary: string;
  status: string;
  actor?: string;
  url?: string;
}

export interface JiraStatusChangedData {
  key: string;
  summary: string;
  fromStatus?: string;
  toStatus: string;
  actor?: string;
}

export interface JiraCoordinatorsData {
  key: string;
  summary: string;
  coordinators: string;
}

export interface JiraSprintData {
  key: string;
  summary: string;
  fromSprint?: string;
  toSprint: string;
}

// Jira Formatters
export function formatJiraIssueCreated(data: JiraIssueData): string {
  const lines = [
    '🔵 ARGO Jira — Nova task',
    '',
    `${data.key} — ${data.summary}`,
    '',
    `Estado: ${data.status}`,
  ];
  if (data.actor) {
    lines.push(`Criada por: ${data.actor}`);
  }
  if (data.url) {
    lines.push('', data.url);
  }
  return lines.join('\n');
}

export function formatJiraStatusChanged(data: JiraStatusChangedData): string {
  const toNormalized = data.toStatus.trim().toLowerCase();
  const fromNormalized = data.fromStatus?.trim().toLowerCase() || '';

  // Concluída
  if (toNormalized === 'concluído' || toNormalized === 'concluido' || toNormalized === 'done') {
    const lines = [
      '✅ ARGO Jira — Task concluída',
      '',
      `${data.key} — ${data.summary}`,
    ];
    if (data.actor) {
      lines.push('', `Por: ${data.actor}`);
    }
    return lines.join('\n');
  }

  // Reaberta
  if (
    (fromNormalized === 'concluído' || fromNormalized === 'concluido' || fromNormalized === 'done') &&
    (toNormalized.includes('fazer') || toNormalized.includes('andamento') || toNormalized.includes('to do') || toNormalized.includes('in progress'))
  ) {
    return [
      '↩️ ARGO Jira — Task reaberta',
      '',
      `${data.key} — ${data.summary}`,
      '',
      `${data.fromStatus} -> ${data.toStatus}`,
    ].join('\n');
  }

  // Mudança de estado normal
  const lines = [
    '🔵 ARGO Jira — Estado alterado',
    '',
    `${data.key} — ${data.summary}`,
    '',
  ];

  if (data.fromStatus) {
    lines.push(`${data.fromStatus} -> ${data.toStatus}`);
  } else {
    lines.push(`Novo estado: ${data.toStatus}`);
  }

  if (data.actor) {
    lines.push('', `Por: ${data.actor}`);
  }

  return lines.join('\n');
}

export function formatJiraCoordinatorsChanged(data: JiraCoordinatorsData): string {
  return [
    '👥 ARGO Jira — Coordenadores alterados',
    '',
    `${data.key} — ${data.summary}`,
    '',
    'Coordenadores:',
    data.coordinators,
  ].join('\n');
}

export function formatJiraSprintChanged(data: JiraSprintData): string {
  const from = data.fromSprint || 'Backlog';
  return [
    '🏃 ARGO Jira — Sprint alterada',
    '',
    `${data.key} — ${data.summary}`,
    '',
    `${from} -> ${data.toSprint}`,
  ].join('\n');
}
