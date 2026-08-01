#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/app"
if [ ! -d "node_modules" ]; then
  echo "Instalando dependências..."
  npm install
fi
echo "Iniciando gestor-multi-tenant..."
npm start
