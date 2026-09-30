import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
} from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import pino from 'pino';
import fs from 'fs';
import { config } from '../../config.js';

async function listGroups() {
  if (!fs.existsSync(config.authDir)) {
    fs.mkdirSync(config.authDir, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(config.authDir);

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'error' }),
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\n[WhatsApp] Scan the QR code to authenticate:');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
      if (statusCode === DisconnectReason.loggedOut) {
        console.error('[WhatsApp] Sessão encerrada (logged out). Elimine data/whatsapp-auth.');
        process.exit(1);
      }
    } else if (connection === 'open') {
      console.log('\n[WhatsApp] Conectado! A listar grupos disponíveis:\n');
      try {
        const groups = await sock.groupFetchAllParticipating();
        const entries = Object.values(groups);

        if (entries.length === 0) {
          console.log('Nenhum grupo encontrado nesta conta WhatsApp.');
        } else {
          for (const g of entries) {
            console.log(`${g.subject} -> ${g.id}`);
          }
        }
      } catch (err) {
        console.error('Erro ao listar grupos:', err);
      } finally {
        setTimeout(() => {
          process.exit(0);
        }, 1000);
      }
    }
  });
}

listGroups().catch((err) => {
  console.error('Falha:', err);
  process.exit(1);
});
