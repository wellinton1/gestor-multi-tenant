// Testes do provisionamento AUTOMATICO (1 clique, sem CLI/.env).
//
// Valida o fluxo completo: provisionDedicatedDatabase cria o banco sozinho,
// migra a loja, persiste o mapa em data/tenant-databases.json; moveTenantToShared
// volta ao compartilhado. Roda com: node --test test/tenant-auto-provision.test.js
const path = require('path');
const fs = require('fs');
process.env.STORE_PG_SYNC = 'false';
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const test = require('node:test');
const assert = require('node:assert/strict');
const { v4: uuid } = require('uuid');

const { ensurePostgres } = require('../src/utils/pg-embedded');
const store = require('../src/data/store');
const { runAsAdmin } = require('../src/data/tenant-context');

const suffix = uuid().slice(0, 8);
const tenantId = 'test-auto-' + suffix;
const clientId = 'test-auto-client-' + suffix;
const MAP_FILE = path.join(store.DATA_DIR, 'tenant-databases.json');

function mapFileEntries() {
  try {
    return JSON.parse(fs.readFileSync(MAP_FILE, 'utf-8'));
  } catch (e) {
    return null;
  }
}

test.before(async () => {
  await ensurePostgres();
  await store.init();
  const now = new Date().toISOString();
  runAsAdmin(() => {
    store.insert('establishments', { id: tenantId, name: 'Auto Provision', niche: 'Outro', createdAt: now });
    store.insert('clients', { id: clientId, establishmentId: tenantId, name: 'Cliente Auto', createdAt: now });
  });
  await store.flush();
});

test.after(async () => {
  try {
    try {
      await runAsAdmin(() => store.moveTenantToShared(tenantId));
      await store.flush();
    } catch (e) { /* ja no compartilhado */ }
    runAsAdmin(() => {
      try { store.remove('clients', clientId); } catch (e) { /* ignora */ }
      try { store.remove('establishments', tenantId); } catch (e) { /* ignora */ }
    });
    await store.flush();
    // Limpa banco dedicado residual + mapa de teste.
    const { Client } = require('pg');
    const u = new URL(process.env.DATABASE_URL);
    const admin = new Client({
      host: u.hostname, port: Number(u.port || 5432),
      user: process.env.PG_SUPER_USER || 'postgres',
      password: process.env.PG_SUPER_PASSWORD || decodeURIComponent(u.password),
      database: 'postgres'
    });
    await admin.connect();
    try {
      const dbs = await admin.query(
        `SELECT datname FROM pg_database WHERE datname LIKE 'gestor_t_testauto%'`
      );
      for (const row of dbs.rows) {
        await admin.query(`DROP DATABASE IF EXISTS "${row.datname}"`);
      }
    } finally {
      await admin.end();
    }
    try {
      const map = mapFileEntries() || {};
      delete map[tenantId];
      if (Object.keys(map).length === 0 && fs.existsSync(MAP_FILE)) fs.unlinkSync(MAP_FILE);
    } catch (e) { /* ignora */ }
  } finally {
    await store.close();
  }
});

test('provision automatico: cria banco, migra e persiste o mapa', async () => {
  const res = await runAsAdmin(() => store.provisionDedicatedDatabase(tenantId));
  await store.flush();
  assert.equal(res.ok, true);
  assert.equal(res.dedicated, true);
  assert.ok(res.dbName, 'nome do banco retornado');
  assert.ok(store.isDedicatedTenant(tenantId), 'tenant roteado ao dedicado');

  const scoped = runAsAdmin(() => store.allScoped('clients', tenantId));
  assert.ok(scoped.some((r) => r.id === clientId), 'dados acessiveis no dedicado');

  const persisted = mapFileEntries();
  assert.ok(persisted && persisted[tenantId], 'mapa persistido em tenant-databases.json');

  const status = runAsAdmin(() => store.getTenantDatabaseStatus());
  const mine = status.find((s) => s.establishmentId === tenantId);
  assert.ok(mine && mine.dedicated === true, 'status marca dedicado');

  const again = await runAsAdmin(() => store.provisionDedicatedDatabase(tenantId));
  assert.equal(again.already, true, 'segundo provision e idempotente');
});

test('volta ao compartilhado mantendo os dados', async () => {
  const res = await runAsAdmin(() => store.moveTenantToShared(tenantId));
  await store.flush();
  assert.equal(res.ok, true);
  assert.equal(res.dedicated, false);
  assert.ok(!store.isDedicatedTenant(tenantId));

  const scoped = runAsAdmin(() => store.allScoped('clients', tenantId));
  assert.ok(scoped.some((r) => r.id === clientId), 'dados intactos no compartilhado');

  const persisted = mapFileEntries() || {};
  assert.ok(!persisted[tenantId], 'mapa limpo apos voltar');
});
