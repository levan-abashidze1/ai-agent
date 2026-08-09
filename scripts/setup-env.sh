#!/usr/bin/env bash
set -e

# Interactive .env setup — avoids needing to type underscores
# in Hetzner web console. User just pastes values when prompted.

cd "$(dirname "$0")/.."
ENV_FILE=".env"

echo ""
echo "==== .env Setup ===="
echo ""
echo "You'll paste 4 values. Use GUI-Mode + right-click paste in Hetzner console."
echo ""

prompt() {
  local label="$1"
  local var
  read -rp "$label: " var
  echo "$var"
}

SUPABASE_URL=$(prompt "Supabase URL (https://xxx.supabase.co)")
SUPABASE_ANON_KEY=$(prompt "Supabase anon key")
SUPABASE_SERVICE_ROLE_KEY=$(prompt "Supabase service_role key")
DEEPSEEK_API_KEY=$(prompt "DeepSeek API key (sk-...)")

cat > "$ENV_FILE" <<EOF
SUPABASE_URL=$SUPABASE_URL
SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY

DEEPSEEK_API_KEY=$DEEPSEEK_API_KEY
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_BASE_URL=https://api.deepseek.com

BOT_NAME=Agent
GROUP_JID=

NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
EOF

chmod 600 "$ENV_FILE"

echo ""
echo "==== .env written ===="
echo ""
echo "Next: bash scripts/start-bot.sh"
