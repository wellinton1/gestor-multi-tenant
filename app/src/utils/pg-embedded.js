// Bootstrap do PostgreSQL embutido do projeto.
//
// Garante que o banco esteja rodando e com schema pronto ANTES do servidor
// Express aceitar requisicoes:
//   1. Tenta conectar com as credenciais do app (DATABASE_URL).
//   2. Se falhar, inicia o cluster via pg_ctl (binarios em ../pgsql) e espera.
//   3. Como superusuario, cria role/banco se nao existirem (idempotente).
//   4. Garante as tabelas (idempotente).
//
// Isso elimina a dependencia de um servico Windows/terminal aberto: o
// run-server sobe tudo. Tambem resolve o problema historico de dois processos
// escrevendo db.json (agora o PG serializa as escritas).

const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { Client } = require('pg');
const { COLLECTIONS } = require('../data/store');

const PROJECT_ROOT = path.join(__dirname, '..', '..', '..');
const PG_BIN = process.env.PG_BIN || path.join(PROJECT_ROOT, 'pgsql', 'bin');
const PGDATA = process.env.PGDATA || path.join(PROJECT_ROOT, 'pgdata');
const PG_LOG = process.env.PG_LOG || path.join(PROJECT_ROOT, 'pgdata.log');

function parseUrl(url) {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: Number(u.port || 5432),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, '')
  };
}

async function tryConnect(cfg, database, timeoutMs = 3000) {
  const client = new Client({ ...cfg, database, connectionTimeoutMillis: timeoutMs });
  await client.connect();
  return client;
}

async function clusterInitialized() {
  return fs.existsSync(path.join(PGDATA, 'PG_VERSION'));
}

function runCmd(exe, args, timeoutMs = 60000) {
  return new Promise((resolve, reject) => {
    const child = spawn(exe, args, { stdio: 'ignore', windowsHide: true });
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`Timeout executando ${path.basename(exe)}`));
    }, timeoutMs);
    child.on('error', (err) => { clearTimeout(timer); reject(err); });
    child.on('close', (code) => { clearTimeout(timer); code === 0 ? resolve() : reject(new Error(`${path.basename(exe)} saiu com codigo ${code}`)); });
  });
}

// Inicia o cluster (se necessario) e espera aceitar conexoes.
async function startCluster(superCfg) {
  if (!(await clusterInitialized())) {
    console.log('[pg] pgdata nao inicializado — rodando initdb...');
    fs.mkdirSync(PGDATA, { recursive: true });
    const pwFile = path.join(PGDATA, '..', '.pg-init-pw.txt');
    fs.writeFileSync(pwFile, superCfg.password, 'utf-8');
    try {
      await runCmd(path.join(PG_BIN, 'initdb.exe'), [
        '-D', PGDATA, '-U', superCfg.user,
        `--pwfile=${pwFile}`, '--auth=scram-sha-256', '-E', 'UTF8'
      ], 120000);
    } finally {
      try { fs.unlinkSync(pwFile); } catch (e) { /* ignore */ }
    }
  }
  console.log('[pg] iniciando PostgreSQL via pg_ctl (porta', superCfg.port + ')...');
  await runCmd(path.join(PG_BIN, 'pg_ctl.exe'), [
    '-D', PGDATA, '-l', PG_LOG, '-o', `-p ${superCfg.port}`, 'start'
  ], 90000);
  // Espera conexoes (ate ~30s)
  for (let i = 0; i < 60; i++) {
    try {
      const c = await tryConnect(superCfg, 'postgres', 1500);
      await c.end();
      return;
    } catch (e) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error('PostgreSQL nao aceitou conexoes apos pg_ctl start.');
}

async function ensurePostgres() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL nao configurado no .env');
  const cfg = parseUrl(url);

  // 1. App conecta direto? (cenario normal depois do primeiro boot)
  try {
    const c = await tryConnect(cfg, cfg.database);
    await c.end();
    console.log(`[pg] PostgreSQL acessivel em ${cfg.host}:${cfg.port}/${cfg.database}`);
  } catch (e) {
    // 2. Sobren o cluster e garante role/banco
    const superCfg = {
      host: cfg.host,
      port: cfg.port,
      user: process.env.PG_SUPER_USER || 'postgres',
      password: process.env.PG_SUPER_PASSWORD || cfg.password
    };
    await startCluster(superCfg);

    const admin = await tryConnect(superCfg, 'postgres', 5000);
    try {
      const role = await admin.query("SELECT 1 FROM pg_roles WHERE rolname = $1", [cfg.user]);
      if (role.rowCount === 0) {
        await admin.query(`CREATE ROLE ${cfg.user} LOGIN PASSWORD '${cfg.password.replace(/'/g, "''")}'`);
        console.log(`[pg] role ${cfg.user} criada.`);
      }
      const db = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [cfg.database]);
      if (db.rowCount === 0) {
        await admin.query(`CREATE DATABASE ${cfg.database} OWNER ${cfg.user}`);
        console.log(`[pg] banco ${cfg.database} criado.`);
      }
    } finally {
      await admin.end();
    }
  }

  // 3. Schema idempotente (tabelas + indices)
  const client = await tryConnect(cfg, cfg.database, 5000);
  try {
    for (const c of COLLECTIONS) {
      await client.query(
        `CREATE TABLE IF NOT EXISTS ${c} (
          id TEXT PRIMARY KEY,
          data JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )`
      );
      await client.query(`CREATE INDEX IF NOT EXISTS idx_${c}_data ON ${c} USING GIN (data)`);
    }
  } finally {
    await client.end();
  }
  console.log('[pg] schema verificado/criado.');
}

module.exports = { ensurePostgres, parseUrl, PG_BIN, PGDATA, PG_LOG };
