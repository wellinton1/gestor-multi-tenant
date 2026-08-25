// Simple JSON-file data store with async write queue.
// No native dependencies -> installs cleanly on any VPS with just Node.js.
// Not meant for huge scale, but perfectly fine for a small/medium multi-tenant
// admin panel (dozens of establishments, thousands of records).

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const LOCK_FILE = DB_FILE + '.lock';

const EMPTY_DB = {
  users: [],
  establishments: [],
  employees: [],
  clients: [],
  services: [],
  appointments: [],
  cashClosings: []
};

// Data URI validation regex for images
const DATA_URI_REGEX = /^data:image\/(png|jpeg|jpg|gif|webp|avif|svg\+xml);base64,[A-Za-z0-9+/=]+$/;
const MAX_BASE64_SIZE = 5242880; // 5MB

function isValidDataUri(value, fieldName) {
  if (typeof value !== 'string') return false;
  if (!DATA_URI_REGEX.test(value)) return false;
  // Check approximate decoded size (base64 is ~33% overhead)
  const base64Data = value.split(',')[1];
  if (base64Data && base64Data.length * 0.75 > MAX_BASE64_SIZE) return false;
  return true;
}

// ---- Write queue (single-writer) ----
let writeQueue = Promise.resolve();
let currentDbCache = null;
let cacheValid = false;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readDB() {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    writeDB(EMPTY_DB);
    return JSON.parse(JSON.stringify(EMPTY_DB));
  }
  const raw = fs.readFileSync(DB_FILE, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch (err) {
    // Corrupted file - back it up and start fresh rather than crash the app.
    const backupPath = DB_FILE + '.corrupted.' + Date.now();
    fs.copyFileSync(DB_FILE, backupPath);
    console.error('db.json estava corrompido. Backup salvo em', backupPath);
    writeDB(EMPTY_DB);
    return JSON.parse(JSON.stringify(EMPTY_DB));
  }
}

// Acquire a simple file-based lock (best-effort, works for single-process Node)
function acquireLock() {
  return new Promise((resolve) => {
    const tryLock = () => {
      try {
        // O_EXCL ensures atomic creation - fails if file exists
        fs.openSync(LOCK_FILE, 'wx');
        resolve();
      } catch (e) {
        // Lock held by another process/thread, retry shortly
        setTimeout(tryLock, 5);
      }
    };
    tryLock();
  });
}

function releaseLock() {
  try {
    fs.unlinkSync(LOCK_FILE);
  } catch (e) {
    // Ignore - lock may have been released already
  }
}

// Async write with queue + file lock for safety across processes
async function writeDB(db) {
  return new Promise((resolve, reject) => {
    writeQueue = writeQueue.then(async () => {
      try {
        await acquireLock();
        ensureDataDir();
        const tmpFile = DB_FILE + '.tmp';
        fs.writeFileSync(tmpFile, JSON.stringify(db, null, 2), 'utf-8');
        fs.renameSync(tmpFile, DB_FILE);
        currentDbCache = db;
        cacheValid = true;
        releaseLock();
        resolve();
      } catch (err) {
        releaseLock();
        reject(err);
      }
    }).catch(reject);
  });
}

// Synchronous read with caching (valid after any queued write completes)
function getDB() {
  if (cacheValid && currentDbCache) {
    return currentDbCache;
  }
  const db = readDB();
  currentDbCache = db;
  cacheValid = true;
  return db;
}

function all(collection) {
  return getDB()[collection] || [];
}

function findById(collection, id) {
  return all(collection).find((row) => row.id === id) || null;
}

function query(collection, predicate) {
  return all(collection).filter(predicate);
}

// Campos que contem hashes/tokenes binarios - NAO devem ser HTML-escapados,
// senao caracteres como /, ', " (comuns em bcrypt/base64) sao corrompidos e o
// hash nao pode mais ser verificado. Validacao/escape contra XSS acontece no
// ponto de exibicao (frontend) e em campos textuais visiveis (abaixo).
const NO_ESCAPE_KEYS = new Set(['passwordHash', 'id', 'createdAt', 'passwordChangedAt', 'abacatePayApiKey']);

// Basic sanitization to avoid XSS in textual data
function sanitizeValue(value, fieldName) {
  if (typeof value !== 'string') {
    return value;
  }
  // Remove control chars (exceto tabs e newlines) - todos os campos
  let cleaned = value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  // Valida data URIs para campos de imagem
  if ((fieldName === 'photoDataUrl' || fieldName === 'logoDataUrl') && value) {
    if (!isValidDataUri(value, fieldName)) {
      return ''; // data URI invalido - rejeita
    }
    // nao escapa data URIs (base64 precisa de /, +, =)
    const maxLen = MAX_BASE64_SIZE
    return cleaned.substring(0, maxLen)
  }
  // Hashes/tokenes binarios: nao escapar (corromperia o valor)
  if (NO_ESCAPE_KEYS.has(fieldName)) {
    // so aplica limite de tamanho e remove control chars
    const maxLen = fieldName === 'passwordHash' ? 2048 : 1024
    return cleaned.substring(0, maxLen)
  }
  // Campos textuais visiveis: HTML entity escape para prevenir stored XSS
  cleaned = escapeHtml(cleaned)
  const maxLen = 10240
  return cleaned.substring(0, maxLen)
}

// HTML entity escape function
function escapeHtml(text) {
  return text
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&apos;')
    .replace(/\//g, '&#x2F;')
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

function insert(collection, row) {
  const db = getDB();
  if (!db[collection]) db[collection] = [];
  db[collection].push(sanitizeRow(row));
  writeDB(db); // fire-and-forget, queue ensures order
  return row;
}

function update(collection, id, patch) {
  const db = getDB();
  const list = db[collection] || [];
  const idx = list.findIndex((row) => row.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], ...sanitizeRow(patch), id: list[idx].id };
  writeDB(db);
  return list[idx];
}

function remove(collection, id) {
  const db = getDB();
  const list = db[collection] || [];
  const idx = list.findIndex((row) => row.id === id);
  if (idx === -1) return false;
  list.splice(idx, 1);
  writeDB(db);
  return true;
}

// For seed/bootstrap - waits for write to complete
async function writeDBSync(db) {
  await writeDB(db);
  currentDbCache = db;
  cacheValid = true;
}

// Descarta o cache em memoria para que a proxima leitura releia o db.json
// do disco (usado apos restaurar um backup).
function reloadFromDisk() {
  currentDbCache = null;
  cacheValid = false;
}

module.exports = {
  readDB: getDB,
  writeDB,
  writeDBSync,
  reloadFromDisk,
  all,
  findById,
  query,
  insert,
  update,
  remove,
  DATA_DIR,
  DB_FILE
};