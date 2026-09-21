#!/usr/bin/env bash
#
# setup-nginx.sh - configura o Nginx como proxy reverso + (opcional) HTTPS com Certbot.
#
# Fluxo pensado para quem subiu o codigo pelo GitHub:
#   1) git clone https://github.com/SEU_USUARIO/gestor-multi-tenant.git
#   2) sudo bash scripts/install.sh            # pode pular o Nginx aqui
#   3) sudo bash scripts/setup-nginx.sh        # HTTP via IP (server_name _)
#   4) Quando o dominio apontar p/ a VPS:
#      sudo DOMAIN_NAME=painel.seudominio.com ADMIN_EMAIL=voce@email.com \
#           SETUP_SSL=S bash scripts/setup-nginx.sh
#
# Uso:
#   sudo bash scripts/setup-nginx.sh
#   sudo DOMAIN_NAME=painel.seudominio.com bash scripts/setup-nginx.sh
#   sudo DOMAIN_NAME=painel.seudominio.com ADMIN_EMAIL=a@b.com SETUP_SSL=S bash scripts/setup-nginx.sh
#
# Variaveis (todas opcionais):
#   INSTALL_DIR  - onde o app esta instalado            [default: /opt/gestor-multi-tenant]
#   DOMAIN_NAME  - dominio ou "_" para IP/qualquer host [default: pergunta ou "_"]
#   APP_PORT     - porta interna do Node                 [default: lida do INSTALL_DIR/.env]
#   ADMIN_EMAIL  - email p/ o Certbot (aviso de expiracao)[default: pergunta se SETUP_SSL=S]
#   SETUP_SSL    - S para emitir HTTPS com Certbot       [default: N]
#   ASSUME_YES   - 1 pula confirmacoes                   [default: 0]
#
set -euo pipefail

SERVICE_NAME="gestor-multi-tenant"
INSTALL_DIR="${INSTALL_DIR:-/opt/gestor-multi-tenant}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TEMPLATE="$PROJECT_ROOT/deploy/nginx/gestor-multi-tenant.conf"

if [ "$(id -u)" -ne 0 ]; then
  echo "ERRO: rode como root: sudo bash scripts/setup-nginx.sh"
  exit 1
fi

# ---------- helpers ----------
env_get() {
  local file="$1" key="$2" line
  [ -f "$file" ] || return 0
  line="$(grep -m1 "^${key}=" "$file" 2>/dev/null || true)"
  line="${line#*=}"
  line="${line%\"}"; line="${line#\"}"
  printf '%s' "$line"
}
is_ip_or_wildcard() {
  # retorna 0 se for IP, "_" ou vazio (sem dominio real)
  local d="$1"
  [ -z "$d" ] && return 0
  [ "$d" = "_" ] && return 0
  [[ "$d" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] && return 0
  [[ "$d" != *.* ]] && return 0
  return 1
}

# ---------- parametros ----------
ENV_FILE="$INSTALL_DIR/.env"
APP_PORT="${APP_PORT:-$(env_get "$ENV_FILE" PORT)}"
[ -n "$APP_PORT" ] || APP_PORT="3000"

if [ -z "${DOMAIN_NAME:-}" ]; then
  if [ "${ASSUME_YES:-0}" = "1" ] || [ ! -t 0 ]; then
    DOMAIN_NAME="_"
  else
    read -rp "Dominio (ex: painel.seudominio.com) ou ENTER para servir via IP [_]: " DOMAIN_NAME
    DOMAIN_NAME="${DOMAIN_NAME:-_}"
  fi
fi

if [ -z "${SETUP_SSL:-}" ]; then
  if is_ip_or_wildcard "$DOMAIN_NAME"; then
    SETUP_SSL="N"  # Let's Encrypt nao emite para IP puro: pula automaticamente
  elif [ "${ASSUME_YES:-0}" = "1" ] || [ ! -t 0 ]; then
    SETUP_SSL="N"
  else
    read -rp "Emitir HTTPS com Certbot para $DOMAIN_NAME agora? (s/N): " _ans
    _ans="${_ans:-N}"
    [[ "$_ans" =~ ^[sS]$ ]] && SETUP_SSL="S" || SETUP_SSL="N"
  fi
fi

if [[ "$SETUP_SSL" =~ ^[sS]$ ]]; then
  if is_ip_or_wildcard "$DOMAIN_NAME"; then
    echo "AVISO: HTTPS exige dominio real apontando para esta VPS. IP puro nao tem certificado gratuito."
    echo "Configurando apenas HTTP. Quando tiver o dominio, rode:"
    echo "  sudo DOMAIN_NAME=seu.dominio.com ADMIN_EMAIL=voce@email.com SETUP_SSL=S bash scripts/setup-nginx.sh"
    SETUP_SSL="N"
  else
    if [ -z "${ADMIN_EMAIL:-}" ]; then
      ADMIN_EMAIL="$(env_get "$ENV_FILE" ADMIN_EMAIL)"
      if [ "${ASSUME_YES:-0}" != "1" ] && [ -t 0 ] && [ -z "$ADMIN_EMAIL" ]; then
        read -rp "Email para o Certbot (avisos de expiracao) [admin@admin.com]: " ADMIN_EMAIL
        ADMIN_EMAIL="${ADMIN_EMAIL:-admin@admin.com}"
      fi
      [ -n "${ADMIN_EMAIL:-}" ] || ADMIN_EMAIL="admin@admin.com"
    fi
  fi
fi

export DEBIAN_FRONTEND=noninteractive

echo "==> Instalando Nginx (se necessario)..."
apt-get update -y -qq
apt-get install -y -qq nginx curl

echo "==> Gerando vhost /etc/nginx/sites-available/$SERVICE_NAME (dominio: $DOMAIN_NAME, porta app: $APP_PORT)..."
render_template() {
  # Usa o template do repo quando existir (git clone); senao gera inline
  # (caso o script tenha sido copiado sozinho para /opt).
  local domain="$1" port="$2" dest="$3"
  if [ -f "$TEMPLATE" ]; then
    sed -e "s/__DOMAIN__/$domain/g" -e "s/__APP_PORT__/$port/g" "$TEMPLATE" > "$dest"
  else
    cat > "$dest" <<EOF
upstream gestor_app {
    server 127.0.0.1:$port;
    keepalive 32;
}
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name $domain;
    client_max_body_size 55m;
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml application/json application/javascript application/xml+rss image/svg+xml;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    access_log /var/log/nginx/gestor-multi-tenant-access.log;
    error_log /var/log/nginx/gestor-multi-tenant-error.log warn;
    location / {
        proxy_pass http://gestor_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$host;
        proxy_set_header X-Forwarded-Port \$server_port;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 120s;
        proxy_connect_timeout 10s;
        proxy_send_timeout 120s;
    }
    location = /nginx-health {
        access_log off;
        default_type text/plain;
        return 200 'ok';
    }
}
EOF
  fi
}

