#!/usr/bin/env bash
#
# update.sh - atualiza a aplicacao ja instalada com uma versao mais nova,
# preservando os dados (PostgreSQL + data/) e as configuracoes (.env).
#
# Uso:
#   Linux/VPS: sudo bash scripts/update.sh [/opt/gestor-multi-tenant]
#   Windows (Git Bash): bash scripts/update.sh
#
set -euo pipefail

SERVICE_NAME="gestor-multi-tenant"
INSTALL_DIR="${1:-/opt/gestor-multi-tenant}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SOURCE_APP_DIR="$PROJECT_ROOT/app"

# ---------- deteccao de plataforma ----------
# Git Bash/MSYS/Cygwin = Windows (update local, sem systemd nem /opt).
# WSL responde "Linux" e segue o fluxo Linux normalmente.
detect_os() {
  case "$(uname -s 2>/dev/null || echo unknown)" in
    MINGW*|MSYS*|CYGWIN*|Windows_NT|Windows*) printf 'windows' ;;
    *) printf 'linux' ;;
  esac
}

# ---------- fluxo Windows (maquina local) ----------
# No Windows nao ha copia para /opt nem servico systemd: o projeto roda
# na propria pasta (run-server.bat). Atualizar = git pull + npm install.
# Rode no Git Bash (o PowerShell nao executa .sh diretamente).
update_windows() {
  echo "Plataforma detectada: Windows — atualizacao local (sem systemd)."
  for cmd in git node npm; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
      echo "ERRO: '$cmd' nao encontrado no PATH. Instale e tente de novo."
      exit 1
    fi
  done
  if [ ! -f "$SOURCE_APP_DIR/server.js" ]; then
    echo "ERRO: pasta 'app' nao encontrada em $PROJECT_ROOT."
    exit 1
  fi
  echo ""
  echo "IMPORTANTE: crie um backup pelo painel antes (Backups -> Criar Backup Agora)."
  echo "O banco local (pgdata/) nao pode ser copiado com o servidor rodando."
  local confirm="S"
  if [ -t 0 ]; then
    read -rp "Continuar com git pull + npm install? (S/n): " confirm
    confirm="${confirm:-S}"
  fi
  if [[ ! "$confirm" =~ ^[sS]$ ]]; then
    echo "Atualizacao cancelada."
    exit 1
  fi
  echo "Baixando codigo novo (git pull)..."
  if ! git -C "$PROJECT_ROOT" pull --ff-only; then
    echo "ERRO: git pull falhou (provavel alteracao local)."
    echo "Veja com: git -C \"$PROJECT_ROOT\" status --short"
    echo "Descarte com: git -C \"$PROJECT_ROOT\" checkout -- <arquivo>"
    echo "Ou guarde com: git -C \"$PROJECT_ROOT\" stash push -m local"
    exit 1
  fi
  echo "Instalando dependencias..."
  cd "$SOURCE_APP_DIR"
  npm install --no-audit --no-fund
  node --check server.js && echo "Sintaxe OK."
  echo ""
  echo "Atualizacao concluida (Windows)."
  echo "Reinicie o servidor: feche a janela do run-server e abra de novo"
  echo "(botao direito -> Executar como administrador, se PORT=80)."
  echo "Confira no console: Servidor rodando em http://localhost:<porta>"
}

if [ "$(detect_os)" = "windows" ]; then
  update_windows
  exit 0
fi

if [ "$(id -u)" -ne 0 ]; then
  echo "Rode como root: sudo bash scripts/update.sh"
  exit 1
fi

if [ ! -d "$INSTALL_DIR" ]; then
  echo "Instalacao nao encontrada em $INSTALL_DIR. Rode install.sh primeiro."
  exit 1
fi

# Le uma chave do .env sem carregar nada no shell.
env_get() {
  local file="$1" key="$2" line
  [ -f "$file" ] || return 0
  line="$(grep -m1 "^${key}=" "$file" 2>/dev/null || true)"
  line="${line#*=}"
  line="${line%\"}"; line="${line#\"}"
  printf '%s' "$line"
}

rand_alnum() {
  head -c 1024 /dev/urandom | tr -dc 'A-Za-z0-9' | head -c "$1"
}

