// PostgreSQL-backed data store com cache em memoria e API sincrona.
//
// Estrategia: o PostgreSQL e a fonte da verdade; o process mantem um cache em
// memoria carregado no boot. Leitura (all/findById/query) e 100% sincrona
// (compativel com todas as rotas existentes). Escritas aplicam no cache na
// hora e persistem no PG de forma assincrona (fila ordenada, fire-and-forget
// com log de erro).
//
// Um timer re-sincroniza o cache a partir do PG a cada 3s (pula se houver
// escritas pendentes), o que mantem multiplos processos eventualmente
// consistentes e elimina o cenario de corrompimento por escrita concorrente
// que existia com db.json.
//
// Compatibilidade mantida com a API anterior do store (arquivo):
//   readDB, writeDB, writeDBSync, reloadFromDisk, all, findById, query,
//   insert, update, remove, DATA_DIR, DB_FILE
// Novidades: init(), exportSnapshot(), COLLECTIONS, helpers com escopo de
// tenant (queryScoped/findByIdScoped), flush(), close().
//
// Isolamento em profundidade: alem do filtro por establishmentId nas rotas,
// toda escrita no PostgreSQL roda dentro de uma transacao com o contexto de
// RLS configurado (app.establishment_id / app.admin_context). Ver rls.js.

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { getContext, runAsAdmin } = require('./tenant-context');
const { ensureRls, applyContext } = require('./rls');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const COLLECTIONS = ['users', 'establishments', 'employees', 'clients', 'services', 'appointments', 'cashClosings', 'coupons'];

const EMPTY_DB = COLLECTIONS.reduce((acc, c) => { acc[c] = []; return acc; }, {});

// ---- sanitizacao (identica ao store de arquivo anterior) ----

const DATA_URI_REGEX = /^data:image\/(png|jpeg|jpg|gif|webp|avif|svg\+xml);base64,[A-Za-z0-9+/=]+$/;
const MAX_BASE64_SIZE = 5242880; // 5MB

function isValidDataUri(value) {
  if (typeof value !== 'string') return false;
  if (!DATA_URI_REGEX.test(value)) return false;
  const base64Data = value.split(',')[1];
  if (base64Data && base64Data.length * 0.75 > MAX_BASE64_SIZE) return false;
  return true;
}

const NO_ESCAPE_KEYS = new Set(['passwordHash', 'id', 'createdAt', 'passwordChangedAt', 'abacatePayApiKey']);

function sanitizeValue(value, fieldName) {
  if (typeof value !== 'string') return value;
  let cleaned = value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  if ((fieldName === 'photoDataUrl' || fieldName === 'logoDataUrl') && value) {
    if (!isValidDataUri(value)) return '';
    const maxLen = MAX_BASE64_SIZE;
    return cleaned.substring(0, maxLen);
  }
  if (NO_ESCAPE_KEYS.has(fieldName)) {
    const maxLen = fieldName === 'passwordHash' ? 2048 : 1024;
    return cleaned.substring(0, maxLen);
  }
  cleaned = escapeHtml(cleaned);
  const maxLen = 10240;
  return cleaned.substring(0, maxLen);
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&apos;')
    .replace(/\//g, '&#x2F;');
}

const PROTO_POLLUTION_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function sanitizeRow(row) {
  if (!row || typeof row !== 'object') return row;
  const sanitized = {};
  for (const [key, value] of Object.entries(row)) {
    if (PROTO_POLLUTION_KEYS.has(key)) continue;
    sanitized[key] = sanitizeValue(value, key);
  }
  return sanitized;
}

// ---- estado interno ----

let pool = null;
let cache = null; // { users: [...], establishments: [...], ... }
let writeQueue = Promise.resolve();
let pendingWrites = 0;
let initPromise = null;
let reloadTimer = null;
let cryptoRef = null;
function uuid() {
  if (!cryptoRef) cryptoRef = require('crypto');
  return cryptoRef.randomUUID ? cryptoRef.randomUUID() : cryptoRef.randomBytes(16).toString('hex');
}

function databaseUrl() {
  return process.env.DATABASE_URL || '';
}

// ---- fila de escrita ----

function enqueue(fn) {
  const run = writeQueue.then(fn);
  writeQueue = run.then(() => {}, () => {});
  return run;
}

function queueWrite(fn) {
  pendingWrites++;
  return enqueue(fn)
    .catch((err) => console.error('[store] falha ao persistir no PostgreSQL:', err.message))
    .finally(() => { pendingWrites--; });
}

// ---- leitura (sincrona, cache) ----

function all(collection) {
  if (!cache) return [];
  return cache[collection] || [];
}

function findById(collection, id) {
  return all(collection).find((row) => row.id === id) || null;
}

function query(collection, predicate) {
  return all(collection).filter(predicate);
}

// ---- leitura com escopo de tenant ----
//
// Preferir estes helpers nas rotas de dados de loja: tornam o filtro por
// establishmentId obrigatorio e centralizado (auditoria mais simples).

function queryScoped(collection, establishmentId, predicate) {
  return query(collection, (row) =>
    row.establishmentId === establishmentId && (!predicate || predicate(row)));
}

function allScoped(collection, establishmentId) {
  return queryScoped(collection, establishmentId);
}

function findByIdScoped(collection, id, establishmentId) {
  const row = findById(collection, id);
  return row && row.establishmentId === establishmentId ? row : null;
}

// Snapshot raso das colecoes (arrays copiados, objetos compartilhados) —
// mesmo comportamento do readDB anterior, usado pelo seed e backups.
function readDB() {
  const snapshot = {};
  for (const c of COLLECTIONS) snapshot[c] = all(c).slice();
  return snapshot;
}

// ---- persistencia ----

// Abre uma transacao, aplica o contexto de RLS e executa fn(client).
// O contexto e capturado no momento da chamada (nao no momento da execucao da
// fila), para que a escrita assincrona use o tenant da requisicao que a criou.
async function runInContext(context, fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await applyContext(client, context);
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (e) { /* ignore */ }
    throw err;
  } finally {
    client.release();
  }
}

