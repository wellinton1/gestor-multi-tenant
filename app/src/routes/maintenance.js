// Central de Manutencao (sala de maquinas do sistema).
//
// Pagina separada, exclusiva do administrador da plataforma, que concentra
// tudo que e operacao em um so lugar, com explicacao em cada card:
// saude do sistema, backups, bancos dedicados, atualizacao e reinicio.
//
//   GET  /api/maintenance/status    snapshot (sem segredos: senhas nunca saem)
//   POST /api/maintenance/restart   reinicia o processo (systemd sobe de novo;
//                                   no Windows, reabra o run-server.bat)
const express = require('express');
const store = require('../data/store');
const { requireLogin } = require('../middleware/auth');
const { isGlobalAdmin } = require('../utils/access');
const { runAsAdmin } = require('../data/tenant-context');

const router = express.Router();
router.use(requireLogin);
router.use((req, res, next) => {
  const user = store.findById('users', req.session.userId);
  if (!user || !isGlobalAdmin(user)) {
    return res.status(403).json({ error: 'Apenas o administrador da plataforma pode acessar a manutencao.' });
  }
  next();
});

function gitCommit() {
  try {
    const { execSync } = require('child_process');
    const path = require('path');
    const root = path.join(__dirname, '..', '..');
    return String(execSync('git rev-parse --short HEAD', { cwd: root, timeout: 5000 })).trim();
  } catch (e) {
    return null;
  }
}

// Foto geral do sistema, sem expor nenhum segredo (.env, senhas, tokens).
router.get('/status', (req, res) => {
  try {
    const mem = process.memoryUsage();
    const counts = runAsAdmin(() => {
      const out = {};
      for (const c of store.COLLECTIONS) out[c] = store.all(c).length;
      return out;
    });
    let backups = { total: 0, latest: null };
    let tenants = [];
    try {
      const list = require('../utils/backup').listBackups();
      backups = {
        total: list.backups.length,
        totalSizeBytes: list.totalSize,
        latest: list.backups[0] || null,
        autoEnabled: list.config.autoEnabled,
        intervalHours: list.config.intervalHours
      };
    } catch (e) { /* pasta de backups ainda nao existe */ }
    try {
      tenants = runAsAdmin(() => store.getTenantDatabaseStatus()).map((t) => ({
        establishmentId: t.establishmentId,
        name: t.name,
        dedicated: t.dedicated,
        dbName: t.dbName,
        appointments: t.counts.appointments
      }));
    } catch (e) { /* store ainda sem suporte multi-banco */ }
    res.json({
      now: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      node: process.version,
      platform: process.platform,
      version: require('../../package.json').version,
      gitCommit: gitCommit(),
      memory: { rssMB: Math.round(mem.rss / 1048576), heapUsedMB: Math.round(mem.heapUsed / 1048576) },
      env: {
        nodeEnv: process.env.NODE_ENV || 'development',
        port: Number(process.env.PORT) || 3000,
        rlsEnabled: String(process.env.RLS_ENABLED || 'true').toLowerCase() !== 'false',
        autoProvision: String(process.env.TENANT_AUTO_PROVISION || 'false').toLowerCase() === 'true',
        seedDemoData: process.env.SEED_DEMO_DATA === 'true'
      },
      counts,
      backups,
      tenants,
      dedicatedCount: tenants.filter((t) => t.dedicated).length
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Falha ao ler status.' });
  }
});

// Reinicio: responde primeiro e encerra o processo em seguida.
// - Linux/systemd (Restart=on-failure): o servico sobe sozinho em segundos.
// - Windows: o processo morre — reabra o run-server.bat (como admin, se PORT=80).
router.post('/restart', (req, res) => {
  res.json({
    ok: true,
    message: 'Reiniciando... aguarde ~10s e recarregue. Na VPS o servico sobe sozinho; no Windows, reabra o run-server.bat.'
  });
  setTimeout(() => process.exit(1), 1500);
});

module.exports = router;