# ---------- 0. auto-reparo do .env (restore de backup do Windows por engano) ----------
# O backup do painel inclui o .env. Restaurar na VPS um .zip criado no Windows
# sobrescreve o .env com PG_BIN/PGDATA de C:\... e senha de banco errada, o que
# derruba o servico e quebra o pg_dump. Detecta e conserta sozinho.
repair_windows_env() {
  local env_file="$INSTALL_DIR/.env"
  [ -f "$env_file" ] || return 0
  if ! grep -Eq '^(PG_BIN|PGDATA|PG_LOG)=.*(\\|[Cc]:)' "$env_file"; then
    return 0
  fi
  echo "AVISO: o .env instalado contem caminhos do Windows (PG_BIN/PGDATA)."
  echo "Isso acontece ao restaurar na VPS um backup criado no Windows."
  echo "Recuperando o .env original da VPS automaticamente..."
  cp "$env_file" "$env_file.broken-$(date +%Y%m%d-%H%M%S)"

  # 1) Melhor fonte: backup pre-restore criado antes do restore errado.
  local latest_pre
  latest_pre="$(ls -t "$INSTALL_DIR/data/backups"/backup-pre-restore-*.zip 2>/dev/null | head -n 1 || true)"
  if [ -n "$latest_pre" ]; then
    echo "Restaurando .env do backup: $(basename "$latest_pre")"
    if unzip -p "$latest_pre" .env > "$env_file.tmp" 2>/dev/null \
      && grep -q '^DATABASE_URL=postgres://' "$env_file.tmp" \
      && ! grep -Eq '^(PG_BIN|PGDATA|PG_LOG)=.*(\\|[Cc]:)' "$env_file.tmp"; then
      mv "$env_file.tmp" "$env_file"
      echo ".env recuperado do pre-restore com sucesso."
      return 0
    fi
    rm -f "$env_file.tmp"
    echo "O pre-restore nao tinha um .env valido; reconstruindo..."
  else
    echo "Nenhum backup pre-restore encontrado; reconstruindo o .env..."
  fi

  # 2) Reconstrucao: mantem porta/segredos/admin, remove vars do Windows,
  #    gera nova senha do banco e aplica no PostgreSQL.
  local app_port session_secret admin_email admin_password admin_name
  local db_user db_name db_password broken_url
  app_port="$(env_get "$env_file" PORT)";            [ -n "$app_port" ] || app_port="3000"
  session_secret="$(env_get "$env_file" SESSION_SECRET)"
  if [ -z "$session_secret" ] || [ "$session_secret" = "troque-este-valor-para-um-texto-aleatorio-longo" ]; then
    session_secret="$(rand_alnum 64)"
  fi
  admin_email="$(env_get "$env_file" ADMIN_EMAIL)";  [ -n "$admin_email" ] || admin_email="admin@admin.com"
  admin_password="$(env_get "$env_file" ADMIN_PASSWORD)"
  admin_name="$(env_get "$env_file" ADMIN_NAME)";    [ -n "$admin_name" ] || admin_name="Administrador"
  broken_url="$(env_get "$env_file" DATABASE_URL)"
  db_user="$(printf '%s' "$broken_url" | sed -n 's|^postgres://\([^:/]*\).*|\1|p')"
  db_name="$(printf '%s' "$broken_url" | sed -n 's|^postgres://[^/]*/\([^?]*\).*|\1|p')"
  [ -n "$db_user" ] || db_user="gestor"
  [ -n "$db_name" ] || db_name="gestor"
  db_password="$(rand_alnum 24)"

  echo "Redefinindo senha do usuario '$db_user' no PostgreSQL..."
  if [ "$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$db_user'")" = "1" ]; then
    sudo -u postgres psql -v ON_ERROR_STOP=1 -q -c "ALTER ROLE \"$db_user\" WITH LOGIN PASSWORD '$db_password';"
  else
    sudo -u postgres psql -v ON_ERROR_STOP=1 -q -c "CREATE ROLE \"$db_user\" WITH LOGIN PASSWORD '$db_password';"
  fi
  if [ "$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$db_name'")" != "1" ]; then
    sudo -u postgres createdb -O "$db_user" "$db_name"
  fi

  # Preserva integracoes (Google/SMTP/URL) antes de reconstruir.
  _preserve=""
  for _k in GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET GOOGLE_REDIRECT_URI SMTP_HOST SMTP_PORT SMTP_SECURE SMTP_USER SMTP_PASS SMTP_FROM APP_BASE_URL PASSWORD_RESET_EXPIRES_HOURS; do
    _v="$(env_get "$env_file" "$_k")"
    if [ -n "$_v" ]; then
      _preserve="${_preserve}${_k}=${_v}
"
    fi
  done
  cat > "$env_file" <<EOF
NODE_ENV=production
PORT=$app_port
DATABASE_URL=postgres://$db_user:$db_password@127.0.0.1:5432/$db_name
SESSION_SECRET=$session_secret
ADMIN_EMAIL=$admin_email
ADMIN_PASSWORD=$admin_password
ADMIN_NAME=$admin_name
SEED_DEMO_DATA=false
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax
BACKUP_AUTO_ENABLED=true
BACKUP_INTERVAL_HOURS=6
BACKUP_MAX_FILES=30
RLS_ENABLED=true
EOF
  if [ -n "$_preserve" ]; then
    printf '%s' "$_preserve" >> "$env_file"
    echo "Integracoes Google/SMTP preservadas."
  fi
  echo ".env reconstruido para a VPS (senha do banco atualizada)."
}

