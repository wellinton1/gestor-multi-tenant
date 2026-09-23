// Backup e restauracao do site inteiro em .zip.
//
// - O zip contem todo o projeto (codigo + frontend + data/db.json), excluindo
//   node_modules, .git, logs e a propria pasta de backups.
// - Tipos de backup: 'manual' (botao do admin), 'auto' (agendador) e
//   'pre-restore' (seguranca criado automaticamente antes de restaurar).
// - Usa apenas dependencias JS puras (adm-zip), sem compilacao nativa.

const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const store = require('../data/store');

const APP_ROOT = path.join(__dirname, '..', '..');
const BACKUP_DIR = path.join(store.DATA_DIR, 'backups');
// Configuracao editavel pela UI (sobrepoe o .env); persiste entre reinicios
// e entra no backup por estar dentro de data/.
const SETTINGS_FILE = path.join(store.DATA_DIR, 'backup-config.json');
const FILENAME_REGEX = /^backup-(manual|auto|pre-restore|upload)-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.zip$/;

const EXCLUDED_TOP_DIRS = new Set(['node_modules', '.git', 'graphify-out']);
const EXCLUDED_FILES = new Set(['server.log', 'server.err', 'db.json.tmp', 'db.json.lock']);

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

function pad(n) { return String(n).padStart(2, '0'); }

function zipTimestamp(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
}

function readSettingsOverrides() {
  try {
    const raw = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
    return raw && typeof raw === 'object' ? raw : {};
  } catch (e) {
    return {};
  }
}

function writeSettingsOverrides(overrides) {
  if (!fs.existsSync(store.DATA_DIR)) fs.mkdirSync(store.DATA_DIR, { recursive: true });
  const tmp = SETTINGS_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(overrides, null, 2), 'utf-8');
  fs.renameSync(tmp, SETTINGS_FILE);
}

function getBackupConfig() {
  const ov = readSettingsOverrides();
  const intervalRaw = ov.intervalHours !== undefined ? Number(ov.intervalHours) : Number(process.env.BACKUP_INTERVAL_HOURS);
  const intervalHours = Math.min(168, Math.max(1, Number.isFinite(intervalRaw) && intervalRaw > 0 ? Math.floor(intervalRaw) : 6));
  const maxFilesRaw = Number(process.env.BACKUP_MAX_FILES);
  const maxFiles = Math.min(500, Math.max(3, Number.isFinite(maxFilesRaw) && maxFilesRaw > 0 ? Math.floor(maxFilesRaw) : 30));
  return {
    autoEnabled: typeof ov.autoEnabled === 'boolean' ? ov.autoEnabled : (process.env.BACKUP_AUTO_ENABLED !== 'false'),
    intervalHours,
    maxFiles,
    backupDir: BACKUP_DIR
  };
}

// Atualiza as configuracoes editaveis pela UI (autoEnabled e/ou intervalHours).
function updateBackupSettings(patch) {
  const ov = readSettingsOverrides();
  if (typeof patch.autoEnabled === 'boolean') {
    ov.autoEnabled = patch.autoEnabled;
  }
  if (patch.intervalHours !== undefined) {
    const n = Math.floor(Number(patch.intervalHours));
    if (!Number.isFinite(n) || n < 1 || n > 168) {
      throw new Error('Intervalo deve ser entre 1 e 168 horas.');
    }
    ov.intervalHours = n;
  }
  writeSettingsOverrides(ov);
  return getBackupConfig();
}

function isExcludedRel(rel) {
  const norm = rel.replace(/\\/g, '/');
  const top = norm.split('/')[0];
  if (top === 'data' && norm.startsWith('data/backups')) return true;
  if (top === 'data' && norm.startsWith('data/sessions')) return true; // sessoes efemeras
  if (EXCLUDED_TOP_DIRS.has(top)) return true;
  const base = path.basename(norm);
  if (EXCLUDED_FILES.has(base)) return true;
  if (base.endsWith('.tmp') || base.endsWith('.lock')) return true;
  return false;
}

