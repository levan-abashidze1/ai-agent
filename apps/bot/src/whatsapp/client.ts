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
import { env } from '../env.js';
import { logger } from '../logger.js';
import { setConnected, setQr, startQrServer } from './qr-server.js';

export type OnSocketReady = (sock: WASocket) => void | Promise<void>;

let qrServerStarted = false;

export async function startWhatsApp(onReady: OnSocketReady): Promise<void> {
  if (!qrServerStarted) {
    startQrServer(Number(process.env.QR_PORT ?? 8080));
    qrServerStarted = true;
  }

  const { state, saveCreds } = await useMultiFileAuthState(env.AUTH_DIR);
  const { version, isLatest } = await fetchLatestBaileysVersion();
  logger.info({ version, isLatest }, 'baileys version');

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

  sock.ev.on('connection.update', (update: Partial<ConnectionState>) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      setQr(qr);
      logger.info('QR ready — open http://<VPS-IP>:8080 in your browser');
    }

    if (connection === 'open') {
      setQr(null);
      setConnected(true);
      logger.info({ user: sock.user?.id }, 'whatsapp connected');
      void onReady(sock);
    }

    if (connection === 'close') {
      setConnected(false);
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
