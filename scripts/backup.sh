#!/usr/bin/env bash
# Faz um backup dos dados (banco de dados JSON + .env) em um arquivo .tar.gz
# com data e hora no nome. Rode como root ou com sudo.
set -euo pipefail

INSTALL_DIR="${1:-/opt/gestor-multi-tenant}"
BACKUP_DIR="${2:-/opt/backups-gestor-multi-tenant}"

if [ ! -d "$INSTALL_DIR" ]; then
  echo "Pasta de instalacao nao encontrada: $INSTALL_DIR"
  echo "Uso: bash backup.sh [pasta_instalacao] [pasta_destino_backup]"
  exit 1
fi

mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
FILE="$BACKUP_DIR/backup-$STAMP.tar.gz"

tar -czf "$FILE" -C "$INSTALL_DIR" data .env

echo "Backup criado em: $FILE"
