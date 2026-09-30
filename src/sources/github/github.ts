import crypto from 'crypto';
import { FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../../config.js';
import type { MessageChannel } from '../../core/MessageChannel.js';
import {
  formatPROpened,
  formatPRMerged,
  formatPRReview,
  formatPush,
  formatWorkflowRunFailure,
} from './messages.js';

export function verifyGitHubSignature(rawBody: Buffer | undefined, signatureHeader: string | string[] | undefined, secret: string): boolean {
  if (!secret || !signatureHeader || !rawBody) {
    return false;
  }

  const sigString = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
  if (!sigString.startsWith('sha256=')) {
    return false;
  }

  const expectedSignature = `sha256=${crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex')}`;

  try {
    return crypto.timingSafeEqual(
      Buffer.from(sigString, 'utf-8'),
      Buffer.from(expectedSignature, 'utf-8')
    );
  } catch {
    return false;
  }
}

export function createGitHubWebhookHandler(
  channel: MessageChannel,
  destination: string,
) {
  return async function handleGitHubWebhook(
    req: FastifyRequest,
    reply: FastifyReply,
  ) {
    const rawBody = (req as any).rawBody as Buffer | undefined;
    const signature = req.headers['x-hub-signature-256'];

    const isValid = verifyGitHubSignature(rawBody, signature, config.githubWebhookSecret);
    if (!isValid) {
      req.log.warn('GitHub webhook signature verification failed');
      return reply.code(401).send({ error: 'Assinatura inválida ou secret não configurado' });
    }

    const event = req.headers['x-github-event'] as string;
    const payload = req.body as any;

    if (!event || !payload) {
      return reply.code(400).send({ error: 'Payload ou evento em falta' });
    }

    req.log.info({ event, action: payload.action }, 'GitHub webhook recebido');

    let message: string | null = null;

    switch (event) {
      case 'pull_request': {
        const pr = payload.pull_request;
        const action = payload.action;

        if (!pr) break;

        if (action === 'opened' || action === 'reopened' || action === 'ready_for_review') {
          message = formatPROpened({
            number: pr.number,
            title: pr.title,
            author: pr.user?.login || 'Alguém',
            head: pr.head?.ref || 'feature',
            base: pr.base?.ref || 'main',
            url: pr.html_url,
            action,
          });
        } else if (action === 'closed' && pr.merged) {
          message = formatPRMerged({
            number: pr.number,
            title: pr.title,
            mergedBy: pr.merged_by?.login || payload.sender?.login || 'Alguém',
          });
        }
        break;
      }

      case 'pull_request_review': {
        const pr = payload.pull_request;
        const review = payload.review;
        const action = payload.action;

        if (action === 'submitted' && review && pr) {
          const state = (review.state || '').toLowerCase();
          if (state === 'approved' || state === 'changes_requested') {
            message = formatPRReview({
              number: pr.number,
              title: pr.title,
              state: state as 'approved' | 'changes_requested',
              reviewer: review.user?.login || 'Alguém',
            });
          }
        }
        break;
      }

      case 'push': {
        const expectedRef = `refs/heads/${config.githubDefaultBranch}`;
        if (payload.ref === expectedRef) {
          const commits = payload.commits || [];
          if (commits.length > 0) {
            message = formatPush({
              branch: config.githubDefaultBranch,
              sender: payload.sender?.login || payload.pusher?.name || 'Alguém',
              commits: commits.map((c: any) => ({
                id: c.id,
                message: c.message,
              })),
            });
          }
        }
        break;
      }

      case 'workflow_run': {
        const run = payload.workflow_run;
        const action = payload.action;

        if (action === 'completed' && run && run.conclusion === 'failure') {
          message = formatWorkflowRunFailure({
            name: payload.workflow?.name || run.name || 'CI',
            branch: run.head_branch || 'main',
            commitSha: run.head_sha || '',
            url: run.html_url,
          });
        }
        break;
      }

      default:
        req.log.debug(`Evento GitHub ignorado: ${event}`);
    }

    if (message) {
      const sent = await channel.send(destination, message);
      if (!sent) {
        req.log.error('Falha ao enviar mensagem GitHub');
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
