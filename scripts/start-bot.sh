#!/usr/bin/env bash
set -e

# Runs bot inside tmux session so you can scan QR then detach (Ctrl+B, D).
# The session survives when you disconnect.

cd "$(dirname "$0")/.."

if tmux has-session -t bot 2>/dev/null; then
  echo "Bot session already running. Attaching..."
  echo "(To detach: press Ctrl+B then D)"
  sleep 2
  tmux attach -t bot
  exit 0
fi

echo "Starting bot in tmux session 'bot'..."
echo "You'll see a QR code — scan it with WhatsApp on your bot phone."
echo "After QR scanned, press Ctrl+B then D to detach (bot keeps running)."
echo ""
sleep 3

tmux new-session -s bot "pnpm bot:start"
