#!/usr/bin/env bash
set -e

echo ""
echo "==== AI Agent VPS Installer ===="
echo ""

# Node.js (via NodeSource - installs v20)
if ! command -v node &>/dev/null; then
  echo "[1/4] Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
else
  NODE_VER=$(node --version)
  echo "[1/4] Node.js already installed: $NODE_VER"
fi

# pnpm
if ! command -v pnpm &>/dev/null; then
  echo "[2/4] Installing pnpm..."
  npm install -g pnpm@11
else
  PNPM_VER=$(pnpm --version)
  echo "[2/4] pnpm already installed: $PNPM_VER"
fi

# tmux (for keeping bot alive while scanning QR)
if ! command -v tmux &>/dev/null; then
  echo "[3/4] Installing tmux..."
  apt-get install -y tmux
else
  echo "[3/4] tmux already installed"
fi

# PM2 (for production auto-restart)
if ! command -v pm2 &>/dev/null; then
  echo "[4/4] Installing PM2..."
  npm install -g pm2
else
  echo "[4/4] PM2 already installed"
fi

echo ""
echo "==== Installing project dependencies ===="
cd "$(dirname "$0")/.."
pnpm install

echo ""
echo "==== DONE ===="
echo "Next: run 'bash scripts/setup-env.sh' to configure .env"
