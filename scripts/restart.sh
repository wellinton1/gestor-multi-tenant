#!/usr/bin/env bash
# Reinicia o servico (util depois de editar o .env, por exemplo).
set -e
sudo systemctl restart gestor-multi-tenant
sudo systemctl status gestor-multi-tenant --no-pager
