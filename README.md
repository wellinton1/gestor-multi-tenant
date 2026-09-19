# Painel de Gestao Multi-Tenant

Sistema de gestao para negocios com agendamento (barbearia, pizzaria, lava jato
e outros nichos): dashboard, agendamentos/pedidos, clientes, funcionarios,
servicos, configuracoes por estabelecimento, e um **portal do cliente** publico
para que seus clientes agendem online.

Feito para rodar em qualquer VPS Linux (Ubuntu/Debian): Node.js + PostgreSQL
(instalado e configurado automaticamente pelo instalador; nenhuma dependencia
precisa compilar nada na VPS).

---

## Instalacao rapida (recomendado)

1. Envie a pasta inteira deste projeto para a sua VPS (via `scp`, `sftp`, ou
   suba o `.zip` e extraia la com `unzip`).
2. Entre na pasta do projeto e rode o instalador como root:

```bash
cd gestor-multi-tenant
sudo bash scripts/install.sh
```

3. Responda as perguntas simples (pasta de instalacao, porta, email/senha do
   administrador, se quer configurar um dominio com Nginx + HTTPS). No final,
   o script mostra a URL de acesso e as credenciais do administrador.

Isso e tudo. O script:

- Instala o Node.js automaticamente se ainda nao existir na VPS;
- Instala o PostgreSQL, cria o usuario/banco da aplicacao e configura a
  `DATABASE_URL` no `.env` (pode rodar de novo sem perder dados);
- Cria um usuario de sistema dedicado (sem shell) so para rodar a aplicacao;
- Instala as dependencias (`npm install`) - todas em JavaScript puro, sem
  compilacao nativa, entao funciona em qualquer VPS sem precisar instalar
  `build-essential`, `python`, etc.;
- Cria um servico `systemd` chamado `gestor-multi-tenant`, que reinicia
  sozinho se cair ou se a VPS reiniciar;
- Opcionalmente configura o Nginx como proxy reverso e emite um certificado
  HTTPS gratis via Certbot, se voce tiver um dominio apontando para a VPS.

---

## Rodando localmente no Windows 10

Para usar o projeto na sua máquina sem depender do instalador Linux/VPS:

1. Abra o terminal na pasta do projeto.
2. Entre na pasta do app:

```powershell
cd .\app
npm install
```

3. Inicie o servidor:

```powershell
npm start
```

Ou, se preferir, clique duas vezes no atalho do Windows:

```text
run-server.bat
```

No Linux com ambiente gráfico, você também pode clicar duas vezes em:

```text
run-server.desktop
```

Depois abra no navegador:

```text
http://localhost:3000
```

Credenciais iniciais: as definidas em `app\.env` (`ADMIN_EMAIL`/`ADMIN_PASSWORD`).
Se nenhuma estiver definida, o sistema abre a tela de **Setup** na primeira vez
que você acessar a URL e você cria o administrador por ela.

> O banco no Windows roda no PostgreSQL embutido (pasta `pgsql/`) e é iniciado
> junto com o servidor - não precisa instalar nada. Se a porta estiver em uso,
> ajuste `PORT` no arquivo `app\.env`.

---

## Rodando em uma VPS Linux

Testado em Ubuntu 22.04, 24.04 e 26.04 (e Debian). O instalador instala o
Node.js e o PostgreSQL sozinho - você só precisa de uma VPS limpa com acesso
root/`sudo`.

1. Baixe o projeto na VPS (via `git clone`, `scp`, `sftp` ou `rsync`).
2. Conecte-se à VPS via SSH e entre na pasta do projeto:

```bash
cd /caminho/para/gestor-multi-tenant
```

3. Rode o instalador:

```bash
sudo bash scripts/install.sh
```

4. Responda às perguntas de instalação (pasta, porta, e-mail/senha do administrador, domínio/HTTPS opcional).

No final, o instalador mostra a URL de acesso e as credenciais do administrador.

Para automação (ex.: *user-data* de uma instância AWS EC2), dá para rodar sem
perguntas nenhuma:

```bash
sudo ASSUME_YES=1 \
     ADMIN_EMAIL=admin@seudominio.com \
     DOMAIN_NAME=painel.seudominio.com SETUP_NGINX=S SETUP_SSL=S \
     bash scripts/install.sh
```

### Comandos úteis na VPS

```bash
sudo bash scripts/start.sh      # iniciar
sudo bash scripts/stop.sh       # parar
sudo bash scripts/restart.sh    # reiniciar
sudo bash scripts/logs.sh       # ver logs em tempo real
sudo bash scripts/backup.sh     # backup dos dados
sudo bash scripts/update.sh     # atualizar preservando dados
sudo bash scripts/uninstall.sh  # remover o serviço
```

> Se quiser iniciar o app diretamente na VPS sem usar `systemd`, use:
>
> ```bash
> cd /caminho/para/gestor-multi-tenant/app
> npm install
> npm start
> ```

---

## Acessando pela primeira vez

Abra a URL mostrada no final da instalacao (ex: `http://SEU_IP:3000` ou
`https://seudominio.com`) e entre com o email/senha do administrador que
apareceram no resumo da instalacao (tambem salvos em
`/opt/gestor-multi-tenant/.env`).

