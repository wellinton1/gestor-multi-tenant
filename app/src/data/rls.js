// Row-Level Security (RLS) do PostgreSQL — camada extra de isolamento entre
// estabelecimentos.
//
// Contexto: os dados ficam em tabelas JSONB (id, data) e o isolamento logico
// e feito nas rotas (filtro por establishmentId). O RLS adiciona uma segunda
// barreira NO BANCO: mesmo que uma consulta esqueca o filtro, o PostgreSQL
// recusa linhas de outro tenant.
//
// Como funciona:
//   - Cada tabela de tenant ganha uma coluna gerada `establishment_id`
//     (extraida de data->>'establishmentId'), indexada.
//   - `ALTER TABLE ... ENABLE/FORCE ROW LEVEL SECURITY` + policy
//     `tenant_isolation` que so libera linhas cujo establishment_id seja igual
//     ao GUC `app.establishment_id` da transacao (ou bypass explicito via GUC
//     `app.admin_context = 'on'`).
//   - A tabela `establishments` usa o proprio `id` como chave do tenant.
//   - A tabela `users` e global (contas da plataforma) e nao entra no RLS.
//
// Default deny: sem GUC configurado, nenhuma linha de tenant e visivel ou
// gravavel. O store configura os GUCs por transacao a partir do contexto de
// requisicao (ver tenant-context.js) ou de operacoes de sistema (runAsAdmin).
//
// Observacao: superusuarios do PostgreSQL ignoram RLS por definicao. Em
// producao o app conecta com o usuario dono do banco (nao-superusuario), e o
// FORCE ROW LEVEL SECURITY garante que nem o dono escape das policies.

const TENANT_GUC = 'app.establishment_id';
const ADMIN_GUC = 'app.admin_context';

// Collections cujo isolamento e por establishmentId.
const TENANT_COLLECTIONS = ['employees', 'clients', 'services', 'appointments', 'cashClosings', 'coupons'];

// Collections em que o proprio id da linha e a chave do tenant.
const SELF_SCOPED_COLLECTIONS = ['establishments'];

function rlsEnabled() {
  return String(process.env.RLS_ENABLED || 'true').toLowerCase() !== 'false';
}

// Aplica/atualiza RLS em todas as tabelas de tenant. Idempotente: pode rodar
// em todo boot (cria coluna/indice/policy somente se faltarem).
async function ensureRls(client) {
  if (!rlsEnabled()) {
    console.warn('[rls] RLS desabilitado via RLS_ENABLED=false (isolamento apenas na aplicacao).');
    return;
  }
  try {
    for (const table of TENANT_COLLECTIONS) {
      await ensureTenantColumn(client, table);
      await ensureTenantPolicy(client, table, 'establishment_id');
    }
    for (const table of SELF_SCOPED_COLLECTIONS) {
      await ensureTenantPolicy(client, table, 'id');
    }
    console.log('[rls] Row-Level Security ativo nas tabelas de tenant.');
  } catch (err) {
    // Nao derruba o boot: o isolamento da aplicacao continua valendo, mas o
    // operador precisa saber que a camada de banco nao foi aplicada.
    console.error('[rls] FALHA ao aplicar RLS (isolamento de banco inativo):', err.message);
    console.error('[rls] Verifique se o usuario do banco e dono das tabelas (DATABASE_URL).');
  }
}

async function ensureTenantColumn(client, table) {
  // PostgreSQL dobra identificadores sem aspas para minusculas
  // (cashClosings -> cashclosings): normalizar para checagens e DDL.
  const physical = table.toLowerCase();
  const existing = await client.query(
    `SELECT 1 FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = $1
        AND column_name = 'establishment_id'`,
    [physical]
  );
  if (existing.rowCount === 0) {
    // Coluna gerada: sempre espelha data->>'establishmentId' (backfill automatico).
    await client.query(
      `ALTER TABLE ${physical}
         ADD COLUMN establishment_id TEXT GENERATED ALWAYS AS (data->>'establishmentId') STORED`
    );
    console.log(`[rls] coluna establishment_id criada em ${table}.`);
  }
  await client.query(`CREATE INDEX IF NOT EXISTS idx_${physical}_establishment ON ${physical} (establishment_id)`);
}

async function ensureTenantPolicy(client, table, tenantColumn) {
  const physical = table.toLowerCase();
  await client.query(`ALTER TABLE ${physical} ENABLE ROW LEVEL SECURITY`);
  await client.query(`ALTER TABLE ${physical} FORCE ROW LEVEL SECURITY`);
  // DROP+CREATE em transacao propria: evita corrida quando multiplos
  // processos (testes em paralelo, multiplos boots) aplicam o RLS juntos.
  await client.query('BEGIN');
  try {
    await client.query(`DROP POLICY IF EXISTS tenant_isolation ON ${physical}`);
    await client.query(
      `CREATE POLICY tenant_isolation ON ${physical}
         USING (
           current_setting('${ADMIN_GUC}', true) = 'on'
           OR ${tenantColumn} = nullif(current_setting('${TENANT_GUC}', true), '')
         )
         WITH CHECK (
           current_setting('${ADMIN_GUC}', true) = 'on'
           OR ${tenantColumn} = nullif(current_setting('${TENANT_GUC}', true), '')
         )`
    );
    await client.query('COMMIT');
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (e) { /* ignora */ }
    // 42710 = policy ja criada por outro processo concorrente: estado final
    // identico ao desejado, pode ignorar.
    if (err && err.code === '42710') return;
    throw err;
  }
}

// Configura os GUCs de RLS na transacao corrente (set_config(..., true) tem
// escopo de transacao). Sem contexto => nenhum GUC => default deny.
async function applyContext(client, context) {
  if (context && context.admin) {
    await client.query(`SELECT set_config('${ADMIN_GUC}', 'on', true)`);
    return;
  }
  const establishmentId = context && context.establishmentId ? String(context.establishmentId) : '';
  await client.query(`SELECT set_config('${TENANT_GUC}', $1, true)`, [establishmentId]);
}

// Checa (para diagnostico/testes) se o RLS esta ativo nas tabelas de tenant.
// Retorna nomes fisicos (minusculas, como o PostgreSQL os guarda).
async function rlsStatus(client) {
  const tables = TENANT_COLLECTIONS.concat(SELF_SCOPED_COLLECTIONS).map((t) => t.toLowerCase());
  const res = await client.query(
    `SELECT relname AS table, relrowsecurity AS enabled, relforcerowsecurity AS forced
       FROM pg_class
      WHERE relname = ANY($1::text[])
      ORDER BY relname`,
    [tables]
  );
  return res.rows;
}

module.exports = {
  TENANT_GUC,
  ADMIN_GUC,
  TENANT_COLLECTIONS,
  SELF_SCOPED_COLLECTIONS,
  rlsEnabled,
  ensureRls,
  applyContext,
  rlsStatus
};
