import { logger } from './logger.js';
import { startWhatsApp } from './whatsapp/client.js';
import { bindHandlers } from './whatsapp/handler.js';

async function main(): Promise<void> {
  logger.info('booting AI Agent bot...');
  await startWhatsApp((sock) => {
    bindHandlers(sock);
    logger.info({ botJid: sock.user?.id }, 'handlers bound, ready');
  });
}

main().catch((err) => {
  logger.error({ err }, 'fatal error');
  process.exit(1);
});