Se `SEED_DEMO_DATA=true` estiver no `.env`, o sistema cria um estabelecimento
de demonstracao ("Barbearia Elite") com dados de exemplo, so para voce ver o
sistema funcionando (o instalador de VPS deixa `false` por padrao, para
producao). Voce pode criar seus estabelecimentos reais a qualquer momento em
"Novo Estabelecimento".

### Portal do Cliente

Em **Configuracoes**, cada estabelecimento tem um link do tipo:

```
http://seudominio.com/loja/<id-do-estabelecimento>
```

Compartilhe esse link com seus clientes (WhatsApp, Instagram, Google
Meu Negocio, etc.) para que eles vejam seus servicos e agendem online. Todo
agendamento feito por ali entra automaticamente com status **Pendente** para
voce confirmar.

---

## Comandos do dia a dia

Depois de instalado, use os scripts na pasta `scripts/` (ou os comandos
`systemctl` diretamente):

```bash
sudo bash scripts/start.sh      # iniciar
sudo bash scripts/stop.sh       # parar
sudo bash scripts/restart.sh    # reiniciar (ex: depois de editar o .env)
sudo bash scripts/logs.sh       # ver logs em tempo real (Ctrl+C sai)
sudo bash scripts/backup.sh     # backup dos dados (.tar.gz com data/hora)
sudo bash scripts/update.sh     # atualizar para uma versao mais nova (preserva dados)
sudo bash scripts/uninstall.sh  # remover o servico (com opcao de apagar dados)
```

Equivalentes diretos com `systemctl`:

```bash
sudo systemctl status gestor-multi-tenant
sudo systemctl restart gestor-multi-tenant
sudo journalctl -u gestor-multi-tenant -f
```

---

## Configuracao (.env)

O arquivo `.env` fica em `/opt/gestor-multi-tenant/.env` (ou na pasta que voce
escolheu na instalacao). Depois de editar, rode `sudo bash scripts/restart.sh`
para aplicar.

| Variavel          | O que faz                                                                 |
|-------------------|----------------------------------------------------------------------------|
| `DATABASE_URL`    | Conexao PostgreSQL (`postgres://usuario:senha@127.0.0.1:5432/banco`). Obrigatoria: sem ela o servidor nao inicia. Preenchida pelo instalador. |
| `PORT`            | Porta interna do Node.js (o Nginx, se configurado, aponta para ela)         |
| `SESSION_SECRET`  | Chave aleatoria usada para assinar o cookie de login. Gerada automaticamente. |
| `ADMIN_EMAIL`     | Email de login do administrador                                            |
| `ADMIN_PASSWORD`  | Senha do administrador (so tem efeito na primeira execucao)                |
| `SEED_DEMO_DATA`  | `true`/`false` - cria o estabelecimento de exemplo na primeira execucao     |
| `COOKIE_SECURE`   | Deixe `true` somente se estiver usando HTTPS                               |
| `BACKUP_AUTO_ENABLED` | `true`/`false` - backup automatico do site inteiro em .zip (padrao: `true`) |
| `BACKUP_INTERVAL_HOURS` | Intervalo do backup automatico em horas (padrao: `6`)                 |
| `BACKUP_MAX_FILES` | Quantos backups automaticos manter antes de apagar os mais antigos (padrao: `30`) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI` | Login "Continuar com Google". O redirect precisa ser **identico** ao cadastrado no Google Cloud Console (inclui porta). Ex. VPS por IP: `http://SEU_IP:3000/api/auth/google/callback`. Sem elas, `/api/auth/google` retorna 503 e o botao fica oculto. |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | Email de recuperacao de senha. Sem SMTP, o pedido e so registrado no log (sem email). Ex. Gmail: `smtp.gmail.com:587`, `SMTP_SECURE=false`, `SMTP_PASS` = senha de app. |
| `APP_BASE_URL` | URL publica usada no link do email de reset. Ex.: `http://18.218.26.112:3000` ou `https://painel.seudominio.com` |
| `PASSWORD_RESET_EXPIRES_HOURS` | Validade do token de reset em horas (padrao: `2`) |

### Exemplos de `.env`

Windows (`app\.env`) - o projeto traz o PostgreSQL embutido em `pgsql/`:

```text
PORT=3000
DATABASE_URL=postgres://postgres:suasenha@127.0.0.1:5432/gestor
PG_SUPER_USER=postgres
PG_SUPER_PASSWORD=suasenha
PG_BIN=C:\caminho\para\gestor-multi-tenant\pgsql\bin
SESSION_SECRET=alguma-chavesecreta
ADMIN_EMAIL=admin@admin.com
ADMIN_PASSWORD=admin123
SEED_DEMO_DATA=true
COOKIE_SECURE=false
```

Linux / VPS (`/opt/gestor-multi-tenant/.env`) - gerado pelo instalador:

