import { FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../../config.js';
import type { MessageChannel } from '../../core/MessageChannel.js';
import {
  formatJiraIssueCreated,
  formatJiraStatusChanged,
  formatJiraCoordinatorsChanged,
  formatJiraSprintChanged,
} from './messages.js';

export function verifyJiraSecret(secretHeader: string | string[] | undefined, configuredSecret: string): boolean {
  if (!configuredSecret || !secretHeader) {
    return false;
  }
  const provided = Array.isArray(secretHeader) ? secretHeader[0] : secretHeader;
  return provided === configuredSecret;
}

export function createJiraWebhookHandler(
  channel: MessageChannel,
  destination: string,
) {
  return async function handleJiraWebhook(
    req: FastifyRequest,
    reply: FastifyReply,
  ) {
    const secretHeader = req.headers['x-argo-secret'] || req.headers['authorization'];

    const isValid = verifyJiraSecret(secretHeader, config.jiraWebhookSecret);
    if (!isValid) {
      req.log.warn('Jira webhook secret verification failed');
      return reply.code(401).send({ error: 'Secret de Jira inválido ou não configurado' });
    }

    const payload = req.body as any;

    if (!payload || !payload.event) {
      return reply.code(400).send({ error: 'Payload ou evento Jira em falta' });
    }

    req.log.info({ event: payload.event, key: payload.key }, 'Jira webhook recebido');

    let message: string | null = null;

    switch (payload.event) {
      case 'issue_created': {
        message = formatJiraIssueCreated({
          key: payload.key || 'TASK',
          summary: payload.summary || '',
          status: payload.status || 'A fazer',
          actor: payload.actor,
          url: payload.url,
        });
        break;
      }

      case 'status_changed': {
        const toStatus = payload.toStatus || payload.status || 'Em andamento';
        message = formatJiraStatusChanged({
          key: payload.key || 'TASK',
          summary: payload.summary || '',
          fromStatus: payload.fromStatus,
          toStatus,
          actor: payload.actor,
        });
        break;
      }

      case 'coordinators_changed': {
        message = formatJiraCoordinatorsChanged({
          key: payload.key || 'TASK',
          summary: payload.summary || '',
          coordinators: payload.coordinators || 'Nenhum',
        });
        break;
      }

      case 'sprint_changed': {
        message = formatJiraSprintChanged({
          key: payload.key || 'TASK',
          summary: payload.summary || '',
          fromSprint: payload.fromSprint,
          toSprint: payload.toSprint || payload.sprint || 'Sprint Atualizada',
        });
        break;
      }

      default:
        req.log.debug(`Evento Jira ignorado: ${payload.event}`);
    }

    if (message) {
      const sent = await channel.send(destination, message);
      if (!sent) {
        req.log.error('Falha ao enviar mensagem Jira');
        return reply.code(503).send({
          error: `Falha ao entregar mensagem via ${channel.name}`,
          handled: false,
        });
      }
      return reply.code(200).send({ status: 'ok', handled: true });
    }

    return reply.code(200).send({ status: 'ok', handled: false });
  };
}
