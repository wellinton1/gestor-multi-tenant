#!/usr/bin/env bash
# Faz um backup completo da instalacao:
#   - dump do banco PostgreSQL (pg_dump, formato SQL)
#   - pasta data/ (backups internos, sessoes, arquivos enviados)
#   - arquivo .env (configuracoes e credenciais)
# Tudo em um unico .tar.gz com data e hora no nome.
# Rode como root ou com sudo.
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
STAGING="$(mktemp -d)"
trap 'rm -rf "$STAGING"' EXIT

# ---- dump do PostgreSQL ----
DB_URL=""
if [ -f "$INSTALL_DIR/.env" ]; then
  DB_URL="$(grep -m1 '^DATABASE_URL=' "$INSTALL_DIR/.env" 2>/dev/null | cut -d= -f2- | tr -d '"' | tr -d "'" || true)"
fi

DUMP_OK=false
if [ -n "$DB_URL" ] && command -v pg_dump >/dev/null 2>&1; then
  echo "Gerando dump do PostgreSQL..."
  if pg_dump --no-owner --no-privileges "$DB_URL" > "$STAGING/database.sql"; then
    DUMP_OK=true
    echo "Dump do banco gerado ($(du -h "$STAGING/database.sql" | cut -f1))."
  else
    echo "ATENCAO: pg_dump falhou (o banco esta rodando? a DATABASE_URL esta correta?)."
    echo "O backup vai continuar apenas com os arquivos."
  fi
elif [ -z "$DB_URL" ]; then
  echo "ATENCAO: DATABASE_URL nao encontrada em $INSTALL_DIR/.env - backup apenas dos arquivos."
else
  echo "ATENCAO: pg_dump nao instalado - backup apenas dos arquivos."
  echo "Instale com: sudo apt install postgresql-client"
fi

# ---- arquivos + dump ----
if [ -d "$INSTALL_DIR/data" ] || [ -f "$INSTALL_DIR/.env" ]; then
  if [ "$DUMP_OK" = true ]; then
    tar -czf "$FILE" -C "$INSTALL_DIR" data .env -C "$STAGING" database.sql
  else
    tar -czf "$FILE" -C "$INSTALL_DIR" data .env
  fi
else
  echo "Nada para copiar em $INSTALL_DIR (nem data/ nem .env)."
  exit 1
fi

echo "Backup criado em: $FILE"
