#!/usr/bin/env bash
#
# install.sh - instala o painel de gestao multi-tenant em uma VPS Ubuntu/Debian.
# Testado em Ubuntu 22.04, 24.04 e 26.04 LTS.
#
# O que este script faz:
#   1. Verifica se esta rodando como root (necessario para instalar pacotes e o
#      servico systemd).
#   2. Instala o Node.js (via NodeSource) se ainda nao estiver instalado.
#   3. Instala o PostgreSQL do sistema e cria usuario/banco da aplicacao
#      (idempotente: pode rodar de novo sem perder dados).
#   4. Copia a aplicacao para a pasta de instalacao (padrao: /opt/gestor-multi-tenant).
#   5. Roda "npm install" (somente pacotes 100% em JavaScript, sem compilacao nativa).
#   6. Cria o arquivo .env com DATABASE_URL, segredos e credenciais do administrador.
#   7. Cria e ativa um servico systemd para a aplicacao (reinicia sozinha se cair
#      ou se a VPS reiniciar).
#   8. Opcionalmente configura o Nginx como proxy reverso + HTTPS com Certbot.
#
# Uso interativo:
#   sudo bash scripts/install.sh
#
# Uso nao-interativo (ex.: user-data de uma instancia AWS EC2):
#   sudo ASSUME_YES=1 \
#        ADMIN_EMAIL=admin@seudominio.com APP_PORT=3000 \
#        DOMAIN_NAME=painel.seudominio.com SETUP_NGINX=S SETUP_SSL=S \
#        bash scripts/install.sh
#
# Variaveis aceitas (todas opcionais):
#   INSTALL_DIR, APP_PORT, SERVICE_USER, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME,
#   DB_NAME, DB_USER, DB_PASSWORD, SETUP_NGINX, DOMAIN_NAME, SETUP_SSL, ASSUME_YES
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
  fail "Nao encontrei a pasta 'app' com a aplicacao ao lado de 'scripts'. Rode o script de dentro da pasta do projeto (git clone ou zip extraido)."
fi

# ---------- helpers de pergunta (respeitam variaveis de ambiente) ----------
prompt_var() {
  local name="$1" question="$2" default="$3" answer
  if [ -n "${!name:-}" ]; then return; fi
  if [ "${ASSUME_YES:-0}" = "1" ] || [ ! -t 0 ]; then printf -v "$name" '%s' "$default"; return; fi
  read -rp "$question" answer
  printf -v "$name" '%s' "${answer:-$default}"
}

prompt_yn() {
  local name="$1" question="$2" default="$3" answer
  if [ -n "${!name:-}" ]; then return; fi
  if [ "${ASSUME_YES:-0}" = "1" ] || [ ! -t 0 ]; then printf -v "$name" '%s' "$default"; return; fi
  read -rp "$question" answer
  answer="${answer:-$default}"
  if [[ "$answer" =~ ^[sS]$ ]]; then printf -v "$name" '%s' "S"; else printf -v "$name" '%s' "N"; fi
}

# Le uma chave do .env existente (se houver), sem carregar valores no shell.
env_get() {
  local file="$1" key="$2" line
  [ -f "$file" ] || return 0
  line="$(grep -m1 "^${key}=" "$file" 2>/dev/null || true)"
  line="${line#*=}"
  line="${line%\"}"; line="${line#\"}"
  printf '%s' "$line"
}

# ---------- sistema operacional ----------
if [ -f /etc/os-release ]; then
  # shellcheck disable=SC1091
  . /etc/os-release
  DISTRO_ID="${ID:-desconhecido}"
  DISTRO_VER="${VERSION_ID:-}"
else
  DISTRO_ID="desconhecido"; DISTRO_VER=""
fi
if [ "$DISTRO_ID" != "ubuntu" ] && [ "$DISTRO_ID" != "debian" ]; then
  warn "Distribuicao '$DISTRO_ID' nao e Ubuntu/Debian. O script vai continuar, mas pode falhar."
fi

echo ""
echo -e "${c_bold}=== Instalador - Painel de Gestao Multi-Tenant ===${c_reset}"
echo "       Sistema detectado: $DISTRO_ID $DISTRO_VER"
echo ""

