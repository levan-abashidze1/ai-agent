import { createServer } from 'node:http';
import QRCode from 'qrcode';
import { logger } from '../logger.js';

let latestQr: string | null = null;
let connected = false;

export function setQr(qr: string | null): void {
  latestQr = qr;
}

export function setConnected(v: boolean): void {
  connected = v;
}

export function startQrServer(port = 8080): void {
  const server = createServer(async (req, res) => {
    if (req.url === '/favicon.ico') {
      res.writeHead(204);
      res.end();
      return;
    }

    const html = await renderPage();
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  });

  server.listen(port, '0.0.0.0', () => {
    logger.info(`QR page: http://<VPS-IP>:${port}`);
  });
}

async function renderPage(): Promise<string> {
  let body: string;

  if (connected) {
    body = `
      <div class="card ok">
        <h1>✓ Connected</h1>
        <p>WhatsApp is linked. You can close this page.</p>
      </div>`;
  } else if (latestQr) {
    const dataUrl = await QRCode.toDataURL(latestQr, {
      errorCorrectionLevel: 'M',
      margin: 2,
      scale: 8,
    });
    body = `
      <div class="card">
        <h1>Scan with WhatsApp</h1>
        <img src="${dataUrl}" alt="QR" />
        <p>WhatsApp → Settings → Linked Devices → Link a Device</p>
        <p class="hint">Page auto-refreshes every 3 seconds.</p>
      </div>`;
  } else {
    body = `
      <div class="card">
        <h1>Waiting for QR…</h1>
        <p>Start the bot; refresh in a moment.</p>
      </div>`;
  }

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta http-equiv="refresh" content="3" />
<title>Bot QR</title>
<style>
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
         font-family: -apple-system, system-ui, sans-serif; background:#0f172a; color:#e2e8f0; }
  .card { background:#1e293b; padding:32px; border-radius:16px; text-align:center; max-width:400px; }
  .card.ok { border:2px solid #22c55e; }
  h1 { margin:0 0 16px; font-size:22px; }
  p { margin:8px 0; color:#94a3b8; font-size:14px; }
  img { width:100%; max-width:320px; margin:16px 0; background:#fff; padding:8px; border-radius:8px; }
  .hint { font-size:12px; color:#64748b; }
</style>
</head>
<body>${body}</body>
</html>`;
}