```text
PORT=3000
DATABASE_URL=postgres://gestor:senha-gerada@127.0.0.1:5432/gestor
SESSION_SECRET=chave-gerada-automaticamente
ADMIN_EMAIL=admin@admin.com
ADMIN_PASSWORD=senha-gerada
SEED_DEMO_DATA=false
COOKIE_SECURE=false
```

> Nota: `ADMIN_EMAIL`/`ADMIN_PASSWORD` so sao usados para **criar** o usuario
> administrador na primeira vez que o servidor roda. Depois disso, mudar essas
> variaveis no `.env` nao muda a senha ja salva - isso e proposital, para
> nao resetar sua senha sem querer a cada reinicio. Use a tela de "Recuperar
> senha" do proprio sistema para troca-la depois.

---

## Estrutura do projeto

```
gestor-multi-tenant/
├── app/                    # a aplicacao em si (Node.js + frontend)
│   ├── server.js           # ponto de entrada do servidor Express
│   ├── package.json
│   ├── .env.example        # modelo do arquivo de configuracao
│   ├── src/
│   │   ├── data/           # camada de dados (store PostgreSQL + seed)
│   │   ├── middleware/      # autenticacao por sessao
│   │   ├── routes/         # rotas da API (clientes, funcionarios, etc.)
│   │   └── utils/           # PostgreSQL, backups, e-mail, pagamentos, etc.
│   ├── public/              # frontend (HTML/CSS/JS puro, sem build)
│   └── data/                 # runtime: sessoes e backups internos em .zip
├── pgsql/                  # PostgreSQL embutido (somente Windows)
├── pgdata/                 # dados do PostgreSQL embutido (somente Windows)
└── scripts/
    ├── install.sh           # instalador principal
    ├── start.sh / stop.sh / restart.sh / logs.sh
    ├── backup.sh
    ├── update.sh
    └── uninstall.sh
```

---

## Como os dados sao guardados

Os dados ficam no PostgreSQL local (banco `gestor`, acessivel apenas em
`127.0.0.1`), que e instalado e configurado automaticamente pelo
`scripts/install.sh`. No Windows, o projeto usa o PostgreSQL embutido na pasta
`pgsql/` (sem precisar instalar nada). Recomendamos rodar
`sudo bash scripts/backup.sh` periodicamente (ou colocar num cron job) para
ter copias de seguranca: o script gera um dump SQL do banco + a pasta `data/`
+ o `.env` em um unico `.tar.gz`.

Exemplo de backup automatico diario as 3h da manha (`crontab -e` como root):

```
0 3 * * * /usr/bin/bash /caminho/do/projeto/scripts/backup.sh >> /var/log/gestor-backup.log 2>&1
```

(ajuste o caminho do `scripts/backup.sh` conforme onde esta o projeto clonado/extraido,
ou copie a pasta `scripts/` para dentro de `/opt/gestor-multi-tenant/`)

---

## Solucao de problemas

**O servico nao inicia depois do install.sh**
```bash
sudo journalctl -u gestor-multi-tenant -n 100 --no-pager
```
Normalmente indica porta ja em uso, `DATABASE_URL` incorreta ou o PostgreSQL
parado (`sudo systemctl status postgresql`). O instalador testa a aplicacao no
final; se ele mostrou a URL respondendo, a instalacao esta OK.

**Esqueci a senha do administrador**
A senha gerada automaticamente aparece no resumo final do `install.sh` e fica
salva em `/opt/gestor-multi-tenant/.env` (variavel `ADMIN_PASSWORD` - lembre
que essa variavel so vale para a criacao inicial do usuario, entao o valor
salvo la e o mesmo que foi usado para criar a conta).

**Quero trocar de porta ou de dominio depois**
Edite `/opt/gestor-multi-tenant/.env` (porta) ou o arquivo do Nginx em
`/etc/nginx/sites-available/gestor-multi-tenant` (dominio), depois rode
`sudo bash scripts/restart.sh` e/ou `sudo systemctl restart nginx`.

---

## Backups pelo painel (administrador)

Alem do `scripts/backup.sh` (que gera um dump SQL do PostgreSQL), o proprio
sistema faz backup **do site inteiro** (codigo + configuracoes + dados) em um
`.zip` salvo em `app/data/backups/`:

- **Automatico**: a cada 6 horas (configuravel em `.env` via
  `BACKUP_INTERVAL_HOURS`), mantendo os 30 mais recentes (`BACKUP_MAX_FILES`);
- **Manual**: no painel, menu **Backups** (visivel so para o administrador da
  plataforma) -> botao "Criar Backup Agora";
- **Restaurar / Baixar / Excluir**: qualquer backup pode ser restaurado a
  qualquer momento pela mesma tela. Ao restaurar, o sistema cria antes um
  snapshot "Pre-restauro" automaticamente; reinicie o servidor depois da
  restauracao para que o codigo restaurado entre em vigor.

---

## Seguranca (recomendado)

- Troque a senha padrao do administrador assim que possivel;
- Se for expor a aplicacao na internet, configure um dominio + HTTPS (o
  `install.sh` faz isso automaticamente se voce responder "s" na pergunta
  sobre Nginx/Certbot);
- Mantenha o `.env` privado (o instalador ja deixa com permissao 600).
