#!/usr/bin/env bash
#
# update.sh - atualiza a aplicacao ja instalada com uma versao mais nova,
# preservando os dados (PostgreSQL + data/) e as configuracoes (.env).
#
# Uso: rode este script de dentro da pasta extraida da NOVA versao do zip:
#   sudo bash scripts/update.sh [/opt/gestor-multi-tenant]
#
set -euo pipefail

SERVICE_NAME="gestor-multi-tenant"
INSTALL_DIR="${1:-/opt/gestor-multi-tenant}"

if [ "$(id -u)" -ne 0 ]; then
  echo "Rode como root: sudo bash scripts/update.sh"
  exit 1
fi

if [ ! -d "$INSTALL_DIR" ]; then
  echo "Instalacao nao encontrada em $INSTALL_DIR. Rode install.sh primeiro."
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SOURCE_APP_DIR="$PROJECT_ROOT/app"

# Le uma chave do .env sem carregar nada no shell.
env_get() {
  local file="$1" key="$2" line
  [ -f "$file" ] || return 0
  line="$(grep -m1 "^${key}=" "$file" 2>/dev/null || true)"
  line="${line#*=}"
  line="${line%\"}"; line="${line#\"}"
  printf '%s' "$line"
}

rand_alnum() {
  head -c 1024 /dev/urandom | tr -dc 'A-Za-z0-9' | head -c "$1"
}

# ---------- 0. auto-reparo do .env (restore de backup do Windows por engano) ----------
# O backup do painel inclui o .env. Restaurar na VPS um .zip criado no Windows
# sobrescreve o .env com PG_BIN/PGDATA de C:\... e senha de banco errada, o que
# derruba o servico e quebra o pg_dump. Detecta e conserta sozinho.
repair_windows_env() {
  local env_file="$INSTALL_DIR/.env"
  [ -f "$env_file" ] || return 0
  if ! grep -Eq '^(PG_BIN|PGDATA|PG_LOG)=.*(\\|[Cc]:)' "$env_file"; then
    return 0
  fi
  echo "AVISO: o .env instalado contem caminhos do Windows (PG_BIN/PGDATA)."
  echo "Isso acontece ao restaurar na VPS um backup criado no Windows."
  echo "Recuperando o .env original da VPS automaticamente..."
  cp "$env_file" "$env_file.broken-$(date +%Y%m%d-%H%M%S)"

  # 1) Melhor fonte: backup pre-restore criado antes do restore errado.
  local latest_pre
  latest_pre="$(ls -t "$INSTALL_DIR/data/backups"/backup-pre-restore-*.zip 2>/dev/null | head -n 1 || true)"
  if [ -n "$latest_pre" ]; then
    echo "Restaurando .env do backup: $(basename "$latest_pre")"
    if unzip -p "$latest_pre" .env > "$env_file.tmp" 2>/dev/null \
      && grep -q '^DATABASE_URL=postgres://' "$env_file.tmp" \
      && ! grep -Eq '^(PG_BIN|PGDATA|PG_LOG)=.*(\\|[Cc]:)' "$env_file.tmp"; then
      mv "$env_file.tmp" "$env_file"
      echo ".env recuperado do pre-restore com sucesso."
      return 0
    fi
    rm -f "$env_file.tmp"
    echo "O pre-restore nao tinha um .env valido; reconstruindo..."
  else
    echo "Nenhum backup pre-restore encontrado; reconstruindo o .env..."
  fi

  # 2) Reconstrucao: mantem porta/segredos/admin, remove vars do Windows,
  #    gera nova senha do banco e aplica no PostgreSQL.
  local app_port session_secret admin_email admin_password admin_name
  local db_user db_name db_password broken_url
  app_port="$(env_get "$env_file" PORT)";            [ -n "$app_port" ] || app_port="3000"
  session_secret="$(env_get "$env_file" SESSION_SECRET)"
  if [ -z "$session_secret" ] || [ "$session_secret" = "troque-este-valor-para-um-texto-aleatorio-longo" ]; then
    session_secret="$(rand_alnum 64)"
  fi
  admin_email="$(env_get "$env_file" ADMIN_EMAIL)";  [ -n "$admin_email" ] || admin_email="admin@admin.com"
  admin_password="$(env_get "$env_file" ADMIN_PASSWORD)"
  admin_name="$(env_get "$env_file" ADMIN_NAME)";    [ -n "$admin_name" ] || admin_name="Administrador"
  broken_url="$(env_get "$env_file" DATABASE_URL)"
  db_user="$(printf '%s' "$broken_url" | sed -n 's|^postgres://\([^:/]*\).*|\1|p')"
  db_name="$(printf '%s' "$broken_url" | sed -n 's|^postgres://[^/]*/\([^?]*\).*|\1|p')"
  [ -n "$db_user" ] || db_user="gestor"
  [ -n "$db_name" ] || db_name="gestor"
  db_password="$(rand_alnum 24)"

  echo "Redefinindo senha do usuario '$db_user' no PostgreSQL..."
  if [ "$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$db_user'")" = "1" ]; then
    sudo -u postgres psql -v ON_ERROR_STOP=1 -q -c "ALTER ROLE \"$db_user\" WITH LOGIN PASSWORD '$db_password';"
  else
    sudo -u postgres psql -v ON_ERROR_STOP=1 -q -c "CREATE ROLE \"$db_user\" WITH LOGIN PASSWORD '$db_password';"
  fi
  if [ "$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$db_name'")" != "1" ]; then
    sudo -u postgres createdb -O "$db_user" "$db_name"
  fi

  cat > "$env_file" <<EOF
NODE_ENV=production
PORT=$app_port
DATABASE_URL=postgres://$db_user:$db_password@127.0.0.1:5432/$db_name
SESSION_SECRET=$session_secret
ADMIN_EMAIL=$admin_email
ADMIN_PASSWORD=$admin_password
ADMIN_NAME=$admin_name
SEED_DEMO_DATA=false
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax
BACKUP_AUTO_ENABLED=true
BACKUP_INTERVAL_HOURS=6
BACKUP_MAX_FILES=30
RLS_ENABLED=true
EOF
  echo ".env reconstruido para a VPS (senha do banco atualizada)."
}

