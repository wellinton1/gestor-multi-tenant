const express = require('express');
const path = require('path');
const store = require('../data/store');
const { requireLogin } = require('../middleware/auth');
const { isGlobalAdmin } = require('../utils/access');
const backups = require('../utils/backup');

const router = express.Router();
router.use(requireLogin);

// Todo o gerenciamento de backups e exclusivo do administrador da plataforma.
router.use((req, res, next) => {
  const user = store.findById('users', req.session.userId);
  if (!user || !isGlobalAdmin(user)) {
    return res.status(403).json({ error: 'Apenas o administrador da plataforma pode gerenciar backups.' });
  }
  next();
});

// Lista backups + configuracao do backup automatico
router.get('/', (req, res) => {
  try {
    const { backups: list, totalSize, config } = backups.listBackups();
    res.json({ backups: list, totalSize, config });
  } catch (err) { next(err); }
});

// Cria um backup agora (manual)
router.post('/', async (req, res, next) => {
  try {
    const created = await backups.createBackup('manual');
    res.status(201).json({ ok: true, ...created });
  } catch (err) { next(err); }
});

// Download do .zip
router.get('/:filename/download', (req, res) => {
  try {
    if (!backups.isValidBackupFilename(req.params.filename)) {
      return res.status(400).json({ error: 'Nome de arquivo invalido.' });
    }
    const abs = path.join(backups.getBackupConfig().backupDir, req.params.filename);
    res.download(abs, req.params.filename);
  } catch (err) { next(err); }
});

// Restaura um backup (cria automaticamente um pre-restauro antes)
router.post('/:filename/restore', async (req, res, next) => {
  try {
    const result = await backups.restoreBackup(req.params.filename);
    res.json(result);
  } catch (err) { next(err); }
});

// Exclui um backup
router.delete('/:filename', (req, res) => {
  try {
    backups.deleteBackup(req.params.filename);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
