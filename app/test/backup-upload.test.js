// Teste rapido do upload de backup: zip valido e aceito, invalido rejeitado.
const b = require('../src/utils/backup');
const fs = require('fs');
const path = require('path');

(async () => {
  const dir = b.getBackupConfig().backupDir;
  const made = await b.createBackup('manual');
  const buf = fs.readFileSync(path.join(dir, made.filename));

  const saved = b.saveUploadedBackup(buf);
  console.log('ok - upload salvo como:', saved.filename, `(${saved.sizeBytes} bytes)`);
  if (!/^backup-upload-/.test(saved.filename)) { console.error('FALHOU: prefixo errado'); process.exit(1); }

  try {
    b.saveUploadedBackup(Buffer.from('isto nao e um zip'));
    console.error('FALHOU: aceitou conteudo invalido');
    process.exit(1);
  } catch (e) {
    console.log('ok - zip invalido rejeitado:', e.message);
  }

  // limpa tudo que o teste criou
  [made.filename, saved.filename].forEach((f) => b.deleteBackup(f));
  console.log('limpeza ok -', b.listBackups().backups.length, 'backup(s) restantes');
})().catch((err) => { console.error('ERRO:', err.message); process.exit(1); });
