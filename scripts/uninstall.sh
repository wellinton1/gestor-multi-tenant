#!/usr/bin/env bash
#
# uninstall.sh - remove o servico e, opcionalmente, os arquivos/dados instalados.
# Uso: sudo bash scripts/uninstall.sh [/opt/gestor-multi-tenant]
#
set -euo pipefail

SERVICE_NAME="gestor-multi-tenant"
INSTALL_DIR="${1:-/opt/gestor-multi-tenant}"

if [ "$(id -u)" -ne 0 ]; then
  echo "Rode como root: sudo bash scripts/uninstall.sh"
  exit 1
fi

echo "Isso vai parar e remover o servico '$SERVICE_NAME'."
read -rp "Continuar? (s/N): " CONFIRM
if [[ ! "$CONFIRM" =~ ^[sS]$ ]]; then
  echo "Cancelado."
  exit 0
fi

systemctl stop "$SERVICE_NAME" 2>/dev/null || true
systemctl disable "$SERVICE_NAME" 2>/dev/null || true
rm -f "/etc/systemd/system/$SERVICE_NAME.service"
systemctl daemon-reload

echo "Servico removido."

if [ -d "$INSTALL_DIR" ]; then
  read -rp "Tambem apagar a pasta de instalacao e TODOS os dados em $INSTALL_DIR? (s/N): " DELETE_DATA
  if [[ "$DELETE_DATA" =~ ^[sS]$ ]]; then
    read -rp "Fazer um backup antes de apagar? (S/n): " DO_BACKUP
    DO_BACKUP="${DO_BACKUP:-S}"
    if [[ "$DO_BACKUP" =~ ^[sS]$ ]]; then
      SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
      bash "$SCRIPT_DIR/backup.sh" "$INSTALL_DIR" "/opt/backups-gestor-multi-tenant" || true
    fi
    rm -rf "$INSTALL_DIR"
    echo "Pasta $INSTALL_DIR removida."
  else
    echo "Pasta $INSTALL_DIR mantida (dados preservados)."
  fi
fi

echo "Desinstalacao concluida."