# Libera a porta do app matando processos ÓRFÃOS (ex.: 'node server.js'
# manual, fora do systemd) que impediriam o serviço de subir (EADDRINUSE).
# Só mata processo cujo binário seja node, a linha de comando contenha
# server.js e o cwd seja o diretório instalado ou o clone — nunca outra coisa.
free_app_port() {
  local port="$1" pid exe cmdline cwd sig
  [ -n "$port" ] || return 0
  command -v ss >/dev/null 2>&1 || return 0
  for sig in TERM KILL; do
    for pid in $(ss -tlnp 2>/dev/null | grep -o 'pid=[0-9][0-9]*' | cut -d= -f2 | sort -u || true); do
      case "$pid" in ''|*[!0-9]*) continue ;; esac
      [ "$pid" = "$$" ] && continue
      exe="$(readlink "/proc/$pid/exe" 2>/dev/null || true)"
      case "$exe" in *node*) ;; *) continue ;; esac
      cmdline="$(tr '\0' ' ' < "/proc/$pid/cmdline" 2>/dev/null || true)"
      case "$cmdline" in *server.js*) ;; *) continue ;; esac
      cwd="$(readlink "/proc/$pid/cwd" 2>/dev/null || true)"
      case "$cwd" in "$INSTALL_DIR"|"$SOURCE_APP_DIR") ;; *) continue ;; esac
      echo "Finalizando processo órfão do app -$sig (PID $pid, cwd $cwd)..."
      kill "-$sig" "$pid" 2>/dev/null || true
    done
    sleep 1
  done
  return 0
}

# Garante CREATEDB ao usuario do app (bancos dedicados por tenant em 1 clique).
ensure_createdb() {
  local env_file="$INSTALL_DIR/.env" db_url_user
  db_url_user="$(env_get "$env_file" DATABASE_URL | sed -n 's|^postgres://\([^:/]*\).*|\1|p')"
  if [ -n "$db_url_user" ]; then
    sudo -u postgres psql -q -c "ALTER ROLE \"$db_url_user\" WITH CREATEDB;" 2>/dev/null \
      && echo "Permissao CREATEDB garantida ao usuario '$db_url_user'." \
      || echo "AVISO: nao foi possivel conceder CREATEDB a '$db_url_user'."
  fi
}

if ! command -v unzip >/dev/null 2>&1; then
  echo "Instalando unzip..."
  apt-get update -y && apt-get install -y unzip
fi

repair_windows_env

SERVICE_USER="$(stat -c '%U' "$INSTALL_DIR/.env" 2>/dev/null || echo gestorapp)"
chmod 600 "$INSTALL_DIR/.env" 2>/dev/null || true
chown "$SERVICE_USER":"$SERVICE_USER" "$INSTALL_DIR/.env" 2>/dev/null || true
ensure_createdb

# Helper de upgrade do SO (chamado pelo painel via sudo; comandos fixos).
# Evita 'bash -c' no sudoers (curingas em argumentos invalidam o sudo inteiro).
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

# Sudoers do terminal da Manutenção (idempotente; só comandos FIXOS, sem
# curingas em argumentos — curinga invalida o arquivo e quebra todo o sudo).
# Valida num temporário e só instala se o visudo aprovar.
SUDOERS_FILE="/etc/sudoers.d/gestor-multi-tenant"
SUDOERS_TMP="$(mktemp)"
cat > "$SUDOERS_TMP" <<EOF
# Gerenciado pelo instalador do gestor-multi-tenant (idempotente).
$SERVICE_USER ALL=(ALL) NOPASSWD: /usr/bin/ss -tlnp, /usr/sbin/ss -tlnp, /bin/cat /var/log/auth.log /var/log/auth.log.1, /usr/bin/cat /var/log/auth.log /var/log/auth.log.1, /usr/sbin/ufw status verbose, /usr/bin/ufw status verbose, /sbin/iptables -S, /usr/sbin/iptables -S, /usr/bin/systemctl status $SERVICE_NAME, /usr/bin/systemctl restart $SERVICE_NAME, /bin/systemctl status $SERVICE_NAME, /bin/systemctl restart $SERVICE_NAME, /usr/local/bin/gestor-system-upgrade.sh
EOF
chmod 440 "$SUDOERS_TMP"
if command -v visudo >/dev/null 2>&1; then
  if visudo -cf "$SUDOERS_TMP" >/dev/null 2>&1; then
    cat "$SUDOERS_TMP" > "$SUDOERS_FILE"
    chmod 440 "$SUDOERS_FILE"
    echo "Sudoers do painel validado."
  else
    echo "AVISO: regra sudoers inválida — sudoers NÃO instalado (sudo continua funcionando)."
  fi
