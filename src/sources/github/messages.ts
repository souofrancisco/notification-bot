export interface GitHubPROpenedData {
  number: number;
  title: string;
  author: string;
  head: string;
  base: string;
  url: string;
  action?: 'opened' | 'reopened' | 'ready_for_review';
}

export interface GitHubPRMergedData {
  number: number;
  title: string;
  mergedBy: string;
}

export interface GitHubPRReviewData {
  number: number;
  title: string;
  state: 'approved' | 'changes_requested';
  reviewer: string;
}

export interface GitHubPushCommit {
  id: string;
  message: string;
}

export interface GitHubPushData {
  branch: string;
  sender: string;
  commits: GitHubPushCommit[];
}

export interface GitHubWorkflowRunData {
  name: string;
  branch: string;
  commitSha: string;
  url: string;
}

// GitHub Formatters
export function formatPROpened(data: GitHubPROpenedData): string {
  let actionLabel = `Aberta por ${data.author}`;
  if (data.action === 'reopened') {
    actionLabel = `Reaberta por ${data.author}`;
  } else if (data.action === 'ready_for_review') {
    actionLabel = `Pronta para review por ${data.author}`;
  }

  return [
    '🟣 ARGO GitHub — Pull Request',
    '',
    `#${data.number} ${data.title}`,
    actionLabel,
    '',
    `${data.head} -> ${data.base}`,
    '',
    data.url,
  ].join('\n');
}

export function formatPRMerged(data: GitHubPRMergedData): string {
  return [
    '✅ ARGO GitHub — PR merged',
    '',
    `#${data.number} ${data.title}`,
    '',
    `Merge por ${data.mergedBy}`,
  ].join('\n');
}

export function formatPRReview(data: GitHubPRReviewData): string {
  const isApproved = data.state === 'approved';
  const header = isApproved ? '✅ ARGO GitHub — PR aprovada' : '⚠️ ARGO GitHub — Alterações pedidas';
  return [
    header,
    '',
    `#${data.number} ${data.title}`,
    `Review: ${data.reviewer}`,
  ].join('\n');
}

export function formatPush(data: GitHubPushData): string {
  const count = data.commits.length;
  const commitWord = count === 1 ? 'commit' : 'commits';
  const displayed = data.commits.slice(0, 5);
  const remaining = count - displayed.length;

  const commitList = displayed.map((c) => {
    const firstLine = c.message.split('\n')[0].trim();
    return `• ${firstLine}`;
  });

  if (remaining > 0) {
    commitList.push(`+ ${remaining} outro${remaining > 1 ? 's' : ''} commit${remaining > 1 ? 's' : ''}`);
  }

  const lastSha = data.commits[data.commits.length - 1]?.id.substring(0, 7) || '';

  const lines = [
    `🟣 ARGO GitHub — Push para ${data.branch}`,
    '',
    `${data.sender} enviou ${count} ${commitWord}`,
    '',
    ...commitList,
  ];

  if (lastSha) {
    lines.push('', `Último commit: ${lastSha}`);
  }

  return lines.join('\n');
}

export function formatWorkflowRunFailure(data: GitHubWorkflowRunData): string {
  const shortSha = data.commitSha.substring(0, 7);
  return [
    '❌ ARGO CI',
    '',
    `${data.name} falhou`,
    '',
    `Branch: ${data.branch}`,
    `Commit: ${shortSha}`,
    '',
    data.url,
  ].join('\n');
}
