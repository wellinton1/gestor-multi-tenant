#!/usr/bin/env bash
#
# install.sh - instala o painel de gestao multi-tenant em uma VPS Ubuntu/Debian.
#
# O que este script faz:
#   1. Verifica se esta rodando como root (necessario para instalar pacotes e o
#      servico systemd).
#   2. Instala o Node.js (via NodeSource) se ainda nao estiver instalado.
#   3. Copia a aplicacao para a pasta de instalacao (padrao: /opt/gestor-multi-tenant).
#   4. Roda "npm install" (somente pacotes 100% em JavaScript, sem compilacao nativa).
#   5. Cria o arquivo .env com as credenciais do administrador.
#   6. Cria e ativa um servico systemd para a aplicacao (reinicia sozinha se cair
#      ou se a VPS reiniciar).
#   7. Opcionalmente configura o Nginx como proxy reverso + HTTPS com Certbot.
#
# Uso:
#   sudo bash scripts/install.sh
#
set -euo pipefail

# ---------- cores para deixar a saida mais legivel ----------
c_reset='\033[0m'; c_bold='\033[1m'; c_green='\033[0;32m'; c_yellow='\033[0;33m'; c_red='\033[0;31m'; c_blue='\033[0;34m'
info()  { echo -e "${c_blue}==>${c_reset} $1"; }
ok()    { echo -e "${c_green}[OK]${c_reset} $1"; }
warn()  { echo -e "${c_yellow}[ATENCAO]${c_reset} $1"; }
fail()  { echo -e "${c_red}[ERRO]${c_reset} $1"; exit 1; }

trap 'fail "A instalacao parou por causa de um erro na linha $LINENO. Nenhuma alteracao adicional foi feita."' ERR

# ---------- precisa ser root ----------
if [ "$(id -u)" -ne 0 ]; then
  fail "Rode este script como root, por exemplo: sudo bash scripts/install.sh"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SOURCE_APP_DIR="$PROJECT_ROOT/app"

if [ ! -f "$SOURCE_APP_DIR/package.json" ]; then
  fail "Nao encontrei a pasta 'app' com a aplicacao ao lado de 'scripts'. Rode o script de dentro da pasta extraida do zip."
fi

echo ""
echo -e "${c_bold}=== Instalador - Painel de Gestao Multi-Tenant ===${c_reset}"
echo ""

# ---------- perguntas ----------
read -rp "Pasta de instalacao [/opt/gestor-multi-tenant]: " INSTALL_DIR
INSTALL_DIR="${INSTALL_DIR:-/opt/gestor-multi-tenant}"

read -rp "Porta que o Node vai usar internamente [3000]: " APP_PORT
APP_PORT="${APP_PORT:-3000}"

read -rp "Nome de usuario do sistema para rodar o servico [gestorapp]: " SERVICE_USER
SERVICE_USER="${SERVICE_USER:-gestorapp}"

read -rp "Email do administrador [admin@admin.com]: " ADMIN_EMAIL
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@admin.com}"

ADMIN_PASSWORD=""
read -rp "Senha do administrador (deixe em branco para gerar uma automaticamente): " ADMIN_PASSWORD
if [ -z "$ADMIN_PASSWORD" ]; then
  ADMIN_PASSWORD="$(tr -dc 'A-Za-z0-9' </dev/urandom | head -c 14)"
  GENERATED_PASSWORD=true
else
  GENERATED_PASSWORD=false
fi

SESSION_SECRET="$(tr -dc 'A-Za-z0-9' </dev/urandom | head -c 48)"

echo ""
read -rp "Configurar Nginx como proxy reverso com dominio proprio agora? (s/N): " SETUP_NGINX
SETUP_NGINX="${SETUP_NGINX:-N}"
DOMAIN_NAME=""
SETUP_SSL="N"
if [[ "$SETUP_NGINX" =~ ^[sS]$ ]]; then
  read -rp "Dominio que vai apontar para esta VPS (ex: painel.seudominio.com.br): " DOMAIN_NAME
  if [ -z "$DOMAIN_NAME" ]; then
    warn "Nenhum dominio informado, pulando configuracao do Nginx."
    SETUP_NGINX="N"
  else
    read -rp "Tentar emitir certificado HTTPS gratis com Certbot para este dominio agora? (s/N): " SETUP_SSL
    SETUP_SSL="${SETUP_SSL:-N}"
  fi