function isValidBackupFilename(filename) {
  return typeof filename === 'string' && FILENAME_REGEX.test(filename);
}

function backupPath(filename) {
  const abs = path.join(BACKUP_DIR, filename);
  if (path.dirname(abs) !== BACKUP_DIR) throw new Error('Nome de arquivo invalido.');
  return abs;
}

function listBackups() {
  ensureBackupDir();
  const cfg = getBackupConfig();
  const files = fs.readdirSync(BACKUP_DIR)
    .filter((f) => isValidBackupFilename(f))
    .sort()
    .reverse();
  let totalSize = 0;
  const backups = files.map((f) => {
    const st = fs.statSync(path.join(BACKUP_DIR, f));
    totalSize += st.size;
    const m = /^backup-([a-z-]+)-/.exec(f);
    return {
      filename: f,
      type: m ? m[1] : 'manual',
      sizeBytes: st.size,
      createdAtMs: st.mtimeMs,
      createdAt: new Date(st.mtime).toISOString()
    };
  });
  return { backups, totalSize, config: { autoEnabled: cfg.autoEnabled, intervalHours: cfg.intervalHours, maxFiles: cfg.maxFiles } };
}

async function createBackup(kind) {
  ensureBackupDir();
  // Exporta o estado atual do PostgreSQL para data/db.json para que o zip
  // continue self-contained (restauravel em qualquer instalacao).
  await store.exportSnapshot(store.DB_FILE);

  try {
    const filename = `backup-${kind}-${zipTimestamp(new Date())}.zip`;
    const dest = path.join(BACKUP_DIR, filename);

    const zip = new AdmZip();
    const addDir = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        const rel = path.relative(APP_ROOT, full);
        if (isExcludedRel(rel)) continue;
        if (entry.isDirectory()) addDir(full);
        else zip.addLocalFile(full, path.dirname(rel).split(path.sep).join('/'), entry.name);
      }
    };
    addDir(APP_ROOT);
    zip.writeZip(dest);
    return { filename, sizeBytes: fs.statSync(dest).size };
  } finally {
    // Remove o export temporario SEMPRE (mesmo se o zip falhar): um db.json
    // residual seria reimportado no proximo boot, revertendo dados e senhas.
    try { fs.unlinkSync(store.DB_FILE); } catch (e) { /* ignora */ }
  }
}

function pruneAutoBackups(maxAuto) {
  ensureBackupDir();
  const autos = fs.readdirSync(BACKUP_DIR)
    .filter((f) => /^backup-auto-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.zip$/.test(f))
    .sort();
  let removed = 0;
  while (autos.length > maxAuto) {
    const oldest = autos.shift();
    try { fs.unlinkSync(path.join(BACKUP_DIR, oldest)); removed += 1; } catch (e) { /* ignora */ }
  }
  return removed;
}

function deleteBackup(filename) {
  if (!isValidBackupFilename(filename)) throw new Error('Nome de arquivo invalido.');
  const abs = backupPath(filename);
  if (!fs.existsSync(abs)) throw new Error('Backup nao encontrado.');
  fs.unlinkSync(abs);
  return true;
}

function copyContained(srcRoot, destRoot) {
  for (const entry of fs.readdirSync(srcRoot, { withFileTypes: true })) {
    const srcFull = path.join(srcRoot, entry.name);
    const rel = path.relative(srcRoot, srcFull);
    const destFull = path.join(destRoot, rel);
    if (!destFull.startsWith(destRoot + path.sep)) continue; // zip-slip guard
    if (entry.isDirectory()) {
      if (!fs.existsSync(destFull)) fs.mkdirSync(destFull, { recursive: true });
      copyContained(srcFull, destRoot);
    } else {
      fs.copyFileSync(srcFull, destFull);
    }
  }
}

