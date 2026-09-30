import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  authDir: path.resolve(process.cwd(), 'data/whatsapp-auth'),
  whatsappGithubChatId: process.env.WHATSAPP_GITHUB_CHAT_ID || '',
  whatsappJiraChatId: process.env.WHATSAPP_JIRA_CHAT_ID || '',
  githubWebhookSecret: process.env.GITHUB_WEBHOOK_SECRET || '',
  jiraWebhookSecret: process.env.JIRA_WEBHOOK_SECRET || '',
  githubDefaultBranch: process.env.GITHUB_DEFAULT_BRANCH || 'main',
};

export function validateRuntimeConfig(): void {
  const missing: string[] = [];

  if (!config.githubWebhookSecret) {
    missing.push('GITHUB_WEBHOOK_SECRET');
  }
  if (!config.jiraWebhookSecret) {
    missing.push('JIRA_WEBHOOK_SECRET');
  }
  if (!config.whatsappGithubChatId) {
    missing.push('WHATSAPP_GITHUB_CHAT_ID');
  }
  if (!config.whatsappJiraChatId) {
    missing.push('WHATSAPP_JIRA_CHAT_ID');
  }

  if (missing.length > 0) {
    throw new Error(
      `[Config] Configuração em falta no .env: ${missing.join(', ')}. Defina todas as variáveis obrigatórias antes de iniciar o servidor.`
    );
  }
}
