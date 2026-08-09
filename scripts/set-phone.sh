#!/usr/bin/env bash
set -e

# Usage: bash scripts/set-phone.sh 995511553463
# Adds or updates BOT_PHONE in .env

PHONE="$1"
if [ -z "$PHONE" ]; then
  echo "Usage: bash scripts/set-phone.sh <phone-without-plus>"
  echo "Example: bash scripts/set-phone.sh 995511553463"
  exit 1
fi

cd "$(dirname "$0")/.."

if grep -q '^BOT_PHONE=' .env 2>/dev/null; then
  sed -i "s|^BOT_PHONE=.*|BOT_PHONE=$PHONE|" .env
  echo "Updated BOT_PHONE in .env"
else
  echo "BOT_PHONE=$PHONE" >> .env
  echo "Added BOT_PHONE to .env"
fi

grep '^BOT_PHONE=' .env