fi
rm -f "$SUDOERS_TMP"

# ---------- traz o codigo novo (obrigatorio antes do rsync) ----------
# O rsync abaixo copia do clone local para o INSTALL_DIR: sem git pull aqui,
# ele republicaria o codigo velho e nada mudaria no ar.
if [ -d "$PROJECT_ROOT/.git" ]; then
  echo "Baixando codigo novo (git pull em $PROJECT_ROOT, branch $(git -C "$PROJECT_ROOT" branch --show-current 2>/dev/null || echo '?'))..."
  if git -C "$PROJECT_ROOT" pull --ff-only; then
    echo "Codigo atualizado."
  else
    echo "AVISO: git pull falhou (alteracao local, branch sem upstream ou sem rede)."
    echo "Veja com: git -C \"$PROJECT_ROOT\" status --short"
    echo "Seguindo com o codigo que ja esta no clone..."
  fi
else
  echo "AVISO: $PROJECT_ROOT nao e um clone git; usando os arquivos locais como estao."
fi

echo "Fazendo backup rapido antes de atualizar..."
bash "$SCRIPT_DIR/backup.sh" "$INSTALL_DIR" "/opt/backups-gestor-multi-tenant" || true

echo "Parando o servico..."
systemctl stop "$SERVICE_NAME" || true
# O stop acima não alcança processos manuais fora do systemd: sem esta
# limpeza, um 'node server.js' órfão seguraria a porta e o start falharia
# (EADDRINUSE) com o serviço em loop de crash.
APP_PORT="$(env_get "$INSTALL_DIR/.env" PORT)"; [ -n "$APP_PORT" ] || APP_PORT="3000"
free_app_port "$APP_PORT"

if ! command -v rsync >/dev/null 2>&1; then
  echo "Instalando rsync..."
  apt-get update -y && apt-get install -y rsync
fi

echo "Copiando novos arquivos (preservando data/ e .env)..."
# Importante: '/data' com barra inicial e ancorado na raiz, senao o rsync
# tambem excluiria src/data (mesmo bug do .gitignore que ja quebrou o app).
rsync -a --exclude '/data' --exclude '/.env' --exclude 'node_modules' "$SOURCE_APP_DIR"/ "$INSTALL_DIR"/

chown -R "$SERVICE_USER":"$SERVICE_USER" "$INSTALL_DIR"

echo "Instalando dependencias..."
cd "$INSTALL_DIR"
sudo -u "$SERVICE_USER" npm install --omit=dev --no-audit --no-fund

echo "Reiniciando o servico..."
systemctl start "$SERVICE_NAME"
sleep 2
if ! systemctl is-active --quiet "$SERVICE_NAME"; then
  echo "ERRO: o servico nao subiu. Ultimas linhas do log:"
  journalctl -u "$SERVICE_NAME" -n 30 --no-pager || true
  echo "Dica: porta $APP_PORT ocupada? Confira com: ss -tlnp | grep $APP_PORT"
  exit 1
fi
systemctl status "$SERVICE_NAME" --no-pager | head -12

# Mostra exatamente qual codigo foi implantado (confere com o GitHub).
DEPLOYED_SHA="$(git -C "$PROJECT_ROOT" rev-parse --short HEAD 2>/dev/null || echo '?')"
DEPLOYED_SUBJECT="$(git -C "$PROJECT_ROOT" log -1 --format=%s 2>/dev/null || true)"
DEPLOYED_BRANCH="$(git -C "$PROJECT_ROOT" branch --show-current 2>/dev/null || echo '?')"
echo "Codigo implantado: $DEPLOYED_SHA ($DEPLOYED_BRANCH) $DEPLOYED_SUBJECT"

echo "Atualizacao concluida."
