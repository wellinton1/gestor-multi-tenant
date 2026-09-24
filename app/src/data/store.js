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

const NO_ESCAPE_KEYS = new Set(['passwordHash', 'id', 'createdAt', 'passwordChangedAt', 'abacatePayApiKey', 'pixApiKey', 'pixProvider', 'pixBaseUrl', 'pixExtraHeaders']);

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
let cache = null; // { users: [...], establishments: [...], ... } (banco padrao)
let writeQueue = Promise.resolve();
let pendingWrites = 0;
let initPromise = null;
let reloadTimer = null;
let cryptoRef = null;
// Bancos dedicados por tenant (Nivel 2, ver docs/TENANT_SCALING.md §4):
// establishmentId -> Pool / cache. `users` e sempre global (banco padrao).
const tenantPools = new Map();
const tenantCaches = new Map();
// Colecoes globais (nunca roteadas para banco dedicado).
const GLOBAL_COLLECTIONS = new Set(['users']);
// Mapa persistido tenant -> DATABASE_URL dedicado (1 clique no painel, sem
// editar .env nem reiniciar). Fica em data/ (entra no backup .zip).
// Uniao com TENANT_DATABASE_OVERRIDES do .env (.env tem precedencia).
const TENANT_DB_MAP_FILE = path.join(DATA_DIR, 'tenant-databases.json');

function readPersistedTenantMap() {
  try {
    const raw = JSON.parse(fs.readFileSync(TENANT_DB_MAP_FILE, 'utf-8'));
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
    const out = {};
    for (const [estId, url] of Object.entries(raw)) {
      if (typeof estId === 'string' && estId && typeof url === 'string' && /^postgres(ql)?:\/\//.test(url)) {
        out[estId] = url;
      }
    }
    return out;
  } catch (e) {
    return {};
  }
}

function writePersistedTenantMap(map) {
  ensureDataDir();
  const tmp = TENANT_DB_MAP_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(map, null, 2), 'utf-8');
  fs.renameSync(tmp, TENANT_DB_MAP_FILE);
}

function allTenantOverrides() {
  // .env tem precedencia sobre o arquivo persistido.
  return { ...readPersistedTenantMap(), ...parseTenantOverrides() };
}
function uuid() {
  if (!cryptoRef) cryptoRef = require('crypto');
  return cryptoRef.randomUUID ? cryptoRef.randomUUID() : cryptoRef.randomBytes(16).toString('hex');
}

function databaseUrl() {
  return process.env.DATABASE_URL || '';
}

// Mapa establishmentId -> DATABASE_URL do banco dedicado.
// Formato no .env: TENANT_DATABASE_OVERRIDES='{"<estId>":"postgres://..."}'
function parseTenantOverrides() {
  const raw = process.env.TENANT_DATABASE_OVERRIDES || '';
  if (!raw.trim()) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const out = {};
    for (const [estId, url] of Object.entries(parsed)) {
      if (typeof estId === 'string' && estId && typeof url === 'string' && /^postgres(ql)?:\/\//.test(url)) {
        out[estId] = url;
      } else {
        console.warn(`[store] override ignorado para tenant "${estId}" (URL invalida).`);
      }
    }
    return out;
  } catch (err) {
    console.error('[store] TENANT_DATABASE_OVERRIDES invalido (JSON esperado):', err.message);
    return {};
  }
}

function isDedicatedTenant(establishmentId) {
  return !!establishmentId && tenantPools.has(String(establishmentId));
}

// Chave do banco responsavel por uma linha: 'default' ou o establishmentId.
function dbKeyForRow(collection, row) {
  if (GLOBAL_COLLECTIONS.has(collection)) return 'default';
  const tenantId = collection === 'establishments' ? row && row.id : row && row.establishmentId;
  if (tenantId && tenantPools.has(String(tenantId))) return String(tenantId);
  return 'default';
}

function dbKeyForEstablishment(establishmentId) {
  if (establishmentId && tenantPools.has(String(establishmentId))) return String(establishmentId);
  return 'default';
}

function poolForDbKey(dbKey) {
  if (dbKey && dbKey !== 'default') {
    const p = tenantPools.get(String(dbKey));
    if (p) return p;
  }
  return pool;
}

