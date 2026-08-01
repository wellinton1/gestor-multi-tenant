#!/usr/bin/env bash
#
# update.sh - atualiza a aplicacao ja instalada com uma versao mais nova,
# preservando os dados (data/db.json) e as configuracoes (.env).
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
SERVICE_USER="$(stat -c '%U' "$INSTALL_DIR/.env" 2>/dev/null || echo gestorapp)"

echo "Fazendo backup rapido antes de atualizar..."
bash "$SCRIPT_DIR/backup.sh" "$INSTALL_DIR" "/opt/backups-gestor-multi-tenant" || true

echo "Parando o servico..."
systemctl stop "$SERVICE_NAME" || true

if ! command -v rsync >/dev/null 2>&1; then
  echo "Instalando rsync..."
  apt-get update -y && apt-get install -y rsync
fi

echo "Copiando novos arquivos (preservando data/ e .env)..."
rsync -a --exclude 'data' --exclude '.env' --exclude 'node_modules' "$SOURCE_APP_DIR"/ "$INSTALL_DIR"/

chown -R "$SERVICE_USER":"$SERVICE_USER" "$INSTALL_DIR"

echo "Instalando dependencias..."
cd "$INSTALL_DIR"
sudo -u "$SERVICE_USER" npm install --omit=dev --no-audit --no-fund

echo "Reiniciando o servico..."
systemctl start "$SERVICE_NAME"
sleep 2
systemctl status "$SERVICE_NAME" --no-pager

echo "Atualizacao concluida."
