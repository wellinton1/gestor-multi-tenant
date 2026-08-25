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

// Atualiza as configuracoes do backup automatico (intervalo / pausar)
router.put('/settings', (req, res) => {
  try {
    const body = req.body || {};
    const patch = {};
    if ('autoEnabled' in body) {
      if (typeof body.autoEnabled !== 'boolean') {
        return res.status(400).json({ error: 'autoEnabled deve ser true ou false.' });
      }
      patch.autoEnabled = body.autoEnabled;
    }
    if ('intervalHours' in body) {
      const n = Number(body.intervalHours);
      if (!Number.isFinite(n) || n < 1 || n > 168) {
        return res.status(400).json({ error: 'Intervalo deve ser entre 1 e 168 horas.' });
      }
      patch.intervalHours = n;
    }
    if (!('autoEnabled' in patch) && !('intervalHours' in patch)) {
      return res.status(400).json({ error: 'Nada para atualizar.' });
    }
    const config = backups.updateBackupSettings(patch);
    res.json({ ok: true, config });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Erro ao salvar configuracoes.' });
  }
});

// Cria um backup agora (manual)
router.post('/', async (req, res, next) => {
  try {
    const created = await backups.createBackup('manual');
    res.status(201).json({ ok: true, ...created });
  } catch (err) { next(err); }
});

// Upload de um backup .zip (ex.: baixado antes ou vindo de outra maquina).
// O arquivo vem cru no corpo da requisicao; valida estrutura antes de salvar.
router.post('/upload', express.raw({ type: () => true, limit: '500mb' }), (req, res) => {
  try {
    const saved = backups.saveUploadedBackup(req.body);
    res.status(201).json({ ok: true, ...saved });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Falha ao salvar o backup enviado.' });
  }
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