render_template "$DOMAIN_NAME" "$APP_PORT" "/etc/nginx/sites-available/$SERVICE_NAME"
ln -sf "/etc/nginx/sites-available/$SERVICE_NAME" "/etc/nginx/sites-enabled/$SERVICE_NAME"
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl enable nginx >/dev/null 2>&1 || true
systemctl restart nginx

# ---------- firewall ----------
if command -v ufw >/dev/null 2>&1 && ufw status | grep -q "Status: active"; then
  echo "==> UFW ativo: liberando HTTP/HTTPS..."
  ufw allow "Nginx Full" || ufw allow 80/tcp || true
  ufw allow 443/tcp >/dev/null 2>&1 || true
fi

SERVER_IP="$(curl -s -4 --max-time 5 ifconfig.me || hostname -I | awk '{print $1}')"
if is_ip_or_wildcard "$DOMAIN_NAME"; then
  echo ""
  echo "[OK] Nginx no ar em HTTP: http://$SERVER_IP (porta 80 -> app 127.0.0.1:$APP_PORT)"
else
  echo "[OK] Nginx no ar em HTTP: http://$DOMAIN_NAME (verifique o DNS A apontando para $SERVER_IP)"
fi
echo "Teste local: curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:$APP_PORT/  (app direto)"
echo "Teste proxy: curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1/nginx-health  (via nginx)"

# ---------- SSL ----------
if [[ "$SETUP_SSL" =~ ^[sS]$ ]]; then
  echo "==> Instalando Certbot e emitindo certificado para $DOMAIN_NAME..."
  apt-get install -y -qq certbot python3-certbot-nginx
  if certbot --nginx -d "$DOMAIN_NAME" --non-interactive --agree-tos -m "$ADMIN_EMAIL" --redirect; then
    echo "[OK] HTTPS ativo: https://$DOMAIN_NAME"
    # O Express so liga HSTS/secure-cookie quando COOKIE_SECURE=true.
    if [ -f "$ENV_FILE" ]; then
      cp "$ENV_FILE" "$ENV_FILE.bak-$(date +%Y%m%d-%H%M%S)"
      if grep -q '^COOKIE_SECURE=' "$ENV_FILE"; then
        sed -i 's/^COOKIE_SECURE=.*/COOKIE_SECURE=true/' "$ENV_FILE"
      else
        printf '\nCOOKIE_SECURE=true\n' >> "$ENV_FILE"
      fi
      # APP_BASE_URL alimenta os links de reset de senha por email.
      if grep -q '^APP_BASE_URL=' "$ENV_FILE"; then
        sed -i "s|^APP_BASE_URL=.*|APP_BASE_URL=https://$DOMAIN_NAME|" "$ENV_FILE"
      else
        printf 'APP_BASE_URL=https://%s\n' "$DOMAIN_NAME" >> "$ENV_FILE"
      fi
      chmod 600 "$ENV_FILE"
      systemctl restart "$SERVICE_NAME" || true
      echo "[OK] .env atualizado (COOKIE_SECURE=true, APP_BASE_URL=https://$DOMAIN_NAME) e servico reiniciado."
    fi
    echo "Renovacao automatica: certbot instala um timer systemd; confira com: systemctl list-timers | grep certbot"
  else
    echo "[ATENCAO] Certbot falhou. Causas comuns:"
    echo "  - DNS A de $DOMAIN_NAME ainda nao aponta para $SERVER_IP (propaga em minutos/horas);"
    echo "  - porta 80 fechada no firewall da nuvem (Security Group / Firewall do provedor);"
    echo "  - Nginx fora do ar (systemctl status nginx)."
    echo "Confira o DNS com: nslookup $DOMAIN_NAME"
    echo "E tente de novo com: sudo certbot --nginx -d $DOMAIN_NAME"
    exit 1
  fi
else
  echo ""
  echo "Quando tiver um dominio apontando para $SERVER_IP, ative o HTTPS com UM comando:"
  echo "  sudo DOMAIN_NAME=seu.dominio.com ADMIN_EMAIL=voce@email.com SETUP_SSL=S bash scripts/setup-nginx.sh"
fi
