import Fastify from 'fastify';
import { config, validateRuntimeConfig } from './config.js';
import { initWhatsApp, isWhatsAppConnected, WhatsAppChannel } from './channels/whatsapp/WhatsAppChannel.js';
import { createGitHubWebhookHandler } from './sources/github/github.js';
import { createJiraWebhookHandler } from './sources/jira/jira.js';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: 'info',
    },
  });

  // Salvar rawBody em Buffer para validação HMAC precisa de webhooks
  app.addContentTypeParser(
    'application/json',
    { parseAs: 'buffer' },
    (req, body: Buffer, done) => {
      try {
        (req as any).rawBody = body;
        const parsed = body.length > 0 ? JSON.parse(body.toString('utf-8')) : {};
        done(null, parsed);
      } catch (err: any) {
        err.statusCode = 400;
        done(err, undefined);
      }
    }
  );

  const whatsapp = new WhatsAppChannel();

  // Health check
  app.get('/health', async (_req, reply) => {
    return reply.code(200).send({
      status: 'ok',
      whatsapp: isWhatsAppConnected() ? 'connected' : 'disconnected',
    });
  });

  // Webhooks
  app.post(
    '/webhooks/github',
    createGitHubWebhookHandler(whatsapp, config.whatsappGithubChatId)
  );
  app.post(
    '/webhooks/jira',
    createJiraWebhookHandler(whatsapp, config.whatsappJiraChatId)
  );

  return app;
}

async function start() {
  try {
    validateRuntimeConfig();
  } catch (err: any) {
    console.error(err.message);
    process.exit(1);
  }

  const app = await buildApp();

  try {
    await app.listen({ port: config.port, host: '0.0.0.0' });
    app.log.info(`Servidor Notification Bot Notifier ativo na porta ${config.port}`);

    // Inicializar sessão WhatsApp
    await initWhatsApp();
  } catch (err) {
    app.log.error(err, 'Erro ao inicializar servidor');
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (process.argv[1] && (process.argv[1].endsWith('index.ts') || process.argv[1].endsWith('index.js'))) {
  start();
}
