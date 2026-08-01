#!/usr/bin/env bash
# Inicia o servico (caso esteja parado).
set -e
sudo systemctl start gestor-multi-tenant
sudo systemctl status gestor-multi-tenant --no-pager