# Garante CREATEDB ao usuario do app (bancos dedicados por tenant em 1 clique).
ensure_createdb() {
  local env_file="$INSTALL_DIR/.env" db_url_user
  db_url_user="$(env_get "$env_file" DATABASE_URL | sed -n 's|^postgres://\([^:/]*\).*|\1|p')"
  if [ -n "$db_url_user" ]; then
    sudo -u postgres psql -q -c "ALTER ROLE \"$db_url_user\" WITH CREATEDB;" 2>/dev/null \
      && echo "Permissao CREATEDB garantida ao usuario '$db_url_user'." \
      || echo "AVISO: nao foi possivel conceder CREATEDB a '$db_url_user'."
  fi
}

if ! command -v unzip >/dev/null 2>&1; then
  echo "Instalando unzip..."
  apt-get update -y && apt-get install -y unzip
fi

repair_windows_env

SERVICE_USER="$(stat -c '%U' "$INSTALL_DIR/.env" 2>/dev/null || echo gestorapp)"
chmod 600 "$INSTALL_DIR/.env" 2>/dev/null || true
chown "$SERVICE_USER":"$SERVICE_USER" "$INSTALL_DIR/.env" 2>/dev/null || true
ensure_createdb

echo "Fazendo backup rapido antes de atualizar..."
bash "$SCRIPT_DIR/backup.sh" "$INSTALL_DIR" "/opt/backups-gestor-multi-tenant" || true

echo "Parando o servico..."
systemctl stop "$SERVICE_NAME" || true

if ! command -v rsync >/dev/null 2>&1; then
  echo "Instalando rsync..."
  apt-get update -y && apt-get install -y rsync
fi

echo "Copiando novos arquivos (preservando data/ e .env)..."
# Importante: '/data' com barra inicial e ancorado na raiz, senao o rsync
# tambem excluiria src/data (mesmo bug do .gitignore que ja quebrou o app).
rsync -a --exclude '/data' --exclude '/.env' --exclude 'node_modules' "$SOURCE_APP_DIR"/ "$INSTALL_DIR"/

chown -R "$SERVICE_USER":"$SERVICE_USER" "$INSTALL_DIR"

echo "Instalando dependencias..."
cd "$INSTALL_DIR"
sudo -u "$SERVICE_USER" npm install --omit=dev --no-audit --no-fund

echo "Reiniciando o servico..."
systemctl start "$SERVICE_NAME"
sleep 2
systemctl status "$SERVICE_NAME" --no-pager

echo "Atualizacao concluida."
