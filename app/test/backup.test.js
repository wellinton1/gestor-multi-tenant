// Teste funcional do modulo de backup (roda fora do servidor).
process.env.BACKUP_MAX_FILES = '5';
const backups = require('../src/utils/backup');
const fs = require('fs');
const path = require('path');

function assert(cond, msg) {
  if (!cond) { console.error('FALHOU: ' + msg); process.exitCode = 1; }
  else console.log('ok - ' + msg);
}

(async () => {
  // 1. Criar backup manual
  const created = await backups.createBackup('manual');
  assert(/^backup-manual-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.zip$/.test(created.filename), 'nome do backup manual valido: ' + created.filename);
  assert(created.sizeBytes > 1000, 'zip tem conteudo (' + created.sizeBytes + ' bytes)');

  // 2. Listar
  const list = backups.listBackups();
  assert(list.backups.some(b => b.filename === created.filename), 'backup aparece na lista');
  assert(list.config.intervalHours === 6 && list.config.maxFiles === 5, 'config lida do env (intervalo 6h, retencao 5)');

  // 3. Conteudo do zip: inclui codigo e db.json; exclui node_modules/.git/backups
  const AdmZip = require('adm-zip');
  const zip = new AdmZip(path.join(backups.getBackupConfig().backupDir, created.filename));
  const entries = zip.getEntries().map(e => e.entryName.replace(/\\/g, '/'));
  assert(entries.includes('server.js'), 'zip inclui server.js');
  assert(entries.includes('package.json'), 'zip inclui package.json');
  assert(entries.includes('data/db.json'), 'zip inclui data/db.json');
  assert(entries.some(e => e.startsWith('src/routes/')), 'zip inclui src/');
  assert(entries.some(e => e.startsWith('public/js/')), 'zip inclui public/');
  assert(!entries.some(e => e.startsWith('node_modules/')), 'zip exclui node_modules');
  assert(!entries.some(e => e.startsWith('.git/')), 'zip exclui .git');
  assert(!entries.some(e => e.startsWith('data/backups')), 'zip exclui a propria pasta de backups');

  // 4. Path traversal rejeitado
  let rejected = false;
  try { await backups.restoreBackup('../../evil.zip'); } catch (e) { rejected = true; }
  assert(rejected, 'restaurar com path traversal e rejeitado');
  rejected = false;
  try { backups.deleteBackup('..\\..\\x.zip'); } catch (e) { rejected = true; }
  assert(rejected, 'excluir com path traversal e rejeitado');

  // 5. Roundtrip de restauracao (mesmo conteudo -> inofensivo)
  const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');
  const before = fs.readFileSync(DB_PATH, 'utf-8').length;
  const restored = await backups.restoreBackup(created.filename);
  assert(restored.ok === true, 'restore retorna ok');
  assert(/^backup-pre-restore-/.test(restored.safetyBackup), 'pre-restauro criado: ' + restored.safetyBackup);
  const after = fs.readFileSync(DB_PATH, 'utf-8').length;
  assert(before === after, 'db.json preservado apos restore (' + before + ' bytes)');
  const store = require('../src/data/store');
  assert(Array.isArray(store.all('users')), 'store funciona apos reloadFromDisk');

  // 6. Excluir backups criados no teste (manual + pre-restauro)
  backups.deleteBackup(created.filename);
  backups.deleteBackup(restored.safetyBackup);
  const finalList = backups.listBackups();
  assert(!finalList.backups.some(b => b.filename === created.filename), 'exclusao funciona');
  console.log('\nTeste concluido. Backups restantes:', finalList.backups.length);
})().catch(err => { console.error('ERRO:', err); process.exit(1); });