function cacheForDbKey(dbKey) {
  if (dbKey && dbKey !== 'default') {
    const c = tenantCaches.get(String(dbKey));
    if (c) return c;
  }
  return cache;
}

// Pool do tenant (override) ou o padrao. Diagnostico e migracao.
function getPoolFor(establishmentId) {
  if (establishmentId && tenantPools.has(String(establishmentId))) {
    return tenantPools.get(String(establishmentId));
  }
  return pool;
}

function listDedicatedTenants() {
  return [...tenantPools.keys()];
}

function getTenantDatabaseMap() {
  const map = {};
  for (const k of tenantPools.keys()) map[k] = true;
  return map;
}

// Localiza uma linha em todos os bancos (padrao + dedicados).
// Retorna { dbKey, list, idx, row } ou null.
function locateRow(collection, id) {
  const sid = String(id);
  if (GLOBAL_COLLECTIONS.has(collection)) {
    const list = (cache && cache[collection]) || [];
    const idx = list.findIndex((row) => row.id === sid);
    return idx === -1 ? null : { dbKey: 'default', list, idx, row: list[idx] };
  }
  const defaultList = (cache && cache[collection]) || [];
  const defaultIdx = defaultList.findIndex((row) => row.id === sid);
  if (defaultIdx !== -1) return { dbKey: 'default', list: defaultList, idx: defaultIdx, row: defaultList[defaultIdx] };
  for (const [dbKey, c] of tenantCaches.entries()) {
    const list = (c && c[collection]) || [];
    const idx = list.findIndex((row) => row.id === sid);
    if (idx !== -1) return { dbKey, list, idx, row: list[idx] };
  }
  return null;
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
  if (GLOBAL_COLLECTIONS.has(collection) || tenantCaches.size === 0) {
    return cache[collection] || [];
  }
  // Visao unificada (admin): padrao + todos os dedicados.
  const merged = [...(cache[collection] || [])];
  for (const c of tenantCaches.values()) {
    if (c && Array.isArray(c[collection])) merged.push(...c[collection]);
  }
  return merged;
}

function findById(collection, id) {
  if (GLOBAL_COLLECTIONS.has(collection) || tenantCaches.size === 0) {
    return (all(collection).find((row) => row.id === id) || null);
  }
  const found = locateRow(collection, id);
  return found ? found.row : null;
}

function query(collection, predicate) {
  return all(collection).filter(predicate);
}

// ---- leitura com escopo de tenant ----
//
// Preferir estes helpers nas rotas de dados de loja: tornam o filtro por
// establishmentId obrigatorio e centralizado (auditoria mais simples).

function queryScoped(collection, establishmentId, predicate) {
  // Roteado: le apenas do banco responsavel por este tenant (padrao ou dedicado).
  const dbKey = dbKeyForEstablishment(establishmentId);
  const target = cacheForDbKey(dbKey);
  if (!target) return [];
  // `establishments` tem escopo proprio (id == tenant).
  if (collection === 'establishments') {
    const row = (target[collection] || []).find((r) => r.id === establishmentId);
    if (!row) return [];
    return (!predicate || predicate(row)) ? [row] : [];
  }
  return (target[collection] || []).filter((row) =>
    row.establishmentId === establishmentId && (!predicate || predicate(row)));
}

function allScoped(collection, establishmentId) {
  return queryScoped(collection, establishmentId);
}