# ---------- perguntas ----------
prompt_var INSTALL_DIR "Pasta de instalacao [/opt/gestor-multi-tenant]: " "/opt/gestor-multi-tenant"
prompt_var APP_PORT    "Porta que o Node vai usar internamente [3000]: " "3000"
prompt_var SERVICE_USER "Nome de usuario do sistema para rodar o servico [gestorapp]: " "gestorapp"
prompt_var ADMIN_EMAIL "Email do administrador [admin@admin.com]: " "admin@admin.com"
prompt_var ADMIN_NAME  "Nome do administrador [Administrador]: " "Administrador"

ADMIN_PASSWORD="${ADMIN_PASSWORD:-$(env_get "$INSTALL_DIR/.env" ADMIN_PASSWORD)}"
ADMIN_PASSWORD_FROM_ENV=false
if [ -n "$ADMIN_PASSWORD" ]; then
  ADMIN_PASSWORD_FROM_ENV=true
fi
if [ "$ADMIN_PASSWORD_FROM_ENV" = false ]; then
  prompt_var ADMIN_PASSWORD "Senha do administrador (deixe em branco para gerar uma automaticamente): " ""
  GENERATED_PASSWORD=false
  if [ -z "$ADMIN_PASSWORD" ]; then
    # head -c 1024 antes do tr evita SIGPIPE (com pipefail o script abortaria).
    ADMIN_PASSWORD="$(head -c 1024 /dev/urandom | tr -dc 'A-Za-z0-9' | head -c 14)"
    GENERATED_PASSWORD=true
  fi
else
  GENERATED_PASSWORD=false
fi
if [ "${#ADMIN_PASSWORD}" -lt 12 ]; then
  fail "A senha do administrador precisa ter pelo menos 12 caracteres em producao (o servidor recusa iniciar com menos)."
fi

# Banco de dados (valores so usados na primeira instalacao; depois o .env manda)
DB_USER="${DB_USER:-gestor}"
DB_NAME="${DB_NAME:-gestor}"
DB_PASSWORD="${DB_PASSWORD:-$(env_get "$INSTALL_DIR/.env" DB_PASSWORD)}"
if [ -z "$DB_PASSWORD" ]; then
  DB_PASSWORD="$(head -c 1024 /dev/urandom | tr -dc 'A-Za-z0-9' | head -c 24)"
fi
if [[ ! "$DB_USER" =~ ^[A-Za-z0-9_]+$ ]] || [[ ! "$DB_NAME" =~ ^[A-Za-z0-9_]+$ ]]; then
  fail "DB_USER e DB_NAME devem conter apenas letras, numeros e _ (underscore)."
fi
if [[ ! "$DB_PASSWORD" =~ ^[A-Za-z0-9_-]+$ ]]; then
  fail "DB_PASSWORD deve conter apenas letras, numeros, _ e - (para nao quebrar a DATABASE_URL)."
fi

# Sessao: reaproveita o segredo de uma instalacao anterior para nao deslogar todos.
SESSION_SECRET="$(env_get "$INSTALL_DIR/.env" SESSION_SECRET)"
if [ -z "$SESSION_SECRET" ] || [ "$SESSION_SECRET" = "troque-este-valor-para-um-texto-aleatorio-longo" ]; then
  SESSION_SECRET="$(head -c 1024 /dev/urandom | tr -dc 'A-Za-z0-9' | head -c 64)"
fi

prompt_yn SETUP_NGINX "Configurar Nginx como proxy reverso com dominio proprio agora? (s/N): " "N"
DOMAIN_NAME="${DOMAIN_NAME:-}"
if [[ "$SETUP_NGINX" =~ ^[sS]$ ]]; then
  prompt_var DOMAIN_NAME "Dominio que vai apontar para esta VPS (ex: painel.seudominio.com.br): " ""
  if [ -z "$DOMAIN_NAME" ]; then
    warn "Nenhum dominio informado, pulando configuracao do Nginx."
    SETUP_NGINX="N"
  else
    prompt_yn SETUP_SSL "Tentar emitir certificado HTTPS gratis com Certbot para este dominio agora? (s/N): " "N"
  fi
fi

