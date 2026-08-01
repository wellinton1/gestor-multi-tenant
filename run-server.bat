@echo off
setlocal
cd /d "%~dp0\app"
if exist node_modules (
  echo Iniciando gestor-multi-tenant...
) else (
  echo Instalando dependencias...
  npm install
)
npm start