function normalizeDb(db) {
  const next = {};
  for (const c of COLLECTIONS) next[c] = Array.isArray(db[c]) ? db[c] : [];
  return next;
}

// Substitui TODO o conteudo do banco pelo snapshot informado.
async function writeDB(db) {
  return enqueue(async () => {
    await runInContext({ admin: true }, async (client) => {
      for (const c of COLLECTIONS) {
        const rows = Array.isArray(db[c]) ? db[c] : [];
        await client.query(`DELETE FROM ${c}`);
        for (const row of rows) {
          await client.query(
            `INSERT INTO ${c} (id, data) VALUES ($1, $2::jsonb)
             ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
            [String(row.id), JSON.stringify(row)]
          );
        }
      }
    });
    cache = normalizeDb(db);
  });
}

// Igual a writeDB mas aguarda (usado pelo seed no boot).
function writeDBSync(db) {
  return writeDB(db);
}

function insert(collection, row) {
  if (!cache) throw new Error('[store] init() ainda nao executou.');
  if (!cache[collection]) cache[collection] = [];
  if (!row.id) row = { ...row, id: uuid() };
  cache[collection].push(sanitizeRow(row));
  const context = getContext();
  queueWrite(() => runInContext(context, (client) =>
    client.query(
      `INSERT INTO ${collection} (id, data) VALUES ($1, $2::jsonb)
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
      [String(row.id), JSON.stringify(sanitizeRow(row))]
    )
  ));
  return row;
}

function update(collection, id, patch) {
  if (!cache) throw new Error('[store] init() ainda nao executou.');
  const list = cache[collection] || [];
  const idx = list.findIndex((row) => row.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], ...sanitizeRow(patch), id: list[idx].id };
  const merged = list[idx];
  const context = getContext();
  queueWrite(() => runInContext(context, (client) =>
    client.query(
      `INSERT INTO ${collection} (id, data) VALUES ($1, $2::jsonb)
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
      [String(id), JSON.stringify(merged)]
    )
  ));
  return merged;
}

function remove(collection, id) {
  if (!cache) throw new Error('[store] init() ainda nao executou.');
  const list = cache[collection] || [];
  const idx = list.findIndex((row) => row.id === id);
  if (idx === -1) return false;
  list.splice(idx, 1);
  const context = getContext();
  queueWrite(() => runInContext(context, (client) =>
    client.query(`DELETE FROM ${collection} WHERE id = $1`, [String(id)])
  ));
  return true;
}

// Drena a fila de escritas pendentes (usado por testes e desligamento).
function flush() {
  return enqueue(() => {});
}

// ---- carga / migracao ----

async function loadAllIntoCache() {
  // Otimizacao: carrega TODAS as collections em uma unica ida ao banco
  // (jsonb_agg) em vez de um SELECT por tabela — roda a cada ciclo de
  // sincronizacao, entao vale reduzir round-trips.
  const next = await runInContext({ admin: true }, async (client) => {
    const parts = COLLECTIONS.map(
      (c) => `'${c}', COALESCE((SELECT jsonb_agg(data) FROM ${c}), '[]'::jsonb)`
    ).join(', ');
    const res = await client.query(`SELECT jsonb_build_object(${parts}) AS snapshot`);
    const snapshot = res.rows[0].snapshot || {};
    const result = {};
    for (const c of COLLECTIONS) result[c] = Array.isArray(snapshot[c]) ? snapshot[c] : [];
    return result;
  });
  cache = next;
}

// Importa data/db.json para o PostgreSQL (migracao inicial e pos-restore).
// Arquiva o arquivo (renomeia) para que o boot seguinte use o PG como
// fonte da verdade e nao re-importe um snapshot antigo por cima de dados novos.
async function importSnapshotFile() {
  const raw = fs.readFileSync(DB_FILE, 'utf-8');
  let db;
  try {
    db = JSON.parse(raw);
  } catch (err) {
    const backupPath = DB_FILE + '.corrupted.' + Date.now();
    fs.copyFileSync(DB_FILE, backupPath);
    console.error('[store] db.json corrompido. Backup salvo em', backupPath);
    throw err;
  }
  await writeDB(db);
  const archive = DB_FILE + '.imported-' + Date.now();
  fs.renameSync(DB_FILE, archive);
  console.log('[store] db.json migrado para o PostgreSQL (arquivado como', path.basename(archive) + ')');
}

// Chamado pelo backup.js apos restaurar um zip: se existir data/db.json
// restaurado, importa para o PG; senao apenas recarrega o cache do PG.
function reloadFromDisk() {
  if (fs.existsSync(DB_FILE)) return importSnapshotFile();
  return loadAllIntoCache();
}

// Exporta o estado atual para data/db.json (usado ANTES de criar o zip de
// backup, para que o zip continue contendo db.json e restaure em qualquer
// instalacao).
async function exportSnapshot(file) {
  await enqueue(() => {}); // drena fila: garante consistencia
  ensureDataDir();
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(readDB(), null, 2), 'utf-8');
  fs.renameSync(tmp, file);
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ---- init ----

function init() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    if (!databaseUrl()) {
      throw new Error('DATABASE_URL nao configurado no .env (ex: postgres://gestor:senha@127.0.0.1:5432/gestor)');
    }
    pool = new Pool({ connectionString: databaseUrl(), max: 10 });
    await pool.query('SELECT 1'); // valida conexao
    await ensureSchema(pool);
    if (fs.existsSync(DB_FILE)) {
      await importSnapshotFile();
    } else {
      await loadAllIntoCache();
    }
    if (process.env.STORE_PG_SYNC !== 'false') {
      reloadTimer = setInterval(() => {
        if (pendingWrites === 0) {
          // Leitura de manutencao: roda com bypass de RLS (contexto de sistema).
          runAsAdmin(() => loadAllIntoCache()).catch(() => {});
        }
      }, 3000);
      if (reloadTimer.unref) reloadTimer.unref();
    }
    console.log('[store] PostgreSQL conectado e cache carregado.');
  })();
  return initPromise;
}

async function ensureSchema(client) {
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
  // Camada extra de isolamento no banco (ver rls.js).
  await ensureRls(client);
}

// Encerra o pool (testes/desligamento gracioso).
async function close() {
  if (reloadTimer) clearInterval(reloadTimer);
  reloadTimer = null;
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// Acesso direto ao pool (diagnostico e testes de RLS).
function getPool() {
  return pool;
}

module.exports = {
  readDB,
  writeDB,
  writeDBSync,
  reloadFromDisk,
  exportSnapshot,
  all,
  findById,
  query,
  allScoped,
  queryScoped,
  findByIdScoped,
  insert,
  update,
  remove,
  flush,
  init,
  close,
  getPool,
  ensureSchema,
  COLLECTIONS,
  DATA_DIR,
  DB_FILE
};
