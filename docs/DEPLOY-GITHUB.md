# Deploy via GitHub → VPS Ubuntu (Nginx + HTTPS)

Guia em português para subir este projeto pelo GitHub e rodar na VPS com Nginx.
Funciona **sem domínio** (via IP, HTTP) e ativa o **HTTPS com 1 comando** quando o domínio apontar.

## 0. O que foi preparado no repo

| Arquivo | Para que serve |
|---|---|
| `deploy/nginx/gestor-multi-tenant.conf` | Template do vhost Nginx produção (gzip, `client_max_body_size 55m`, headers, `keepalive`, `/nginx-health`). Placeholders `__DOMAIN__` / `__APP_PORT__`. |
| `scripts/setup-nginx.sh` | Script idempotente: instala o Nginx, aplica o vhost, libera UFW, e opcionalmente emite HTTPS com Certbot + ajusta `COOKIE_SECURE=true` e `APP_BASE_URL`. Pode rodar quantas vezes quiser. |
| `scripts/install.sh` | Instalador principal agora **delega** o bloco Nginx para o `setup-nginx.sh` (com fallback inline se o template não estiver junto). |
| `app/server.js` | Já pronto para proxy: `trust proxy, 1`, HSTS/secure-cookie só ligam com `COOKIE_SECURE=true` (ou seja, só com HTTPS real). |

## 1. Subir o código para o GitHub (no Windows)

```powershell
cd C:\Users\wellington\Desktop\gestor-multi-tenant

# confira que nenhum segredo vai junto
git status --short
# .env, app/.env, app/data/, pgdata/, *.log, *.tar.gz devem estar ignorados.
# Se aparecer app/.env ou .env na lista, NÃO commite — confira o .gitignore.

git add deploy/nginx/gestor-multi-tenant.conf scripts/setup-nginx.sh scripts/install.sh .gitignore docs/DEPLOY-GITHUB.md
git commit -m "Deploy: nginx + https via setup-nginx.sh (ip agora, dominio depois)"
git push origin main
```

> O repo remoto já está configurado (`origin → github.com/wellinton1/gestor-multi-tenant`).
> Nunca commite `app/.env`, `.env`, `app/data/`, `pgdata/` — senhas e sessões ficam só na VPS.

## 2. Primeira instalação na VPS (só IP, HTTP)

Pré-requisitos na VPS: Ubuntu 22.04/24.04, acesso root/sudo, porta 80 liberada no
firewall da nuvem (Security Group).

```bash
# 1) código
sudo apt-get update && sudo apt-get install -y git
git clone https://github.com/wellinton1/gestor-multi-tenant.git
cd gestor-multi-tenant

# 2) instalação (responda N quando perguntar sobre Nginx/dominio — faremos no passo 3)
sudo bash scripts/install.sh

# 3) Nginx via IP (HTTP na porta 80 -> app na 3000)
sudo bash scripts/setup-nginx.sh
# quando perguntar o dominio, aperte ENTER (usa "_": responde por IP ou qualquer host)

# 4) confira
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3000/      # app direto
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1/nginx-health  # via nginx
sudo systemctl status gestor-multi-tenant --no-pager
sudo systemctl status nginx --no-pager
```

Acesse: `http://SEU_IP` (sem `:3000` — o Nginx já faz o proxy).
Login com o email/senha mostrados no final do `install.sh` (também em `/opt/gestor-multi-tenant/.env`).

Tudo em um comando só (sem perguntas):

```bash
sudo ASSUME_YES=1 ADMIN_EMAIL=admin@admin.com bash scripts/install.sh
sudo ASSUME_YES=1 bash scripts/setup-nginx.sh
```

## 3. Ativar o HTTPS quando tiver o domínio (1 comando)

1. No painel do seu DNS (Registro.br, Cloudflare, etc.), crie o registro **A**:
   `painel.seudominio.com → IP_da_VPS`. Aguarde propagar:
   `nslookup painel.seudominio.com` deve responder o IP da VPS.
2. Na VPS:

