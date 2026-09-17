// Testes da camada de Row-Level Security (RLS) no PostgreSQL.
//
// Valida que o banco, sozinho, recusa acesso a dados de outro tenant mesmo
// quando a consulta nao tem filtro por establishmentId:
//   - RLS habilitado + FORCE nas tabelas de tenant;
//   - sem contexto => default deny (nenhuma linha visivel/gravavel);
//   - contexto do tenant A => apenas linhas de A;
//   - escrita de linha do tenant B no contexto A => erro;
//   - contexto de administrador (bypass) => todas as linhas.
//
// Roda com: node --test test/rls.test.js  (ou npm run test:isolation)

const path = require('path');
process.env.STORE_PG_SYNC = 'false';
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const test = require('node:test');
const assert = require('node:assert/strict');
const { v4: uuid } = require('uuid');

const { ensurePostgres } = require('../src/utils/pg-embedded');
const store = require('../src/data/store');
const { runAsAdmin } = require('../src/data/tenant-context');
const { rlsStatus } = require('../src/data/rls');

let tenantA;
let tenantB;
let clientA;
let clientB;

async function withTransaction(fn) {
  const client = await store.getPool().connect();
  try {
    await client.query('BEGIN');
    return await fn(client);
  } finally {
    try { await client.query('ROLLBACK'); } catch (e) { /* ignore */ }
    client.release();
  }
}

test.before(async () => {
  await ensurePostgres();
  await store.init();

  tenantA = 'test-rls-A-' + uuid();
  tenantB = 'test-rls-B-' + uuid();
  clientA = 'test-rls-client-A-' + uuid();
  clientB = 'test-rls-client-B-' + uuid();

  runAsAdmin(() => {
    store.insert('establishments', { id: tenantA, name: 'Teste RLS A', niche: 'Outro', createdAt: new Date().toISOString() });
    store.insert('establishments', { id: tenantB, name: 'Teste RLS B', niche: 'Outro', createdAt: new Date().toISOString() });
    store.insert('clients', { id: clientA, establishmentId: tenantA, name: 'Cliente RLS A', createdAt: new Date().toISOString() });
    store.insert('clients', { id: clientB, establishmentId: tenantB, name: 'Cliente RLS B', createdAt: new Date().toISOString() });
  });
  await store.flush();
});

test.after(async () => {
  try {
    runAsAdmin(() => {
      store.remove('clients', clientA);
      store.remove('clients', clientB);
      store.remove('establishments', tenantA);
      store.remove('establishments', tenantB);
    });
    await store.flush();
  } finally {
    await store.close();
  }
});

test('RLS esta habilitado e FORCADO nas tabelas de tenant', async () => {
  const rows = await rlsStatus(store.getPool());
  // PostgreSQL guarda nomes fisicos em minusculas (cashClosings -> cashclosings).
  const byTable = Object.fromEntries(rows.map((r) => [r.table.toLowerCase(), r]));
  for (const table of ['clients', 'employees', 'services', 'appointments', 'cashClosings', 'coupons', 'establishments']) {
    const physical = table.toLowerCase();
    assert.ok(byTable[physical], `tabela ${table} existe`);
    assert.equal(byTable[physical].enabled, true, `RLS habilitado em ${table}`);
    assert.equal(byTable[physical].forced, true, `RLS FORCE em ${table}`);
  }
});

test('sem contexto de tenant, nenhuma linha de nenhum tenant e visivel (default deny)', async () => {
  await withTransaction(async (client) => {
    const res = await client.query('SELECT id FROM clients');
    assert.equal(res.rowCount, 0, 'SELECT sem contexto nao retorna linhas');
  });
});

test('contexto do tenant A ve apenas linhas de A', async () => {
  await withTransaction(async (client) => {
    await client.query(`SELECT set_config('app.establishment_id', $1, true)`, [tenantA]);
    const res = await client.query('SELECT id, data FROM clients');
    const ids = res.rows.map((r) => r.id);
    assert.ok(ids.includes(clientA), 'cliente A visivel');
    assert.ok(!ids.includes(clientB), 'cliente B NAO visivel');
    for (const row of res.rows) {
      assert.equal(row.data.establishmentId, tenantA, 'toda linha retornada pertence ao tenant A');
    }
  });
});

test('escrita de linha de outro tenant e recusada pelo banco', async () => {
  await withTransaction(async (client) => {
    await client.query(`SELECT set_config('app.establishment_id', $1, true)`, [tenantA]);
    // SQLSTATE 42501 = insufficient privilege (violacao de RLS); a mensagem
    // varia conforme o locale do servidor (PT-BR ou EN).
    await assert.rejects(
      client.query(
        `INSERT INTO clients (id, data) VALUES ($1, $2::jsonb)`,
        ['test-rls-forbidden-' + uuid(), JSON.stringify({ establishmentId: tenantB, name: 'Invasor' })]
      ),
      (err) => err.code === '42501' || /row-level security|n[ií]vel de linha/i.test(err.message),
      'INSERT com establishmentId de outro tenant deve falhar'
    );
  });
});

test('contexto de administrador (bypass) enxerga os dois tenants', async () => {
  await withTransaction(async (client) => {
    await client.query(`SELECT set_config('app.admin_context', 'on', true)`);
    const res = await client.query('SELECT id FROM clients WHERE id = ANY($1::text[])', [[clientA, clientB]]);
    assert.equal(res.rowCount, 2, 'bypass de admin ve A e B');
  });
});

test('a coluna gerada establishment_id espelha data->>establishmentId', async () => {
  await withTransaction(async (client) => {
    await client.query(`SELECT set_config('app.admin_context', 'on', true)`);
    const res = await client.query('SELECT establishment_id FROM clients WHERE id = $1', [clientA]);
    assert.equal(res.rows[0].establishment_id, tenantA);
  });
});
