import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
} from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import pino from 'pino';
import fs from 'fs';
import { config } from '../../config.js';
import type { MessageChannel } from '../../core/MessageChannel.js';

let sock: WASocket | null = null;
let isConnected = false;

export function isWhatsAppConnected(): boolean {
  return isConnected;
}

export async function initWhatsApp(): Promise<void> {
  if (!fs.existsSync(config.authDir)) {
    fs.mkdirSync(config.authDir, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(config.authDir);

  const socketLogger = pino({ level: 'error' });

  sock = makeWASocket({
    auth: state,
    logger: socketLogger,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\n================ WhatsApp QR Code ================');
      console.log('Scan the QR code below with WhatsApp:');
      qrcode.generate(qr, { small: true });
      console.log('===================================================\n');
    }

    if (connection === 'close') {
      isConnected = false;
      const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      console.log(`[WhatsApp] Conexão terminada (código ${statusCode}). Reconectar: ${shouldReconnect}`);

      if (shouldReconnect) {
        console.log('[WhatsApp] A tentar reconectar em 5 segundos...');
        setTimeout(() => {
          initWhatsApp().catch((err) => {
            console.error('[WhatsApp] Falha ao reconectar:', err);
          });
        }, 5000);
      } else {
        console.warn('[WhatsApp] Sessão encerrada (logged out). Elimine a pasta data/whatsapp-auth e reinicie para escanear novo QR.');
      }
    } else if (connection === 'open') {
      isConnected = true;
      console.log('[WhatsApp] Conexão estabelecida com sucesso!');
    }
  });
}

export class WhatsAppChannel implements MessageChannel {
  readonly name = 'whatsapp';

  isReady(): boolean {
    return isConnected;
  }

  async send(destination: string, message: string): Promise<boolean> {
    if (!destination) {
      console.error('[WhatsApp] Chat ID de destino não configurado no .env');
      return false;
    }

    if (!sock || !isConnected) {
      console.error(`[WhatsApp] Mensagem não enviada: WhatsApp desconectado. Destino: ${destination}`);
      return false;
    }

    try {
      await sock.sendMessage(destination, { text: message });
      console.log(`[WhatsApp] Mensagem enviada com sucesso para ${destination}`);
      return true;
    } catch (err) {
      console.error(`[WhatsApp] Erro ao enviar mensagem para ${destination}:`, err);
      return false;
    }
  }
}