```bash
cd ~/gestor-multi-tenant  # ou onde voce clonou
git pull --ff-only
sudo DOMAIN_NAME=painel.seudominio.com ADMIN_EMAIL=voce@email.com SETUP_SSL=S bash scripts/setup-nginx.sh
```

O script faz sozinho:

- reescreve o vhost com `server_name painel.seudominio.com`;
- `certbot --nginx -d painel.seudominio.com --redirect` (porta 80 → 443);
- põe `COOKIE_SECURE=true` e `APP_BASE_URL=https://painel.seudominio.com` no `/opt/gestor-multi-tenant/.env`;
- `systemctl restart gestor-multi-tenant` (o Express passa a mandar HSTS + cookie Secure).

Confira: `https://painel.seudominio.com` + cadeado no navegador.
Renovação: o Certbot cria um timer systemd automático —
`systemctl list-timers | grep certbot` e teste com `sudo certbot renew --dry-run`.

## 4. Operação do dia a dia

```bash
sudo bash scripts/start.sh      # iniciar
sudo bash scripts/stop.sh       # parar
sudo bash scripts/restart.sh    # reiniciar (após editar o .env)
sudo bash scripts/logs.sh       # logs (Ctrl+C sai)
sudo bash scripts/backup.sh     # backup (.tar.gz com dump do banco + data/ + .env)
sudo bash scripts/update.sh     # git pull + deploy preservando dados (rode dentro do clone!)
sudo bash scripts/reset-admin-password.sh  # trocar senha de um usuario (interativo; DISABLE_2FA=S limpa o 2FA)
sudo bash scripts/setup-nginx.sh  # reconfigurar Nginx / trocar dominio / reemitir SSL
```

> `update.sh` espera o clone do git na pasta atual para copiar `app/` → `/opt/gestor-multi-tenant`
> preservando `data/` e `.env`. Não apaga o vhost do Nginx nem os certificados.

## 5. Solução de problemas

| Sintoma | Causa provável / comando |
|---|---|
| `http://IP` não abre | `systemctl status nginx`, `nginx -t`, `curl -s 127.0.0.1:3000/` (app de pé?), firewall da nuvem liberando 80? |
| `502 Bad Gateway` | app fora do ar ou porta errada: `journalctl -u gestor-multi-tenant -n 50 --no-pager`, confira `PORT` no `/opt/gestor-multi-tenant/.env` vs `proxy_pass` em `/etc/nginx/sites-available/gestor-multi-tenant` |
| Certbot falha | DNS ainda não propagou (`nslookup seu.dominio`), porta 80 fechada, ou Nginx parado. Tente depois: `sudo certbot --nginx -d seu.dominio.com` |
| Login desloga / cookie não fixa | Com HTTPS o `.env` precisa de `COOKIE_SECURE=true` + restart. Com HTTP puro precisa ser `false`. O `setup-nginx.sh` ajusta sozinho no fluxo SSL. |
| `GOOGLE_REDIRECT_URI` errado | Com domínio use `https://seu.dominio.com/api/auth/google/callback` (idêntico ao Google Cloud Console) e `systemctl restart gestor-multi-tenant` |
| Backup diário | `crontab -e` (root): `0 3 * * * /usr/bin/bash /root/gestor-multi-tenant/scripts/backup.sh >> /var/log/gestor-backup.log 2>&1` (ajuste o caminho do clone) |
| Botões da Manutenção pedem comando SSH | Falta o sudoers: rode `sudo bash scripts/install.sh` de novo (idempotente, preserva dados) ou `sudo bash scripts/update.sh` — ambos criam `/etc/sudoers.d/gestor-multi-tenant` |

## 6. Checklist antes do `git push`

- [ ] `git status --short` não lista `.env`, `app/.env`, `app/data/`, `pgdata/`, `*.log`
- [ ] `bash -n scripts/install.sh && bash -n scripts/setup-nginx.sh && bash -n scripts/update.sh` sem erro
- [ ] `node --check app/server.js` OK
- [ ] `deploy/nginx/gestor-multi-tenant.conf` contém `__DOMAIN__`/`__APP_PORT__` (placeholders, não IP real)
