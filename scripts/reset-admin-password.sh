#!/usr/bin/env bash
#
# reset-admin-password.sh - troca a senha de um usuario direto na VPS, sem SQL manual.
#
# Uso:
#   sudo bash scripts/reset-admin-password.sh                        # interativo (pergunta email + senha)
#   sudo ADMIN_EMAIL=admin@admin.com bash scripts/reset-admin-password.sh
#   sudo ADMIN_EMAIL=admin@admin.com NEW_PASSWORD='SenhaForte123!' bash scripts/reset-admin-password.sh
#   sudo ADMIN_EMAIL=admin@admin.com DISABLE_2FA=S bash scripts/reset-admin-password.sh
#
# Variaveis (todas opcionais):
#   INSTALL_DIR  - onde o app esta instalado      [default: /opt/gestor-multi-tenant]
#   ADMIN_EMAIL  - email do usuario               [default: ADMIN_EMAIL do .env]
#   NEW_PASSWORD - nova senha (12+ caracteres)    [default: pergunta sem eco, 2x]
#   DISABLE_2FA  - S limpa o 2FA do usuario       [default: N]
#   ASSUME_YES   - 1 pula confirmacao final       [default: 0]
#
set -euo pipefail

SERVICE_NAME="gestor-multi-tenant"
INSTALL_DIR="${INSTALL_DIR:-/opt/gestor-multi-tenant}"
ENV_FILE="$INSTALL_DIR/.env"

if [ "$(id -u)" -ne 0 ]; then
  echo "ERRO: rode como root: sudo bash scripts/reset-admin-password.sh"
  exit 1
fi
if [ ! -f "$ENV_FILE" ]; then
  echo "ERRO: .env nao encontrado em $ENV_FILE. Rode scripts/install.sh primeiro."
  exit 1
fi

env_get() {
  local file="$1" key="$2" line
  line="$(grep -m1 "^${key}=" "$file" 2>/dev/null || true)"
  line="${line#*=}"
  line="${line%\"}"; line="${line#\"}"
  printf '%s' "$line"
}

SERVICE_USER="$(stat -c '%U' "$ENV_FILE" 2>/dev/null || echo gestorapp)"
DB_URL="$(env_get "$ENV_FILE" DATABASE_URL)"
DB_NAME="$(printf '%s' "$DB_URL" | sed -n 's|^postgres://[^/]*/\([^?]*\).*|\1|p')"
[ -n "$DB_NAME" ] || DB_NAME="gestor"

# ---------- email ----------
ADMIN_EMAIL="${ADMIN_EMAIL:-$(env_get "$ENV_FILE" ADMIN_EMAIL)}"
if [ -z "${ADMIN_EMAIL:-}" ] && [ "${ASSUME_YES:-0}" != "1" ] && [ -t 0 ]; then
  read -rp "Email do usuario [admin@admin.com]: " ADMIN_EMAIL
  ADMIN_EMAIL="${ADMIN_EMAIL:-admin@admin.com}"
fi
[ -n "${ADMIN_EMAIL:-}" ] || { echo "ERRO: informe o email (ADMIN_EMAIL=...)."; exit 1; }

# ---------- existe? (schema: tabelas id + data JSONB; campos dentro de data) ----------
if ! sudo -u postgres psql -d "$DB_NAME" -tAc "SELECT 1 FROM users WHERE data->>'email'='$ADMIN_EMAIL'" | grep -q 1; then
  echo "ERRO: nenhum usuario com email '$ADMIN_EMAIL' no banco '$DB_NAME'."
  echo "Usuarios admin existentes:"
  sudo -u postgres psql -d "$DB_NAME" -c "SELECT data->>'email' AS email FROM users WHERE data->>'role'='admin';"
  exit 1
fi

# ---------- senha ----------
if [ -z "${NEW_PASSWORD:-}" ]; then
  if [ "${ASSUME_YES:-0}" = "1" ] || [ ! -t 0 ]; then
    echo "ERRO: informe a senha (NEW_PASSWORD='...') no modo nao-interativo."
    exit 1
  fi
  read -s -p "Nova senha (minimo 12 caracteres): " NEW_PASSWORD; echo
  read -s -p "Confirme a nova senha: " NEW_PASSWORD2; echo
  [ "$NEW_PASSWORD" = "$NEW_PASSWORD2" ] || { echo "ERRO: senhas nao conferem."; exit 1; }
  unset NEW_PASSWORD2
fi
if [ "${#NEW_PASSWORD}" -lt 12 ]; then
  echo "ERRO: a senha precisa ter pelo menos 12 caracteres."
  exit 1
fi

if [ "${ASSUME_YES:-0}" != "1" ] && [ -t 0 ]; then
  read -rp "Trocar a senha de '$ADMIN_EMAIL' no banco '$DB_NAME'? (S/n): " CONFIRM
  CONFIRM="${CONFIRM:-S}"
  [[ "$CONFIRM" =~ ^[sS]$ ]] || { echo "Cancelado."; exit 1; }
fi

# ---------- hash bcrypt (mesmo algoritmo do app: bcryptjs, 12 rounds) ----------
# cd: require('bcryptjs') resolve a partir do node_modules da instalacao.
cd "$INSTALL_DIR"
HASH="$(sudo -u "$SERVICE_USER" node -e "console.log(require('bcryptjs').hashSync(process.argv[1], 12))" "$NEW_PASSWORD")"
unset NEW_PASSWORD

# 2FA: se o usuario tem 2FA ativo e perdeu o autenticador, limpa para nao travar o login.
EXTRA_EXPR=""
if [[ "${DISABLE_2FA:-N}" =~ ^[sS]$ ]]; then
  EXTRA_EXPR=" - 'twoFactorSecret' - 'twoFactorBackupCodes' || jsonb_build_object('twoFactorEnabled', false)"
fi

NOW_ISO="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
sudo -u postgres psql -d "$DB_NAME" -v ON_ERROR_STOP=1 -q \
  -c "UPDATE users SET data = ((data - 'passwordHash' - 'passwordChangedAt') || jsonb_build_object('passwordHash', '$HASH', 'passwordChangedAt', '$NOW_ISO')$EXTRA_EXPR) WHERE data->>'email'='$ADMIN_EMAIL';"
unset HASH
sudo -u postgres psql -d "$DB_NAME" -tAc "SELECT data->>'email', data->>'passwordChangedAt' FROM users WHERE data->>'email'='$ADMIN_EMAIL';"

echo ""
echo "[OK] Senha de '$ADMIN_EMAIL' atualizada."
if [[ "${DISABLE_2FA:-N}" =~ ^[sS]$ ]]; then
  echo "[OK] 2FA desativado para '$ADMIN_EMAIL' (ative de novo no painel depois de entrar)."
fi
echo "Nao precisa reiniciar: entre em https://$(env_get "$ENV_FILE" APP_BASE_URL | sed 's|^https\?://||;s|/.*||') com a nova senha."
echo "Dica: troque de novo pelo painel (Configuracoes/Perfil) quando quiser, sem usar este script."
