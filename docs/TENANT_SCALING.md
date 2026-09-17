# Escalabilidade Multi-Tenant — Sharding e Bancos Separados

> Complemento de `SAAS_EVOLUTION.md` (§2). Documenta **quando** e **como** sair
> do banco compartilhado, e o que já foi preparado no código para isso.

---

## 1. Estado atual (após hardening de isolamento)

| Camada | Mecanismo | Onde |
|---|---|---|
| Aplicação | Filtro obrigatório por `establishmentId` via helpers `store.allScoped/queryScoped/findByIdScoped` | `src/data/store.js`, todas as rotas de dados |
| Banco | **RLS (Row-Level Security)** com `FORCE`: coluna gerada `establishment_id` + policy `tenant_isolation` keyed no GUC `app.establishment_id` | `src/data/rls.js`, aplicado no boot |
| Contexto | AsyncLocalStorage propaga o tenant da sessão para cada escrita; portal público propaga o tenant da URL | `src/data/tenant-context.js` |
| Testes | Isolamento validado no banco (RLS) e via HTTP entre dois tenants | `test/rls.test.js`, `test/tenant-isolation.test.js` |

Toda query de tenant já passa a existir em duas barreiras. Isso **não** exige
sharding — é o que torna o banco compartilhado seguro até limites bem altos.

---

## 2. Gatilhos para mudar de estratégia (medir, não adivinhar)

| Gatilho | Limite prático | Ação |
|---|---|---|
| Lojas ativas | > ~1.000 | Particionar tabelas grandes por `establishment_id` (ainda 1 banco) |
| Agendamentos por loja/mês | > ~50k | Particionar `appointments` por `establishment_id` (ou por data) |
| Cliente enterprise exige isolamento físico | — | Banco dedicado só para essa loja (ver §4) |
| p95 de latência do painel degrada com cache quente | > ~500ms | Primeiro índices/particionamento; banco dedicado é último recurso |
| Custo/complexidade de backup restore granular | restore de 1 loja demora | Bancos separados facilitam restore por cliente |

**Não migre antes dos gatilhos.** Cada banco separado multiplica custo
operacional (conexões, monitoramento, backups, migrations) — hoje tudo é
idempotente e roda em 1 VPS.

---

## 3. Nível 1 — Particionamento (mesmo banco, mesma VPS)

O groundwork já existe: a coluna `establishment_id` é **gerada e indexada**
em todas as tabelas de tenant (`idx_<tabela>_establishment`).

```sql
-- Exemplo para appointments, quando os gatilhos baterem:
-- 1) criar tabela particionada nova e copiar dados (janela de manutenção)
CREATE TABLE appointments_part (
  id TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  establishment_id TEXT GENERATED ALWAYS AS (data->>'establishmentId') STORED
) PARTITION BY HASH (establishment_id);

-- 2) criar partições (ex.: 8) e mover os dados
-- 3) renomear em transação: appointments -> appointments_old, appointments_part -> appointments
-- RLS/policies são recriadas normalmente pelo boot (ensureRls é idempotente)
```

O aplicativo **não muda nada**: o store continua lendo via cache e escrevendo
por `id`; o RLS continua por `establishment_id`.

---

## 4. Nível 2 — Banco dedicado para cliente de grande porte ✅ IMPLEMENTADO

Cenário: uma loja "enterprise" (franquia com dezenas de milhares de
agendamentos/mês) precisa de isolamento físico e/ou recursos exclusivos.

### Como usar (100% automático pelo painel)

1. Abra a tela de estabelecimentos como **admin da plataforma**.
2. Clique no ícone de **banco de dados** no card da loja → confirmar.
3. Pronto: o sistema **cria o banco sozinho** (`TENANT_DB_PREFIX` + id),
   move todos os dados da loja, persiste o mapa em
   `data/tenant-databases.json` (entra no backup) e ativa o isolamento —
   **sem editar `.env`, sem CLI, sem reiniciar**. O card ganha o selo
   "Banco dedicado"; o mesmo botão volta a loja ao compartilhado.

Alternativas (manual/CLI, mesmo efeito):

```
DATABASE_URL              = postgres://gestor:...@127.0.0.1:5432/gestor   (padrão)
TENANT_DATABASE_OVERRIDES = {"<establishmentId>":"postgres://gestor:...@127.0.0.1:5432/gestor_lojaX"}
```

- `npm run migrate:tenant -- <estId> "postgres://..." --create-db` + entrada
  no `.env` + restart; ou só o `.env` se o banco já existir.
- Automático por volume: `TENANT_AUTO_PROVISION=true` +
  `TENANT_AUTO_MIN_APPOINTMENTS=50000` — a cada 24h migra sozinho lojas
  compartilhadas acima do limite (desligado por padrão).

Rotas não mudam: o contexto de tenant (AsyncLocalStorage) já viaja com a
requisição — o store consulta o pool certo (`getPoolFor(establishmentId)`).
Pré-requisito: o usuário do banco precisa de `CREATEDB` (o `install.sh` já
concede; em installs antigos rode
`sudo -u postgres psql -c "ALTER ROLE gestor WITH CREATEDB"`).

Implementado em `src/data/store.js`: mapa de pools por tenant, cache por
banco (carregado no boot e no timer), RLS/schema aplicados em cada banco
dedicado, `users` sempre global no banco padrão, `migrateTenantData()` move
linhas filtradas por `establishmentId` e remove da origem. Backup em `.zip`
continua unificado (snapshot mesclado); backup granular por cliente via
`pg_dump` do banco dedicado.

### Quando usar

- Somente sob demanda enterprise; volume atual (dezenas/centenas de lojas
  pequenas) continua no banco compartilhado;
- `install.sh`, `backup.sh` e o PostgreSQL embutido do Windows assumem 1 banco
  (dedicados exigem Postgres acessível pela `DATABASE_URL` do override).

---

## 5. Nível 3 — Sharding por instância (multi-VPS)

Somente quando 1 VPS não comportar (CPU/IO saturados, não apenas volume):

1. Um **router de tenants** (mapa `establishmentId -> DATABASE_URL`) em cada
   instância, alimentado por config central (arquivo ou endpoint interno);
2. Diretórios de dados separados por instância (`pgdata-shard-1`, etc.);
3. Portal público e painel continuam funcionando pois o roteamento é por
   tenant, não por usuário;
4. Nginx (porta 80/443) continua sendo o ponto de entrada único; balanceia
   entre instâncias apenas rotas stateless (o estado vive no banco, e sessões
   ficam em `data/sessions` — com múltiplas instâncias seria preciso mover
   sessões para o PostgreSQL ou usar sticky sessions).

**Dependência crítica a resolver antes deste nível:** `express-session` usa
FileStore em disco — multi-instância exige sessão no banco (ex. tabela
`sessions` com `store` do conector `pg`) ou sticky sessions no Nginx.

---

## 6. Checklist operacional (Windows + VPS Ubuntu)

- [x] RLS aplicado automaticamente no boot (`ensureSchema` → `ensureRls`) —
      Windows (PG embutido) e VPS (PG do sistema) não precisam de passo extra;
- [x] `RLS_ENABLED=false` disponível para emergência (isolamento de app mantém);
- [x] Seed incremental: não reescreve o banco a cada boot;
- [x] Cache sincronizado em 1 round-trip por ciclo;
- [ ] Particionamento: só quando gatilhos do §2 baterem;
- [x] Banco por cliente: implementado (§4) — usar só sob demanda enterprise;
- [ ] Sessões no banco: pré-requisito para multi-instância (§5).