fi

echo ""
info "Resumo da instalacao:"
echo "  Pasta de instalacao : $INSTALL_DIR"
echo "  Porta interna       : $APP_PORT"
echo "  Usuario do servico  : $SERVICE_USER"
echo "  Email admin         : $ADMIN_EMAIL"
if [ "$GENERATED_PASSWORD" = true ]; then
  echo "  Senha admin         : $ADMIN_PASSWORD  (gerada automaticamente - anote agora!)"
else
  echo "  Senha admin         : (a que voce digitou)"
fi
if [[ "$SETUP_NGINX" =~ ^[sS]$ ]]; then
  echo "  Nginx + dominio     : $DOMAIN_NAME"
fi
echo ""
read -rp "Confirma e continua a instalacao? (S/n): " CONFIRM
CONFIRM="${CONFIRM:-S}"
if [[ ! "$CONFIRM" =~ ^[sS]$ ]]; then
  fail "Instalacao cancelada pelo usuario."
fi

# ---------- 1. Node.js ----------
info "Verificando Node.js..."
NEED_NODE_INSTALL=true
if command -v node >/dev/null 2>&1; then
  NODE_MAJOR="$(node -v | sed -E 's/^v([0-9]+).*/\1/')"
  if [ "$NODE_MAJOR" -ge 16 ]; then
    ok "Node.js $(node -v) ja instalado."
    NEED_NODE_INSTALL=false
  else
    warn "Node.js $(node -v) encontrado, mas precisa ser 16 ou superior. Vou instalar uma versao mais nova."
  fi
fi

if [ "$NEED_NODE_INSTALL" = true ]; then
  info "Instalando Node.js 20.x (via NodeSource)..."
  apt-get update -y
  apt-get install -y ca-certificates curl gnupg
  mkdir -p /etc/apt/keyrings
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" > /etc/apt/sources.list.d/nodesource.list
  apt-get update -y
  apt-get install -y nodejs
  ok "Node.js $(node -v) instalado."
fi

# ---------- 2. usuario de sistema ----------
if ! id "$SERVICE_USER" >/dev/null 2>&1; then
  info "Criando usuario de sistema '$SERVICE_USER' (sem acesso a shell/login)..."
  useradd --system --create-home --shell /usr/sbin/nologin "$SERVICE_USER"
  ok "Usuario '$SERVICE_USER' criado."
else
  ok "Usuario '$SERVICE_USER' ja existe."
fi

# ---------- 3. copiar arquivos ----------
info "Copiando arquivos da aplicacao para $INSTALL_DIR ..."
mkdir -p "$INSTALL_DIR"
cp -r "$SOURCE_APP_DIR"/. "$INSTALL_DIR"/
mkdir -p "$INSTALL_DIR/data"
ok "Arquivos copiados."

# ---------- 4. .env ----------
info "Gerando arquivo .env ..."
cat > "$INSTALL_DIR/.env" <<EOF
PORT=$APP_PORT
SESSION_SECRET=$SESSION_SECRET
ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_PASSWORD=$ADMIN_PASSWORD
ADMIN_NAME=Administrador
SEED_DEMO_DATA=true
COOKIE_SECURE=false
EOF
ok ".env criado em $INSTALL_DIR/.env"

# ---------- 5. permissoes ----------
chown -R "$SERVICE_USER":"$SERVICE_USER" "$INSTALL_DIR"
chmod 600 "$INSTALL_DIR/.env"

# ---------- 6. npm install ----------
info "Instalando dependencias com npm (isso pode levar um minuto)..."
cd "$INSTALL_DIR"
sudo -u "$SERVICE_USER" npm install --omit=dev --no-audit --no-fund
ok "Dependencias instaladas."