async function restoreBackup(filename) {
  if (!isValidBackupFilename(filename)) throw new Error('Nome de arquivo invalido.');
  const abs = backupPath(filename);
  if (!fs.existsSync(abs)) throw new Error('Backup nao encontrado.');

  // 1. Seguranca: snapshot do estado atual antes de sobrescrever nada.
  const safety = await createBackup('pre-restore');

  // 2. Extrai para pasta temporaria fora da arvore restaurada.
  const tmp = path.join(BACKUP_DIR, `.restore-tmp-${Date.now()}`);
  if (fs.existsSync(tmp)) fs.rmSync(tmp, { recursive: true, force: true });
  try {
    new AdmZip(abs).extractAllTo(tmp, true);

    // 3. Copia por cima do projeto (sobrescreve arquivos existentes).
    copyContained(tmp, APP_ROOT);

    // 4. Importa o db.json restaurado para o PostgreSQL (fonte da verdade).
    await store.reloadFromDisk();

    return { ok: true, safetyBackup: safety.filename };
  } finally {
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) { /* ignora */ }
  }
}

function startBackupScheduler() {
  let running = false;
  // Tick fixo de 15 min: reler a configuracao a cada tick faz mudancas feitas
  // na UI (intervalo/pausa) valerem sem reiniciar o servidor.
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const cfg = getBackupConfig();
      if (!cfg.autoEnabled) return;
      const { backups } = listBackups();
      const lastAuto = backups.find((b) => b.type === 'auto');
      const dueMs = cfg.intervalHours * 3600 * 1000;
      if (!lastAuto || Date.now() - lastAuto.createdAtMs >= dueMs) {
        await createBackup('auto');
        pruneAutoBackups(cfg.maxFiles);
        console.log(`Backup automatico criado (intervalo configurado: ${cfg.intervalHours}h).`);
      }
    } catch (err) {
      console.error('Falha no backup automatico:', err.message);
    } finally {
      running = false;
    }
  };
  setTimeout(tick, 15000); // apos o boot: roda se o ultimo estiver vencido
  setInterval(tick, Math.min(getBackupConfig().intervalHours * 3600 * 1000, 15 * 60 * 1000));
  const cfg = getBackupConfig();
  console.log(cfg.autoEnabled
    ? `Backup automatico ativo: a cada ${cfg.intervalHours}h (retencao: ${cfg.maxFiles} arquivos).`
    : 'Backup automatico PAUSADO pela configuracao.');
}

// Valida e grava um backup .zip enviado por upload (Buffer do corpo da requisicao).
function saveUploadedBackup(buffer) {
  ensureBackupDir();
  if (!buffer || !buffer.length || buffer.length > 512 * 1024 * 1024) {
    throw new Error('Arquivo vazio ou maior que 500MB.');
  }
  let zip;
  try {
    zip = new AdmZip(buffer);
  } catch (e) {
    throw new Error('O arquivo nao e um ZIP valido.');
  }
  const names = zip.getEntries().map((e) => e.entryName.replace(/\\/g, '/'));
  if (!names.includes('server.js') || !names.includes('data/db.json')) {
    throw new Error('ZIP invalido: nao parece ser um backup deste sistema (faltam server.js e data/db.json).');
  }
  // Evita sobrescrever um arquivo existente com o mesmo timestamp.
  let filename;
  do {
    filename = `backup-upload-${zipTimestamp(new Date())}.zip`;
  } while (fs.existsSync(path.join(BACKUP_DIR, filename)));
  fs.writeFileSync(path.join(BACKUP_DIR, filename), buffer);
  return { filename, sizeBytes: buffer.length };
}

module.exports = {
  createBackup,
  restoreBackup,
  deleteBackup,
  listBackups,
  isValidBackupFilename,
  saveUploadedBackup,
  updateBackupSettings,
  startBackupScheduler,
  getBackupConfig
};