if [ "${ASSUME_YES:-0}" != "1" ] && [ -t 0 ]; then
  echo ""
  info "Resumo da instalacao:"
  echo "  Sistema operacional : $DISTRO_ID $DISTRO_VER"
  echo "  Pasta de instalacao : $INSTALL_DIR"
  echo "  Porta interna       : $APP_PORT"
  echo "  Usuario do servico  : $SERVICE_USER"
  echo "  Banco de dados      : $DB_NAME (usuario: $DB_USER)"
  echo "  Email admin         : $ADMIN_EMAIL"
  if [ "$GENERATED_PASSWORD" = true ]; then
    echo "  Senha admin         : $ADMIN_PASSWORD  (gerada automaticamente - anote agora!)"
  elif [ "$ADMIN_PASSWORD_FROM_ENV" = true ]; then
    echo "  Senha admin         : (mantida a da instalacao anterior, salva no .env)"
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
fi

export DEBIAN_FRONTEND=noninteractive

# ---------- 1. pacotes base ----------
info "Atualizando indice de pacotes e instalando utilitarios base..."
apt-get update -y -qq
apt-get install -y -qq ca-certificates curl gnupg rsync procps
ok "Pacotes base instalados."

# ---------- 2. Node.js ----------
info "Verificando Node.js..."
NEED_NODE_INSTALL=true
INSTALLED_NODE_OK=false
if command -v node >/dev/null 2>&1; then
  NODE_MAJOR="$(node -v | sed -E 's/^v([0-9]+).*/\1/')"
  if [ "$NODE_MAJOR" -ge 18 ]; then
    ok "Node.js $(node -v) ja instalado."
    NEED_NODE_INSTALL=false
    INSTALLED_NODE_OK=true
  else
    warn "Node.js $(node -v) encontrado, mas precisa ser 18 ou superior. Vou instalar uma versao mais nova."
  fi
fi

if [ "$NEED_NODE_INSTALL" = true ]; then
  info "Instalando Node.js 22.x (via NodeSource)..."
  INSTALL_NODE_VIA_APT=false
  if mkdir -p /etc/apt/keyrings \
     && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
     && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" > /etc/apt/sources.list.d/nodesource.list \
     && apt-get update -y -qq; then
    if apt-get install -y -qq nodejs; then
      ok "Node.js $(node -v) instalado via NodeSource."
    else
      INSTALL_NODE_VIA_APT=true
    fi
  else
    warn "Nao consegui usar o repositorio NodeSource (sem internet ou proxy?). Vou tentar o pacote do proprio sistema."
    rm -f /etc/apt/sources.list.d/nodesource.list
    INSTALL_NODE_VIA_APT=true
  fi
  if [ "$INSTALL_NODE_VIA_APT" = true ]; then
    apt-get update -y -qq
    apt-get install -y -qq nodejs npm
  fi
fi

if ! command -v node >/dev/null 2>&1; then
  fail "Node.js nao foi instalado. Instale manualmente e rode o script de novo."
fi
NODE_BIN="$(command -v node)"
NODE_MAJOR="$(node -v | sed -E 's/^v([0-9]+).*/\1/')"
if [ "$NODE_MAJOR" -lt 18 ]; then
  fail "Node.js $(node -v) e antigo demais. O projeto precisa de Node 18 ou superior."
fi
ok "Usando Node.js $(node -v) ($NODE_BIN)."

# ---------- 3. PostgreSQL ----------
info "Verificando PostgreSQL..."
if ! command -v psql >/dev/null 2>&1; then
  info "Instalando PostgreSQL (pacotes do sistema)..."
  apt-get install -y -qq postgresql postgresql-contrib
  ok "PostgreSQL instalado."
else
  ok "PostgreSQL ja instalado ($(psql --version | awk '{print $1, $2, $3}'))."
fi

systemctl enable postgresql >/dev/null 2>&1 || true
systemctl start postgresql
for _ in $(seq 1 30); do
  pg_isready -h 127.0.0.1 -p 5432 -q && break
  sleep 1
done
if ! pg_isready -h 127.0.0.1 -p 5432 -q; then
  fail "PostgreSQL nao aceitou conexoes em 127.0.0.1:5432. Verifique com: systemctl status postgresql"
