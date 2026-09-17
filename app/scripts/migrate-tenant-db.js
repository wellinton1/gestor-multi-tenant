// Migracao de um tenant para banco dedicado (Nivel 2, docs/TENANT_SCALING.md §4).
//
// Uso:
//   node scripts/migrate-tenant-db.js <establishmentId> <targetDatabaseUrl> [--keep-source] [--create-db]
//
//   --create-db    cria o banco destino se nao existir (conecta no banco `postgres`)
//   --keep-source  copia sem apagar da origem (padrao: move, apaga da origem)
//
// Passos:
//   1. Valida que o estabelecimento existe no banco padrao.
//   2. (opcional) cria o banco destino.
//   3. Registra o banco dedicado, copia as linhas do tenant e remove da origem.
//   4. Imprime o trecho para adicionar ao .env e reiniciar.
//
// Exemplo:
//   node scripts/migrate-tenant-db.js abc123 "postgres://gestor:senha@127.0.0.1:5432/gestor_lojaX" --create-db
require('dotenv').config();
const { Client } = require('pg');
const { ensurePostgres } = require('../src/utils/pg-embedded');
const store = require('../src/data/store');
const { runAsAdmin } = require('../src/data/tenant-context');

function parseTarget(url) {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: Number(u.port || 5432),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, '')
  };
}

async function createDatabaseIfNeeded(targetUrl) {
  const cfg = parseTarget(targetUrl);
  if (!cfg.database) throw new Error('URL destino sem nome de banco.');
  const admin = new Client({
    host: cfg.host, port: cfg.port, user: cfg.user, password: cfg.password, database: 'postgres',
    connectionTimeoutMillis: 5000
  });
  await admin.connect();
  try {
    const exists = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [cfg.database]);
    if (exists.rowCount === 0) {
      await admin.query(`CREATE DATABASE "${cfg.database}"`);
      console.log(`Banco "${cfg.database}" criado.`);
    } else {
      console.log(`Banco "${cfg.database}" ja existe.`);
    }
  } finally {
    await admin.end();
  }
}

async function main() {
  const [estId, targetUrl, ...flags] = process.argv.slice(2);
  if (!estId || !targetUrl) {
    console.error('Uso: node scripts/migrate-tenant-db.js <establishmentId> <targetDatabaseUrl> [--keep-source] [--create-db]');
    process.exit(1);
  }
  if (!/^postgres(ql)?:\/\//.test(targetUrl)) throw new Error('targetDatabaseUrl precisa ser postgres://...');
  if (flags.includes('--create-db')) await createDatabaseIfNeeded(targetUrl);

  await ensurePostgres();
  await store.init();
  await store.flush();

  const est = runAsAdmin(() => store.findById('establishments', estId));
  if (!est) {
    console.error(`Estabelecimento ${estId} nao encontrado no banco padrao.`);
    process.exit(1);
  }
  const before = runAsAdmin(() => ({
    clients: store.allScoped('clients', estId).length,
    appointments: store.allScoped('appointments', estId).length,
    services: store.allScoped('services', estId).length
  }));
  console.log(`Migrando "${est.name}" (${estId}):`, before);

  await store.registerTenantDatabase(estId, targetUrl);
  const res = await runAsAdmin(() =>
    store.migrateTenantData(estId, { deleteFromSource: !flags.includes('--keep-source') })
  );
  await store.flush();

  const after = runAsAdmin(() => ({
    clients: store.allScoped('clients', estId).length,
    appointments: store.allScoped('appointments', estId).length
  }));
  console.log('Migracao concluida:', res);
  console.log('Contagem pos-migracao (via banco dedicado):', after);
  console.log('');
  console.log('Adicione ao .env e reinicie:');
  console.log(`TENANT_DATABASE_OVERRIDES='{"${estId}":"${targetUrl}"}'`);
  console.log('(merge com entradas existentes se ja houver)');
  await store.close();
  process.exit(0);
}

main().catch((e) => { console.error('ERRO:', e.message); process.exit(1); });
