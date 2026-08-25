# Painel de Gestao Multi-Tenant

Sistema de gestao para negocios com agendamento (barbearia, pizzaria, lava jato
e outros nichos): dashboard, agendamentos/pedidos, clientes, funcionarios,
servicos, configuracoes por estabelecimento, e um **portal do cliente** publico
para que seus clientes agendem online.

Feito para rodar em qualquer VPS Linux (Ubuntu/Debian) com pouquissimos
recursos: Node.js puro + um banco de dados em arquivo JSON (sem MySQL,
Postgres ou qualquer coisa que precise compilar nada na VPS).

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

Credenciais padrão iniciais:

```text
Email: admin@admin.com
Senha: admin123
```

> Se quiser alterar a porta, crie um arquivo `.env` na pasta `app` com as variáveis desejadas.

---

## Rodando em uma VPS Linux

Este projeto foi feito para rodar em uma VPS Linux (Ubuntu/Debian) com poucos recursos.

1. Faça upload da pasta inteira do projeto para a VPS via `scp`, `sftp` ou `rsync`.
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

Na primeira execucao o sistema ja cria um estabelecimento de demonstracao
("Barbearia Elite") com dados de exemplo, so para voce ver o sistema
funcionando. Voce pode apagar esse estabelecimento e criar os seus reais
a qualquer momento em "Novo Estabelecimento".

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
| `PORT`            | Porta interna do Node.js (o Nginx, se configurado, aponta para ela)         |
| `SESSION_SECRET`  | Chave aleatoria usada para assinar o cookie de login. Gerada automaticamente. |
| `ADMIN_EMAIL`     | Email de login do administrador                                            |
| `ADMIN_PASSWORD`  | Senha do administrador (so tem efeito na primeira execucao)                |
| `SEED_DEMO_DATA`  | `true`/`false` - cria o estabelecimento de exemplo na primeira execucao     |
| `COOKIE_SECURE`   | Deixe `true` somente se estiver usando HTTPS                               |
| `BACKUP_AUTO_ENABLED` | `true`/`false` - backup automatico do site inteiro em .zip (padrao: `true`) |
| `BACKUP_INTERVAL_HOURS` | Intervalo do backup automatico em horas (padrao: `6`)                 |
| `BACKUP_MAX_FILES` | Quantos backups automaticos manter antes de apagar os mais antigos (padrao: `30`) |

### Exemplos de `.env`

Windows (`app\.env`):

```text
PORT=3000
SESSION_SECRET=alguma-chavesecreta
ADMIN_EMAIL=admin@admin.com
ADMIN_PASSWORD=admin123
SEED_DEMO_DATA=true
COOKIE_SECURE=false
```

Linux / VPS (`/opt/gestor-multi-tenant/.env`):

```text
PORT=3000
SESSION_SECRET=alguma-chavesecreta
ADMIN_EMAIL=admin@admin.com
ADMIN_PASSWORD=admin123
SEED_DEMO_DATA=true
COOKIE_SECURE=false
```

> Nota: `ADMIN_EMAIL`/`ADMIN_PASSWORD` so sao usados para **criar** o usuario
> administrador na primeira vez que o servidor roda. Depois disso, mudar essas
> variaveis no `.env` nao muda a senha ja salva - isso e proposital, para
> nao resetar sua senha sem querer a cada reinicio. Se precisar trocar a senha
> depois, apague o arquivo `data/db.json` (voce perde todos os dados!) ou peca
> ajuda para adicionar uma tela de "trocar senha" no sistema.

---

## Estrutura do projeto

```
gestor-multi-tenant/
├── app/                    # a aplicacao em si (Node.js + frontend)
│   ├── server.js           # ponto de entrada do servidor Express
│   ├── package.json
│   ├── .env.example        # modelo do arquivo de configuracao
│   ├── src/
│   │   ├── data/           # camada de dados (armazenamento em JSON)
│   │   ├── middleware/      # autenticacao por sessao
│   │   └── routes/         # rotas da API (clientes, funcionarios, etc.)
│   ├── public/              # frontend (HTML/CSS/JS puro, sem build)
│   └── data/                 # onde o banco de dados (db.json) e criado em runtime
└── scripts/
    ├── install.sh           # instalador principal
    ├── start.sh / stop.sh / restart.sh / logs.sh
    ├── backup.sh
    ├── update.sh
    └── uninstall.sh
```

---

## Como os dados sao guardados

Para manter a instalacao simples (sem precisar de MySQL/Postgres na VPS), os
dados ficam em um unico arquivo `app/data/db.json`, escrito de forma segura
(gravacao atomica) a cada alteracao. Isso e suficiente para o volume de uso de
um pequeno/medio negocio (ou varios negocios/tenants). Recomendamos rodar
`sudo bash scripts/backup.sh` periodicamente (ou colocar num cron job) para
ter copias de seguranca.

Exemplo de backup automatico diario as 3h da manha (`crontab -e` como root):

```
0 3 * * * /usr/bin/bash /opt/gestor-multi-tenant/../scripts/backup.sh >> /var/log/gestor-backup.log 2>&1
```

(ajuste o caminho do `scripts/backup.sh` conforme onde voce extraiu o projeto)

---

## Solucao de problemas

**O servico nao inicia depois do install.sh**
```bash
sudo journalctl -u gestor-multi-tenant -n 100 --no-pager
```
Normalmente indica porta ja em uso, ou permissao de arquivo. Confira se outra
aplicacao ja esta usando a porta configurada.

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

Alem do `scripts/backup.sh`, o proprio sistema faz backup **do site inteiro**
(codigo + configuracoes + banco `db.json`) em um `.zip` salvo em
`app/data/backups/`:

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