fi
ok "PostgreSQL rodando em 127.0.0.1:5432."

info "Garantindo usuario e banco de dados da aplicacao (idempotente)..."
if [ "$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'")" = "1" ]; then
  sudo -u postgres psql -v ON_ERROR_STOP=1 -q -c "ALTER ROLE \"$DB_USER\" WITH LOGIN PASSWORD '$DB_PASSWORD';"
else
  sudo -u postgres psql -v ON_ERROR_STOP=1 -q -c "CREATE ROLE \"$DB_USER\" WITH LOGIN PASSWORD '$DB_PASSWORD';"
fi
# CREATEDB: permite ao app criar bancos dedicados por tenant sozinho
# (1 clique no painel, sem acesso de superusuario em producao).
sudo -u postgres psql -v ON_ERROR_STOP=1 -q -c "ALTER ROLE \"$DB_USER\" WITH CREATEDB;"
if [ "$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'")" != "1" ]; then
  sudo -u postgres createdb -O "$DB_USER" "$DB_NAME"
fi
ok "Banco '$DB_NAME' e usuario '$DB_USER' prontos."

# ---------- 4. usuario de sistema ----------
if ! id "$SERVICE_USER" >/dev/null 2>&1; then
  info "Criando usuario de sistema '$SERVICE_USER' (sem acesso a shell/login)..."
  useradd --system --create-home --shell /usr/sbin/nologin "$SERVICE_USER"
  ok "Usuario '$SERVICE_USER' criado."
else
  ok "Usuario '$SERVICE_USER' ja existe."
fi

# ---------- 5. copiar arquivos ----------
info "Copiando arquivos da aplicacao para $INSTALL_DIR ..."
mkdir -p "$INSTALL_DIR"
rsync -a --delete \
  --exclude 'node_modules' \
  --exclude '/data' \
  --exclude '/.env' \
  --exclude '/.env.bak-*' \
  --exclude '.git' \
  "$SOURCE_APP_DIR"/ "$INSTALL_DIR"/
mkdir -p "$INSTALL_DIR/data"
ok "Arquivos copiados."

# ---------- 6. .env ----------
ENV_FILE="$INSTALL_DIR/.env"
if [ -f "$ENV_FILE" ]; then
  cp "$ENV_FILE" "$ENV_FILE.bak-$(date +%Y%m%d-%H%M%S)"
  ok "Backup do .env anterior criado."
fi
# Preserva integracoes ja configuradas (Google OAuth, SMTP, URL publica):
# sem isso, cada reinstall apagava GOOGLE_*/SMTP_* e o login Google +
# recuperacao de senha por email paravam de funcionar (503).
PRESERVE_KEYS="GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET GOOGLE_REDIRECT_URI SMTP_HOST SMTP_PORT SMTP_SECURE SMTP_USER SMTP_PASS SMTP_FROM APP_BASE_URL PASSWORD_RESET_EXPIRES_HOURS"
PRESERVE_BLOCK=""
for _k in $PRESERVE_KEYS; do
  _v="$(env_get "$ENV_FILE" "$_k")"
  if [ -n "$_v" ]; then
    PRESERVE_BLOCK="${PRESERVE_BLOCK}${_k}=${_v}
"
  fi
done
info "Gerando arquivo .env ..."
cat > "$ENV_FILE" <<EOF
NODE_ENV=production
PORT=$APP_PORT
DATABASE_URL=postgres://$DB_USER:$DB_PASSWORD@127.0.0.1:5432/$DB_NAME
SESSION_SECRET=$SESSION_SECRET
ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_PASSWORD=$ADMIN_PASSWORD
ADMIN_NAME=$ADMIN_NAME
SEED_DEMO_DATA=false
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax
BACKUP_AUTO_ENABLED=true
BACKUP_INTERVAL_HOURS=6
BACKUP_MAX_FILES=30
RLS_ENABLED=true
EOF
if [ -n "$PRESERVE_BLOCK" ]; then
  printf '%s' "$PRESERVE_BLOCK" >> "$ENV_FILE"
  ok "Integracoes preservadas do .env anterior (Google/SMTP/URL)."
