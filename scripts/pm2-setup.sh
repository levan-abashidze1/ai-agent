#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/.."

mkdir -p logs

# stop old process if running
pm2 delete ai-agent-bot 2>/dev/null || true

pm2 start ecosystem.config.cjs
pm2 save

# Enable startup on boot (Ubuntu/systemd)
STARTUP_CMD=$(pm2 startup systemd -u root --hp /root | tail -1)
if [[ "$STARTUP_CMD" == sudo* ]] || [[ "$STARTUP_CMD" == env* ]]; then
  eval "$STARTUP_CMD"
fi

echo ""
echo "==== PM2 setup done ===="
echo ""
echo "Useful commands:"
echo "  pm2 status              — see running processes"
echo "  pm2 logs ai-agent-bot   — tail logs"
echo "  pm2 restart ai-agent-bot"
echo "  pm2 stop ai-agent-bot"
echo ""
pm2 status