function findByIdScoped(collection, id, establishmentId) {
  const dbKey = dbKeyForEstablishment(establishmentId);
  const target = cacheForDbKey(dbKey);
  if (!target) return null;
  if (collection === 'establishments') {
    const row = (target[collection] || []).find((r) => r.id === id);
    return row && row.id === establishmentId ? row : null;
  }
  const row = (target[collection] || []).find((r) => r.id === id);
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
// dbKeyOrEstId (opcional): roteia para o banco dedicado do tenant; quando
// omitido, roteia pelo context.establishmentId (ou padrao para admin/global).
async function runInDb(dbKey, context, fn) {
  const targetPool = poolForDbKey(dbKey);
  if (!targetPool) throw new Error('[store] pool indisponivel para o banco solicitado.');
  const client = await targetPool.connect();
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

async function runInContext(context, fn, dbKeyOrEstId) {
  let dbKey = 'default';
  if (dbKeyOrEstId && dbKeyOrEstId !== 'default' && tenantPools.has(String(dbKeyOrEstId))) {
    dbKey = String(dbKeyOrEstId);
  } else if (context && context.establishmentId && tenantPools.has(String(context.establishmentId))) {
    dbKey = String(context.establishmentId);
  }
  return runInDb(dbKey, context, fn);
}

function normalizeDb(db) {
  const next = {};
  for (const c of COLLECTIONS) next[c] = Array.isArray(db[c]) ? db[c] : [];
  return next;
}

// Substitui TODO o conteudo do(s) banco(s) pelo snapshot informado.
// Com bancos dedicados, cada linha e distribuida para o banco do seu tenant
// (users sempre no padrao); cada banco tem seu DELETE+INSERT e seu cache.
async function writeDB(db) {
  return enqueue(async () => {
    const normalized = normalizeDb(db);
    // Agrupa linhas por banco destino.
    const perDb = new Map(); // dbKey -> { collection -> rows }
    const ensureDb = (dbKey) => {
      if (!perDb.has(dbKey)) {
        perDb.set(dbKey, Object.fromEntries(COLLECTIONS.map((c) => [c, []])));
      }
      return perDb.get(dbKey);
    };
    ensureDb('default');
    for (const dbKey of tenantPools.keys()) ensureDb(dbKey);
    for (const c of COLLECTIONS) {
      for (const row of normalized[c]) {
        ensureDb(dbKeyForRow(c, row))[c].push(row);
      }
    }
    for (const [dbKey, slice] of perDb.entries()) {
      await runInDb(dbKey, { admin: true }, async (client) => {
        for (const c of COLLECTIONS) {
          await client.query(`DELETE FROM ${c}`);
          for (const row of slice[c]) {
            await client.query(
              `INSERT INTO ${c} (id, data) VALUES ($1, $2::jsonb)
               ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
              [String(row.id), JSON.stringify(row)]
            );
          }
        }
      });
      const target = cacheForDbKey(dbKey);
      if (target) {
        for (const c of COLLECTIONS) target[c] = slice[c];
      }
    }
  });
}

// Igual a writeDB mas aguarda (usado pelo seed no boot).
function writeDBSync(db) {
  return writeDB(db);
}

function insert(collection, row) {
  if (!cache) throw new Error('[store] init() ainda nao executou.');
  if (!row.id) row = { ...row, id: uuid() };
  const clean = sanitizeRow(row);
  const dbKey = dbKeyForRow(collection, clean);
  const target = cacheForDbKey(dbKey);
  if (!target[collection]) target[collection] = [];
  target[collection].push(clean);
  const context = getContext();
  queueWrite(() => runInDb(dbKey, context, (client) =>
    client.query(
      `INSERT INTO ${collection} (id, data) VALUES ($1, $2::jsonb)
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
      [String(clean.id), JSON.stringify(clean)]
    )
  ));
  return clean;
}

function update(collection, id, patch) {
  if (!cache) throw new Error('[store] init() ainda nao executou.');
  const found = locateRow(collection, id);
  if (!found) return null;
  const cleanPatch = sanitizeRow(patch);
  const merged = { ...found.row, ...cleanPatch, id: found.row.id };
  const newDbKey = dbKeyForRow(collection, merged);
  if (newDbKey !== found.dbKey) {
    // Tenant mudou de banco (ex.: migracao): move a linha.
    found.list.splice(found.idx, 1);
    const target = cacheForDbKey(newDbKey);
    if (!target[collection]) target[collection] = [];
    target[collection].push(merged);
    const context = getContext();
    const oldDbKey = found.dbKey;
    queueWrite(() => runInDb(oldDbKey, context, (client) =>
      client.query(`DELETE FROM ${collection} WHERE id = $1`, [String(id)])
    ));
    queueWrite(() => runInDb(newDbKey, context, (client) =>
      client.query(
        `INSERT INTO ${collection} (id, data) VALUES ($1, $2::jsonb)
         ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
        [String(id), JSON.stringify(merged)]
      )
    ));
    return merged;
  }
  found.list[found.idx] = merged;
  const context = getContext();
  const dbKey = found.dbKey;
  queueWrite(() => runInDb(dbKey, context, (client) =>
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
  const found = locateRow(collection, id);
  if (!found) return false;
  found.list.splice(found.idx, 1);
  const context = getContext();
  const dbKey = found.dbKey;
  queueWrite(() => runInDb(dbKey, context, (client) =>
    client.query(`DELETE FROM ${collection} WHERE id = $1`, [String(id)])
  ));
  return true;
}

// Drena a fila de escritas pendentes (usado por testes e desligamento).
function flush() {
  return enqueue(() => {});
}

// ---- carga / migracao ----

async function loadSnapshotFromPool(targetPool) {
  // Otimizacao: carrega TODAS as collections em uma unica ida ao banco
  // (jsonb_agg) em vez de um SELECT por tabela.
  const client = await targetPool.connect();
  try {
    await client.query('BEGIN');
    await applyContext(client, { admin: true });
    const parts = COLLECTIONS.map(
      (c) => `'${c}', COALESCE((SELECT jsonb_agg(data) FROM ${c}), '[]'::jsonb)`
    ).join(', ');
    const res = await client.query(`SELECT jsonb_build_object(${parts}) AS snapshot`);
    await client.query('COMMIT');
    const snapshot = res.rows[0].snapshot || {};
    const result = {};
    for (const c of COLLECTIONS) result[c] = Array.isArray(snapshot[c]) ? snapshot[c] : [];
    return result;
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (e) { /* ignore */ }
    throw err;
  } finally {
    client.release();
  }
}

async function loadAllIntoCache() {
  cache = await loadSnapshotFromPool(pool);
  for (const [dbKey, targetPool] of tenantPools.entries()) {
    tenantCaches.set(dbKey, await loadSnapshotFromPool(targetPool));
  }
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
    // Bancos dedicados por tenant (Nivel 2). Schema+RLS aplicados em cada um.
    // Mapa = arquivo persistido (1 clique no painel) + .env (precedencia).
    const overrides = allTenantOverrides();
    for (const [estId, url] of Object.entries(overrides)) {
      try {
        const dedicated = new Pool({ connectionString: url, max: 10 });
        await dedicated.query('SELECT 1');
        await ensureSchema(dedicated);
        tenantPools.set(String(estId), dedicated);
        tenantCaches.set(String(estId), normalizeDb({}));
        console.log(`[store] banco dedicado ativo para tenant ${estId}.`);
      } catch (err) {
        console.error(`[store] FALHA no banco dedicado do tenant ${estId}:`, err.message);
      }
    }
    // Snapshot residual em data/db.json: importar SOMENTE se o banco estiver
    // vazio (migracao inicial). Se o banco ja tem dados, um db.json deixado por
    // backup interrompido (ex.: servico parado durante o backup) ou restore
    // antigo NAO pode sobrescrever o estado atual — isso revertia dados e a
    // senha do administrador a cada reinicio/atualizacao. Restores explicitos
    // continuam importando sempre via reloadFromDisk().
    await loadAllIntoCache();
    if (fs.existsSync(DB_FILE)) {
      const hasData = COLLECTIONS.some((c) => (cache[c] || []).length > 0);
      if (hasData) {
        const archive = DB_FILE + '.ignored-' + Date.now();
        fs.renameSync(DB_FILE, archive);
        console.warn('[store] data/db.json residual ignorado (banco ja tem dados). Arquivado como', path.basename(archive));
      } else {
        await importSnapshotFile();
      }
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

// Registra um banco dedicado em tempo de execucao (provisionamento e testes).
// Cria pool, aplica schema+RLS e carrega o cache. Idempotente por tenant.
async function registerTenantDatabase(establishmentId, connectionString) {
  const estId = String(establishmentId);
  if (!estId || !connectionString || !/^postgres(ql)?:\/\//.test(connectionString)) {
    throw new Error('establishmentId e connectionString postgres validos sao obrigatorios.');
  }
  if (!pool) throw new Error('[store] init() ainda nao executou.');
  const existing = tenantPools.get(estId);
  if (existing) {
    try { await existing.end(); } catch (e) { /* ignora */ }
  }
  const dedicated = new Pool({ connectionString, max: 10 });
  await dedicated.query('SELECT 1');
  await ensureSchema(dedicated);
  tenantPools.set(estId, dedicated);
  tenantCaches.set(estId, await loadSnapshotFromPool(dedicated));
  return true;
}

// Move todos os dados de um tenant do banco atual para o banco dedicado
// (ou entre bancos). Copia linhas filtradas por establishmentId + a linha do
// establishment, depois remove da origem. O chamador deve garantir que o
// tenant ja tenha override/registro e deve dar flush() antes/depois.
async function migrateTenantData(establishmentId, options) {
  const estId = String(establishmentId);
  const opts = options || {};
  const deleteFromSource = opts.deleteFromSource !== false;
  await enqueue(() => {}); // drena fila: consistencia
  const snapshot = readDB();
  const tenantRows = {}; // collection -> rows do tenant
  for (const c of COLLECTIONS) {
    if (GLOBAL_COLLECTIONS.has(c)) continue;
    if (c === 'establishments') {
      tenantRows[c] = (snapshot[c] || []).filter((r) => String(r.id) === estId);
    } else {
      tenantRows[c] = (snapshot[c] || []).filter((r) => String(r.establishmentId) === estId);
    }
  }
  const targetDbKey = dbKeyForEstablishment(estId);
  if (targetDbKey === 'default' && !opts.targetDbKey) {
    throw new Error('Tenant sem banco dedicado registrado (TENANT_DATABASE_OVERRIDES ou registerTenantDatabase).');
  }
  const destKey = opts.targetDbKey ? String(opts.targetDbKey) : targetDbKey;
  const destPool = poolForDbKey(destKey);
  if (!destPool) throw new Error('Banco destino indisponivel.');
  // 1. Copia para o destino (upsert por id).
  await runInDb(destKey, { admin: true }, async (client) => {
    for (const c of COLLECTIONS) {
      const rows = tenantRows[c] || [];
      for (const row of rows) {
        await client.query(
          `INSERT INTO ${c} (id, data) VALUES ($1, $2::jsonb)
           ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
          [String(row.id), JSON.stringify(row)]
        );
      }
    }
  });
  // 2. Atualiza caches: garante linhas no destino, remove da origem se pedido.
  const destCache = cacheForDbKey(destKey);
  for (const c of COLLECTIONS) {
    const rows = tenantRows[c] || [];
    if (!rows.length) continue;
    if (!destCache[c]) destCache[c] = [];
    const ids = new Set(destCache[c].map((r) => String(r.id)));
    for (const row of rows) {
      if (!ids.has(String(row.id))) { destCache[c].push(row); ids.add(String(row.id)); }
    }
    if (deleteFromSource) {
      for (const [otherKey, otherCache] of [['default', cache], ...tenantCaches.entries()]) {
        if (otherKey === destKey || !otherCache || !Array.isArray(otherCache[c])) continue;
        otherCache[c] = otherCache[c].filter((r) => {
          if (c === 'establishments') return String(r.id) !== estId;
          return String(r.establishmentId) !== estId;
        });
      }
    }
  }
  // 3. Remove da origem no banco (todas as origens exceto destino).
  if (deleteFromSource) {
    const origins = ['default', ...tenantPools.keys()].filter((k) => k !== destKey);
    for (const originKey of origins) {
      const originPool = poolForDbKey(originKey);
      if (!originPool) continue;
      await runInDb(originKey, { admin: true }, async (client) => {
        for (const c of COLLECTIONS) {
          if (GLOBAL_COLLECTIONS.has(c)) continue;
          if (c === 'establishments') {
            await client.query(`DELETE FROM ${c} WHERE id = $1`, [estId]);
          } else {
            await client.query(`DELETE FROM ${c} WHERE data->>'establishmentId' = $1`, [estId]);
          }
        }
      });
    }
  }
  await loadAllIntoCache();
  return { ok: true, establishmentId: estId, destDbKey: destKey };
}

// ---- provisionamento automatico (1 clique, sem CLI/.env) ----

// Status da ultima operacao por tenant (para a UI acompanhar).
const tenantDbJobs = new Map(); // estId -> { op, status, detail, at }

function setTenantJob(estId, op, status, detail) {
  tenantDbJobs.set(String(estId), { op, status, detail: detail || null, at: new Date().toISOString() });
}

function getTenantJob(estId) {
  return tenantDbJobs.get(String(estId)) || null;
}

function sanitizeDbName(name) {
  return String(name || '').toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 48) || 'tenant';
}

// URL do banco dedicado derivada da DATABASE_URL (mesmo host/porta/user/senha).
function buildDedicatedDbUrl(dbName) {
  const base = databaseUrl();
  if (!base) throw new Error('DATABASE_URL nao configurado.');
  const u = new URL(base);
  u.pathname = '/' + sanitizeDbName(dbName);
  return u.toString();
}

function dbNameFromUrl(url) {
  try {
    return new URL(url).pathname.replace(/^\//, '');
  } catch (e) {
    return '';
  }
}

// CREATE DATABASE tentando: 1) usuario do app (precisa CREATEDB — o
// install.sh garante); 2) superusuario via PG_SUPER_USER/PG_SUPER_PASSWORD.
async function createTenantDatabase(dbName) {
  const safe = sanitizeDbName(dbName);
  if (!safe) throw new Error('Nome de banco invalido.');
  const base = new URL(databaseUrl());
  const appUser = decodeURIComponent(base.username);
  const appPassword = decodeURIComponent(base.password);
  const attempt = async (user, password) => {
    const { Client } = require('pg');
    const admin = new Client({
      host: base.hostname, port: Number(base.port || 5432),
      user, password, database: 'postgres', connectionTimeoutMillis: 8000
    });
    await admin.connect();
    try {
      const exists = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [safe]);
      if (exists.rowCount === 0) {
        await admin.query(`CREATE DATABASE "${safe}" OWNER "${appUser.replace(/"/g, '""')}"`);
      }
      await admin.query(`GRANT ALL PRIVILEGES ON DATABASE "${safe}" TO "${appUser.replace(/"/g, '""')}"`);
    } finally {
      await admin.end();
    }
  };
  try {
    await attempt(appUser, appPassword);
    return safe;
  } catch (err) {
    if (err && (err.code === '42501' || /permission/i.test(err.message || ''))) {
      const superUser = process.env.PG_SUPER_USER || 'postgres';
      const superPassword = process.env.PG_SUPER_PASSWORD || appPassword;
      try {
        await attempt(superUser, superPassword);
        return safe;
      } catch (err2) {
        throw new Error(
          'Sem permissao para criar bancos. Rode como superuser ' +
          '`sudo -u postgres psql -c "ALTER ROLE ' + appUser + ' WITH CREATEDB"` ' +
          'ou defina PG_SUPER_USER/PG_SUPER_PASSWORD no .env.'
        );
      }
    }
    throw err;
  }
}

// Fluxo completo automatico: cria o banco, registra, migra e persiste o mapa.
// Nao precisa editar .env nem reiniciar.
async function provisionDedicatedDatabase(establishmentId, opts) {
  const estId = String(establishmentId);
  const options = opts || {};
  if (!pool) throw new Error('[store] init() ainda nao executou.');
  const est = cache && (cache.establishments || []).find((r) => String(r.id) === estId)
    || [...tenantCaches.values()].flatMap((c) => (c && c.establishments) || []).find((r) => String(r.id) === estId);
  if (!est) throw new Error('Estabelecimento nao encontrado.');
  if (isDedicatedTenant(estId)) return { ok: true, already: true, establishmentId: estId };
  setTenantJob(estId, 'provision', 'running', 'criando banco dedicado');
  try {
    await enqueue(() => {}); // drena escritas pendentes
    const prefix = process.env.TENANT_DB_PREFIX || 'gestor_t_';
    const dbName = sanitizeDbName(options.dbName || (prefix + estId));
    await createTenantDatabase(dbName);
    const url = buildDedicatedDbUrl(dbName);
    await registerTenantDatabase(estId, url);
    const { runAsAdmin } = require('./tenant-context');
    await runAsAdmin(() => migrateTenantData(estId, { deleteFromSource: options.keepSource !== true }));
    await flush();
    const persisted = readPersistedTenantMap();
    persisted[estId] = url;
    writePersistedTenantMap(persisted);
    setTenantJob(estId, 'provision', 'done', dbName);
    return { ok: true, establishmentId: estId, dbName, dedicated: true };
  } catch (err) {
    setTenantJob(estId, 'provision', 'error', err.message);
    throw err;
  }
}

// Volta o tenant para o banco compartilhado (opcionalmente apaga o dedicado).
async function moveTenantToShared(establishmentId, opts) {
  const estId = String(establishmentId);
  const options = opts || {};
  if (!pool) throw new Error('[store] init() ainda nao executou.');
  if (!isDedicatedTenant(estId)) return { ok: true, already: true, establishmentId: estId, dedicated: false };
  setTenantJob(estId, 'move-back', 'running', 'migrando para o banco compartilhado');
  try {
    await enqueue(() => {});
    const { runAsAdmin } = require('./tenant-context');
    await runAsAdmin(() => migrateTenantData(estId, { targetDbKey: 'default', deleteFromSource: true }));
    await flush();
    const dedicated = tenantPools.get(estId);
    tenantPools.delete(estId);
    tenantCaches.delete(estId);
    if (dedicated) {
      try { await dedicated.end(); } catch (e) { /* ignora */ }
    }
    const persisted = readPersistedTenantMap();
    delete persisted[estId];
    writePersistedTenantMap(persisted);
    if (options.dropDatabase) {
      const map = allTenantOverrides();
      const url = map[estId];
      const dbName = url ? dbNameFromUrl(url) : null;
      if (dbName) {
        const base = new URL(databaseUrl());
        const { Client } = require('pg');
        const admin = new Client({
          host: base.hostname, port: Number(base.port || 5432),
          user: decodeURIComponent(base.username), password: decodeURIComponent(base.password),
          database: 'postgres', connectionTimeoutMillis: 8000
        });
        await admin.connect();
        try {
          await admin.query(`DROP DATABASE IF EXISTS "${dbName}"`);
        } finally {
          await admin.end();
        }
      }
    }
    await loadAllIntoCache();
    setTenantJob(estId, 'move-back', 'done', null);
    return { ok: true, establishmentId: estId, dedicated: false };
  } catch (err) {
    setTenantJob(estId, 'move-back', 'error', err.message);
    throw err;
  }
}

// Status de todos os tenants: dedicado ou compartilhado (+ contagens leves).
function getTenantDatabaseStatus() {
  const establishments = all('establishments');
  return establishments.map((est) => {
    const estId = String(est.id);
    const dedicated = isDedicatedTenant(estId);
    const map = allTenantOverrides();
    return {
      establishmentId: estId,
      name: est.name,
      dedicated,
      dbName: dedicated && map[estId] ? dbNameFromUrl(map[estId]) : null,
      job: getTenantJob(estId),
      counts: {
        clients: allScoped('clients', estId).length,
        appointments: allScoped('appointments', estId).length,
        services: allScoped('services', estId).length
      }
    };
  }).sort((a, b) => String(a.name).localeCompare(String(b.name)));
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

// Encerra os pools (testes/desligamento gracioso).
async function close() {
  if (reloadTimer) clearInterval(reloadTimer);
  reloadTimer = null;
  // Reseta o singleton para permitir re-init em testes com outro .env.
  initPromise = null;
  const allPools = [pool, ...tenantPools.values()].filter(Boolean);
  tenantPools.clear();
  tenantCaches.clear();
  cache = null;
  if (pool) pool = null;
  for (const p of allPools) {
    try { await p.end(); } catch (e) { /* ignora */ }
  }
}

// Acesso direto ao pool padrao (diagnostico e testes de RLS).
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
  getPoolFor,
  listDedicatedTenants,
  getTenantDatabaseMap,
  isDedicatedTenant,
  registerTenantDatabase,
  migrateTenantData,
  provisionDedicatedDatabase,
  moveTenantToShared,
  getTenantDatabaseStatus,
  getTenantJob,
  buildDedicatedDbUrl,
  createTenantDatabase,
  ensureSchema,
  COLLECTIONS,
  GLOBAL_COLLECTIONS: [...GLOBAL_COLLECTIONS],
  DATA_DIR,
  DB_FILE
};