else
  cat >> "$ENV_FILE" <<EOF
# Google OAuth (login "Continuar com Google"): preencha e reinicie.
# O "Authorized redirect URI" no Google Cloud Console PRECISA ser identico a GOOGLE_REDIRECT_URI.
# Ex. VPS por IP: GOOGLE_REDIRECT_URI=http://SEU_IP:3000/api/auth/google/callback
# Ex. dominio:    GOOGLE_REDIRECT_URI=https://seudominio.com/api/auth/google/callback
#GOOGLE_CLIENT_ID=
#GOOGLE_CLIENT_SECRET=
#GOOGLE_REDIRECT_URI=
# Email p/ recuperacao de senha (forgot-password): sem SMTP o sistema so registra no log.
#SMTP_HOST=
#SMTP_PORT=587
#SMTP_SECURE=false
#SMTP_USER=
#SMTP_PASS=
#SMTP_FROM=
# URL publica usada nos links de recuperacao de senha (troque pelo IP/dominio real).
#APP_BASE_URL=http://SEU_IP:3000
EOF
fi
chmod 600 "$ENV_FILE"
ok ".env criado em $ENV_FILE"

# ---------- 7. permissoes ----------
chown -R "$SERVICE_USER":"$SERVICE_USER" "$INSTALL_DIR"

# ---------- 8. npm install ----------
info "Instalando dependencias com npm (isso pode levar um minuto)..."
cd "$INSTALL_DIR"
if [ -f package-lock.json ]; then
  if ! sudo -u "$SERVICE_USER" npm ci --omit=dev --no-audit --no-fund; then
    warn "npm ci falhou; tentando npm install..."
    sudo -u "$SERVICE_USER" npm install --omit=dev --no-audit --no-fund
  fi
else
  sudo -u "$SERVICE_USER" npm install --omit=dev --no-audit --no-fund
fi
ok "Dependencias instaladas."

# ---------- 9. systemd service ----------
SERVICE_NAME="gestor-multi-tenant"
# Portas abaixo de 1024 exigem privilegio; como o servico roda como usuario
# sem privilegios, concedemos apenas a capability de bind em porta baixa
# (em vez de rodar como root). Sem isso o app "pula" para a porta 81.
UNIT_CAPS=""
if [ "$APP_PORT" -lt 1024 ]; then
  info "Porta $APP_PORT e privilegiada (<1024): concedendo CAP_NET_BIND_SERVICE ao servico."
  UNIT_CAPS="AmbientCapabilities=CAP_NET_BIND_SERVICE
CapabilityBoundingSet=CAP_NET_BIND_SERVICE"
fi
info "Criando servico systemd '$SERVICE_NAME'..."
cat > "/etc/systemd/system/$SERVICE_NAME.service" <<EOF
[Unit]
Description=Painel de Gestao Multi-Tenant (Node.js)
After=network-online.target postgresql.service
Wants=network-online.target

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$INSTALL_DIR
EnvironmentFile=$INSTALL_DIR/.env
ExecStart=$NODE_BIN server.js
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true
$UNIT_CAPS
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable "$SERVICE_NAME" >/dev/null 2>&1 || true
systemctl restart "$SERVICE_NAME"
sleep 2

if ! systemctl is-active --quiet "$SERVICE_NAME"; then
  warn "O servico nao esta ativo. Ultimas linhas do log:"
  journalctl -u "$SERVICE_NAME" -n 30 --no-pager || true
  fail "O servico nao iniciou. Veja os logs com: journalctl -u $SERVICE_NAME -n 50 --no-pager"
fi

info "Testando a aplicacao em http://127.0.0.1:$APP_PORT ..."
APP_UP=false
EFFECTIVE_PORT="$APP_PORT"
for _ in $(seq 1 15); do
  if curl -fsS -o /dev/null --max-time 3 "http://127.0.0.1:$APP_PORT/"; then
    APP_UP=true
    break
  fi
  sleep 1
done
if [ "$APP_UP" = true ]; then
  ok "Servico '$SERVICE_NAME' respondendo na porta $APP_PORT."
