@echo off
title Gestor Multi-Tenant
color 0A

echo ========================================
echo   Iniciando Gestor Multi-Tenant
echo ========================================
echo.

echo Parando processos Node existentes...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq Gestor*" >nul 2>&1
taskkill /F /IM node.exe /FI "WINDOWTITLE eq node*" >nul 2>&1
timeout /t 2 /nobreak >nul

cd /d "%~dp0app"

if not exist "node_modules" (
    echo Instalando dependencias...
    call npm install
    echo.
)

echo Iniciando servidor...
echo.
node server.js

pause
