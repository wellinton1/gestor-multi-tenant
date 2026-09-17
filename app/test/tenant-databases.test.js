// Testes de banco dedicado por tenant (Nivel 2).
//
// Cria um banco Postgres separado, move um tenant para ele via
// registerTenantDatabase + migrateTenantData e valida que:
//   - leituras com escopo continuam funcionando (roteadas ao dedicado);
//   - visao unificada (admin) enxerga os dois bancos;
//   - escritas do tenant vao para o dedicado e somem do padrao;
//   - RLS esta ativo tambem no banco dedicado;
//   - isolamento entre tenants se mantem.
//
// Roda com: node --test test/tenant-databases.test.js (ou npm run test:isolation)
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

const suffix = uuid().slice(0, 8);
const ids = {
  tenantA: 'test-dedicated-A-' + suffix,
  tenantB: 'test-dedicated-B-' + suffix,
  clientA: 'test-dedicated-client-A-' + suffix,
  clientB: 'test-dedicated-client-B-' + suffix
};
const dedicatedDbName = `gestor_tenant_test_${suffix.replace(/-/g, '')}`.toLowerCase();

function dedicatedUrl() {
  const base = process.env.DATABASE_URL;
  const u = new URL(base);
  u.pathname = '/' + dedicatedDbName;
  return u.toString();
}

test.before(async () => {
  await ensurePostgres();
  await store.init();

  // Banco dedicado vazio no mesmo servidor (criado como superuser, com
  // OWNER = usuario do app; o usuario do app nao tem CREATEDB).
  const { Client } = require('pg');
  const baseU = new URL(process.env.DATABASE_URL);
  const appUser = decodeURIComponent(baseU.username);
  const superUser = process.env.PG_SUPER_USER || 'postgres';
  const superPassword = process.env.PG_SUPER_PASSWORD || decodeURIComponent(baseU.password);
  const superClient = new Client({
    host: baseU.hostname, port: Number(baseU.port || 5432),
    user: superUser, password: superPassword, database: 'postgres'
  });
  await superClient.connect();
  try {
    await superClient.query(`CREATE DATABASE "${dedicatedDbName}" OWNER "${appUser.replace(/"/g, '""')}"`);
    await superClient.query(`GRANT ALL PRIVILEGES ON DATABASE "${dedicatedDbName}" TO "${appUser.replace(/"/g, '""')}"`);
  } finally {
    await superClient.end();
  }

  runAsAdmin(() => {
    const now = new Date().toISOString();
    store.insert('establishments', { id: ids.tenantA, name: 'Dedicado A', niche: 'Outro', createdAt: now });
    store.insert('establishments', { id: ids.tenantB, name: 'Dedicado B', niche: 'Outro', createdAt: now });
    store.insert('clients', { id: ids.clientA, establishmentId: ids.tenantA, name: 'Cliente A', createdAt: now });
    store.insert('clients', { id: ids.clientB, establishmentId: ids.tenantB, name: 'Cliente B', createdAt: now });
  });
  await store.flush();

  await store.registerTenantDatabase(ids.tenantB, dedicatedUrl());
  await runAsAdmin(() => store.migrateTenantData(ids.tenantB));
  await store.flush();
});

test.after(async () => {
  try {
    runAsAdmin(() => {
      store.remove('clients', ids.clientA);
      store.remove('clients', ids.clientB);
      store.remove('establishments', ids.tenantA);
      store.remove('establishments', ids.tenantB);
    });
    await store.flush();
  } finally {
    const pools = [store.getPool(), store.getPoolFor(ids.tenantB)].filter(Boolean);
    await store.close();
    // Drop do banco dedicado (fora dos pools fechados).
    const { Client } = require('pg');
    const u = new URL(process.env.DATABASE_URL);
    const admin = new Client({
      host: u.hostname, port: Number(u.port || 5432),
      user: decodeURIComponent(u.username), password: decodeURIComponent(u.password),
      database: u.pathname.replace(/^\//, '') || 'postgres'
    });
    await admin.connect();
    try {
      await admin.query(`DROP DATABASE IF EXISTS "${dedicatedDbName}"`);
    } finally {
      await admin.end();
    }
    assert.ok(pools.length >= 1);
  }
});

test('tenant dedicado aparece no roteamento', () => {
  assert.ok(store.isDedicatedTenant(ids.tenantB));
  assert.ok(!store.isDedicatedTenant(ids.tenantA));
  assert.ok(store.listDedicatedTenants().includes(ids.tenantB));
});

test('leituras com escopo funcionam nos dois bancos', () => {
  const a = runAsAdmin(() => store.allScoped('clients', ids.tenantA));
  const b = runAsAdmin(() => store.allScoped('clients', ids.tenantB));
  assert.ok(a.some((r) => r.id === ids.clientA));
  assert.ok(!a.some((r) => r.id === ids.clientB));
  assert.ok(b.some((r) => r.id === ids.clientB));
  assert.ok(!b.some((r) => r.id === ids.clientA));
});

test('visao unificada (admin) enxerga os dois bancos', () => {
  const allIds = runAsAdmin(() => store.all('clients')).map((r) => r.id);
  assert.ok(allIds.includes(ids.clientA));
  assert.ok(allIds.includes(ids.clientB));
  assert.ok(runAsAdmin(() => !!store.findById('clients', ids.clientB)));
});

test('escritas do tenant dedicado ficam no dedicado', async () => {
  const now = new Date().toISOString();
  const newId = 'test-dedicated-new-' + suffix;
  runAsAdmin(() => {
    store.insert('clients', { id: newId, establishmentId: ids.tenantB, name: 'Novo B', createdAt: now });
  });
  await store.flush();
  try {
    const inDedicated = runAsAdmin(() => store.allScoped('clients', ids.tenantB).some((r) => r.id === newId));
    assert.ok(inDedicated);
    // Nao vaza para o escopo do outro tenant.
    const inA = runAsAdmin(() => store.allScoped('clients', ids.tenantA).some((r) => r.id === newId));
    assert.ok(!inA);
    // Linha fisicamente ausente do banco padrao.
    const defaultPool = store.getPool();
    const client = await defaultPool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`SELECT set_config('app.admin_context', 'on', true)`);
      const res = await client.query('SELECT id FROM clients WHERE id = $1', [newId]);
      await client.query('ROLLBACK');
      assert.equal(res.rowCount, 0, 'linha do tenant dedicado nao fica no banco padrao');
    } finally {
      client.release();
    }
  } finally {
    runAsAdmin(() => store.remove('clients', newId));
    await store.flush();
  }
});

test('RLS ativo tambem no banco dedicado', async () => {
  const dedicated = store.getPoolFor(ids.tenantB);
  assert.ok(dedicated && dedicated !== store.getPool());
  const rows = await rlsStatus(dedicated);
  const byTable = Object.fromEntries(rows.map((r) => [r.table.toLowerCase(), r]));
  for (const table of ['clients', 'establishments']) {
    assert.ok(byTable[table], `tabela ${table} existe no dedicado`);
    assert.equal(byTable[table].enabled, true);
    assert.equal(byTable[table].forced, true);
  }
});