else
  # A aplicacao pode ter subido em outra porta (ex.: porta ocupada/sem permissao);
  # descobre a porta real pela mensagem "Servidor rodando em http://localhost:NNNN".
  DISCOVERED_PORT="$(journalctl -u "$SERVICE_NAME" --no-pager -n 100 2>/dev/null | grep -oE 'http://localhost:[0-9]+' | tail -n1 | sed -E 's/.*:([0-9]+)$/\1/' || true)"
  if [ -n "$DISCOVERED_PORT" ] && [ "$DISCOVERED_PORT" != "$APP_PORT" ] \
     && curl -fsS -o /dev/null --max-time 3 "http://127.0.0.1:$DISCOVERED_PORT/"; then
    EFFECTIVE_PORT="$DISCOVERED_PORT"
    warn "A aplicacao subiu na porta $EFFECTIVE_PORT em vez de $APP_PORT (a porta configurada nao pode ser usada)."
    warn "Se quiser a porta $APP_PORT, ajuste o motivo e rode: systemctl restart $SERVICE_NAME"
  else
    warn "O servico esta ativo mas ainda nao respondeu em http://127.0.0.1:$APP_PORT."
    warn "Verifique os logs: journalctl -u $SERVICE_NAME -n 50 --no-pager"
  fi
fi

# ---------- 10. firewall (ufw), se existir ----------
if command -v ufw >/dev/null 2>&1 && ufw status | grep -q "Status: active"; then
  if [[ "$SETUP_NGINX" =~ ^[sS]$ ]]; then
    info "UFW ativo: liberando HTTP/HTTPS (Nginx)..."
    ufw allow "Nginx Full" || true
  else
    info "UFW ativo: liberando a porta $APP_PORT/tcp..."
    ufw allow "$APP_PORT"/tcp || true
  fi
fi

# ---------- 11. Nginx opcional (delega para scripts/setup-nginx.sh) ----------
if [[ "$SETUP_NGINX" =~ ^[sS]$ ]]; then
  info "Configurando Nginx (proxy reverso) via scripts/setup-nginx.sh ..."
  export INSTALL_DIR APP_PORT DOMAIN_NAME ADMIN_EMAIL
  INSTALL_DIR="$INSTALL_DIR" APP_PORT="$APP_PORT" DOMAIN_NAME="$DOMAIN_NAME" \
    ADMIN_EMAIL="$ADMIN_EMAIL" SETUP_SSL="${SETUP_SSL:-N}" ASSUME_YES=1 \
    bash "$SCRIPT_DIR/setup-nginx.sh" || {
    warn "setup-nginx.sh falhou; tentando configuracao minima inline..."
    apt-get install -y -qq nginx
    cat > "/etc/nginx/sites-available/$SERVICE_NAME" <<EOF
upstream gestor_app {
    server 127.0.0.1:$APP_PORT;
    keepalive 32;
}
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name $DOMAIN_NAME;
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
    ln -sf "/etc/nginx/sites-available/$SERVICE_NAME" "/etc/nginx/sites-enabled/$SERVICE_NAME"
    rm -f /etc/nginx/sites-enabled/default
    nginx -t && systemctl restart nginx
  }
  ok "Nginx configurado para $DOMAIN_NAME (porta 80 -> app 127.0.0.1:$APP_PORT)."
fi

# ---------- helper de upgrade do SO (chamado pelo painel via sudo) ----------
# Script root-owned com comandos FIXOS por família: evita 'bash -c' no sudoers
# (o sudo rejeita curingas em argumentos e invalida o sudo inteiro).
cat > /usr/local/bin/gestor-system-upgrade.sh <<'HELPER'
#!/bin/bash
# Upgrade de segurança do SO executado pelo painel Manutenção (sudo NOPASSWD).
# Sem argumentos, sem entrada do usuário — comandos fixos por família.
set -u
if [ -f /etc/os-release ]; then . /etc/os-release; fi
FAM="${ID_LIKE:-} ${ID:-}"
case "$FAM" in
  *debian*|*ubuntu*|*raspbian*|*linuxmint*|*pop*)
    apt-get update -y && apt-get upgrade -y ;;
  *rhel*|*fedora*|*centos*|*rocky*|*alma*|*ol*|*amzn*)
    dnf upgrade -y ;;
  *arch*|*manjaro*|*endeavour*)
    pacman -Syu --noconfirm ;;
  *alpine*)
    apk update && apk upgrade ;;
  *)
    echo "Família de SO desconhecida (ID=${ID:-?}). Rode manual." >&2
    exit 2 ;;
