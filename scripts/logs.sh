#!/usr/bin/env bash
# Mostra os logs do servico em tempo real (Ctrl+C para sair).
sudo journalctl -u gestor-multi-tenant -f
