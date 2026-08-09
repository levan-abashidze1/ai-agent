import {
  makeWASocket,
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  type ConnectionState,
  type WASocket,
} from 'baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import { env } from '../env.js';
import { logger } from '../logger.js';

export type OnSocketReady = (sock: WASocket) => void | Promise<void>;

export async function startWhatsApp(onReady: OnSocketReady): Promise<void> {
  const { state, saveCreds } = await useMultiFileAuthState(env.AUTH_DIR);
  const { version, isLatest } = await fetchLatestBaileysVersion();
  logger.info({ version, isLatest }, 'baileys version');

  const usePairing = !state.creds.registered && !!env.BOT_PHONE;

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'warn' }) as never,
    printQRInTerminal: false,
    syncFullHistory: false,
    markOnlineOnConnect: false,
    browser: ['AI Agent', 'Chrome', '120'],
  });

  sock.ev.on('creds.update', saveCreds);

  if (usePairing) {
    setTimeout(async () => {
      try {
        const phone = env.BOT_PHONE.replace(/\D/g, '');
        const code = await sock.requestPairingCode(phone);
        const pretty = code.match(/.{1,4}/g)?.join('-') ?? code;
        console.log('');
        console.log('======================================');
        console.log(' WhatsApp Pairing Code: ' + pretty);
        console.log('======================================');
        console.log('');
        console.log('On the bot phone: WhatsApp → Settings → Linked Devices');
        console.log('→ Link a Device → Link with phone number instead');
        console.log('→ enter the code above');
        console.log('');
      } catch (err) {
        logger.error({ err }, 'failed to request pairing code');
      }
    }, 3000);
  }

  sock.ev.on('connection.update', (update: Partial<ConnectionState>) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr && !usePairing) {
      logger.info('scan this QR code with your WhatsApp mobile app:');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'open') {
      logger.info({ user: sock.user?.id }, 'whatsapp connected');
      void onReady(sock);
    }

    if (connection === 'close') {
      const reason =
        lastDisconnect?.error instanceof Boom
          ? lastDisconnect.error.output?.statusCode
          : undefined;
      const shouldReconnect = reason !== DisconnectReason.loggedOut;
      logger.warn({ reason, shouldReconnect }, 'connection closed');
      if (shouldReconnect) {
        setTimeout(() => void startWhatsApp(onReady), 2000);
      } else {
        logger.error('logged out — delete AUTH_DIR to re-pair');
        process.exit(1);
      }
    }
  });
}