esac
HELPER
chmod 755 /usr/local/bin/gestor-system-upgrade.sh
chown root:root /usr/local/bin/gestor-system-upgrade.sh

# ---------- sudoers (terminal da Manutenção) ----------
# Libera NOPASSWD só para os comandos FIXOS que o painel executa
# (ver app/src/routes/maintenance.js). REGRA DURA: nenhum curinga em
# argumentos — o sudo rejeita o ARQUIVO INTEIRO ("wildcards are not allowed
# in command arguments") e aí NENHUM sudo funciona na máquina.
# Por isso validamos num temporário e só instalamos se o visudo aprovar.
SUDOERS_FILE="/etc/sudoers.d/gestor-multi-tenant"
SUDOERS_TMP="$(mktemp)"
cat > "$SUDOERS_TMP" <<EOF
# Gerenciado pelo instalador do gestor-multi-tenant (idempotente).
$SERVICE_USER ALL=(ALL) NOPASSWD: /usr/bin/ss -tlnp, /usr/sbin/ss -tlnp, /bin/cat /var/log/auth.log /var/log/auth.log.1, /usr/bin/cat /var/log/auth.log /var/log/auth.log.1, /usr/sbin/ufw status verbose, /usr/bin/ufw status verbose, /sbin/iptables -S, /usr/sbin/iptables -S, /usr/bin/systemctl status $SERVICE_NAME, /usr/bin/systemctl restart $SERVICE_NAME, /bin/systemctl status $SERVICE_NAME, /bin/systemctl restart $SERVICE_NAME, /usr/local/bin/gestor-system-upgrade.sh
EOF
chmod 440 "$SUDOERS_TMP"
if command -v visudo >/dev/null 2>&1 && visudo -cf "$SUDOERS_TMP" >/dev/null 2>&1; then
  cat "$SUDOERS_TMP" > "$SUDOERS_FILE"
  chmod 440 "$SUDOERS_FILE"
  ok "Sudoers do painel validado (botões da Manutenção liberados)."
else
  warn "visudo indisponível ou regra inválida — sudoers NÃO instalado (sudo continua funcionando)."
fi
rm -f "$SUDOERS_TMP"

# ---------- resumo final ----------
SERVER_IP="$(curl -s -4 --max-time 5 ifconfig.me || hostname -I | awk '{print $1}')"
echo ""
echo -e "${c_bold}${c_green}=== Instalacao concluida! ===${c_reset}"
echo ""
if [[ "$SETUP_NGINX" =~ ^[sS]$ ]]; then
  if [[ "$SETUP_SSL" =~ ^[sS]$ ]] && [ -f "/etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem" ]; then
    echo "  Acesse em: https://$DOMAIN_NAME"
  else
    echo "  Acesse em: http://$DOMAIN_NAME"
  fi
else
  echo "  Acesse em: http://$SERVER_IP:$EFFECTIVE_PORT"
fi
echo ""
echo "  Email do administrador : $ADMIN_EMAIL"
if [ "$GENERATED_PASSWORD" = true ] || [ "$ADMIN_PASSWORD_FROM_ENV" = false ]; then
  echo "  Senha do administrador : $ADMIN_PASSWORD"
else
  echo "  Senha do administrador : (a salva em $ENV_FILE)"
fi
echo ""
echo "  Banco PostgreSQL : $DB_NAME (usuario $DB_USER) em 127.0.0.1:5432"
echo "  Arquivo .env     : $ENV_FILE (guarde as credenciais em lugar seguro)"
echo ""
echo "  Comandos uteis:"
echo "    systemctl status $SERVICE_NAME     # ver status"
echo "    systemctl restart $SERVICE_NAME    # reiniciar"
echo "    journalctl -u $SERVICE_NAME -f     # ver logs em tempo real"
echo "    sudo bash scripts/backup.sh        # backup (dados + .env + dump do banco)"
echo ""