# ---------- 7. systemd service ----------
SERVICE_NAME="gestor-multi-tenant"
info "Criando servico systemd '$SERVICE_NAME'..."
cat > "/etc/systemd/system/$SERVICE_NAME.service" <<EOF
[Unit]
Description=Painel de Gestao Multi-Tenant (Node.js)
After=network.target

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$INSTALL_DIR
EnvironmentFile=$INSTALL_DIR/.env
ExecStart=$(command -v node) $INSTALL_DIR/server.js
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable "$SERVICE_NAME"
systemctl restart "$SERVICE_NAME"
sleep 2

if systemctl is-active --quiet "$SERVICE_NAME"; then
  ok "Servico '$SERVICE_NAME' rodando."
else
  fail "O servico nao iniciou. Veja os logs com: journalctl -u $SERVICE_NAME -n 50 --no-pager"
fi

# ---------- 8. firewall (ufw), se existir ----------
if command -v ufw >/dev/null 2>&1 && ufw status | grep -q "Status: active"; then
  info "UFW detectado e ativo. Liberando a porta $APP_PORT..."
  ufw allow "$APP_PORT"/tcp || true
fi

# ---------- 9. Nginx opcional ----------
if [[ "$SETUP_NGINX" =~ ^[sS]$ ]]; then
  info "Instalando e configurando Nginx..."
  apt-get install -y nginx
  cat > "/etc/nginx/sites-available/$SERVICE_NAME" <<EOF
server {
    listen 80;
    server_name $DOMAIN_NAME;

    location / {
        proxy_pass http://127.0.0.1:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
  ln -sf "/etc/nginx/sites-available/$SERVICE_NAME" "/etc/nginx/sites-enabled/$SERVICE_NAME"
  nginx -t && systemctl restart nginx
  ok "Nginx configurado para o dominio $DOMAIN_NAME (porta 80)."

  if command -v ufw >/dev/null 2>&1 && ufw status | grep -q "Status: active"; then
    ufw allow "Nginx Full" || true
  fi

  if [[ "$SETUP_SSL" =~ ^[sS]$ ]]; then
    info "Instalando Certbot e emitindo certificado HTTPS..."
    apt-get install -y certbot python3-certbot-nginx
    if certbot --nginx -d "$DOMAIN_NAME" --non-interactive --agree-tos -m "$ADMIN_EMAIL" --redirect; then
      ok "HTTPS configurado para https://$DOMAIN_NAME"
    else
      warn "Nao foi possivel emitir o certificado automaticamente. Confira se o dominio ja aponta para o IP desta VPS e tente depois com: certbot --nginx -d $DOMAIN_NAME"
    fi
    sed -i "s/COOKIE_SECURE=false/COOKIE_SECURE=true/" "$INSTALL_DIR/.env"
    systemctl restart "$SERVICE_NAME"
  fi
fi

# ---------- resumo final ----------
SERVER_IP="$(curl -s -4 ifconfig.me || hostname -I | awk '{print $1}')"
echo ""
echo -e "${c_bold}${c_green}=== Instalacao concluida! ===${c_reset}"
echo ""
if [[ "$SETUP_NGINX" =~ ^[sS]$ ]]; then
  if [[ "$SETUP_SSL" =~ ^[sS]$ ]]; then
    echo "  Acesse em: https://$DOMAIN_NAME"
  else
    echo "  Acesse em: http://$DOMAIN_NAME"
  fi
else
  echo "  Acesse em: http://$SERVER_IP:$APP_PORT"
fi
echo ""
echo "  Email do administrador : $ADMIN_EMAIL"
echo "  Senha do administrador : $ADMIN_PASSWORD"
echo ""
echo "  Guarde essas credenciais em um lugar seguro."
echo "  Elas tambem ficam salvas em: $INSTALL_DIR/.env"
echo ""
echo "  Comandos uteis:"
echo "    systemctl status $SERVICE_NAME     # ver status"
echo "    systemctl restart $SERVICE_NAME    # reiniciar"
echo "    journalctl -u $SERVICE_NAME -f     # ver logs em tempo real"
echo ""
