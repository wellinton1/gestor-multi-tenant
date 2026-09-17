// Bancos dedicados por tenant (Nivel 2) — operacao automatica pelo painel.
//
//   GET  /api/tenant-databases                  status de todas as lojas
//   POST /api/tenant-databases/:id/provision    cria banco + migra (1 clique)
//   POST /api/tenant-databases/:id/move-back    volta ao compartilhado
//
// Tudo exclusivo do administrador global da plataforma. Nao precisa editar
// .env nem reiniciar: o mapa tenant->banco persiste em data/tenant-databases.json.
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
    return res.status(403).json({ error: 'Apenas o administrador da plataforma pode gerenciar bancos dedicados.' });
  }
  next();
});

// Status de todas as lojas (dedicado x compartilhado + contagens).
router.get('/', (req, res) => {
  try {
    const status = runAsAdmin(() => store.getTenantDatabaseStatus());
    res.json({ databases: status, dedicatedCount: status.filter((s) => s.dedicated).length });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Falha ao listar bancos.' });
  }
});

// Provisiona banco dedicado e migra a loja (automatico, sem restart).
router.post('/:id/provision', async (req, res) => {
  try {
    const estId = String(req.params.id);
    const body = req.body || {};
    const result = await runAsAdmin(() =>
      store.provisionDedicatedDatabase(estId, { dbName: body.dbName, keepSource: body.keepSource === true })
    );
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Falha ao provisionar banco dedicado.' });
  }
});

// Volta a loja ao banco compartilhado (opcional: ?dropDatabase=true apaga o dedicado).
router.post('/:id/move-back', async (req, res) => {
  try {
    const estId = String(req.params.id);
    const drop = req.query.dropDatabase === 'true' || (req.body && req.body.dropDatabase === true);
    const result = await runAsAdmin(() => store.moveTenantToShared(estId, { dropDatabase: drop }));
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Falha ao mover para o banco compartilhado.' });
  }
});

// Migracao automatica por volume (opcional, desligado por padrao).
// Quando TENANT_AUTO_PROVISION=true, a cada 24h migra sozinho todo tenant
// compartilhado com agendamentos >= TENANT_AUTO_MIN_APPOINTMENTS.
function startTenantAutoProvisionScheduler() {
  if (String(process.env.TENANT_AUTO_PROVISION || 'false').toLowerCase() !== 'true') {
    return;
  }
  const threshold = Number(process.env.TENANT_AUTO_MIN_APPOINTMENTS) || 50000;
  const tick = async () => {
    try {
      const status = runAsAdmin(() => store.getTenantDatabaseStatus());
      for (const s of status) {
        if (s.dedicated) continue;
        if ((s.counts.appointments || 0) < threshold) continue;
        console.log(`[tenant-db] auto-provision: "${s.name}" (${s.counts.appointments} agendamentos >= ${threshold})`);
        try {
          await runAsAdmin(() => store.provisionDedicatedDatabase(s.establishmentId));
          console.log(`[tenant-db] "${s.name}" migrado para banco dedicado.`);
        } catch (err) {
          console.error(`[tenant-db] falha no auto-provision de "${s.name}":`, err.message);
        }
      }
    } catch (err) {
      console.error('[tenant-db] falha na verificacao automatica:', err.message);
    }
  };
  setTimeout(tick, 5 * 60 * 1000); // apos o boot
  const timer = setInterval(tick, 24 * 3600 * 1000);
  if (timer.unref) timer.unref();
  console.log(`[tenant-db] auto-provision ATIVO (limite: ${threshold} agendamentos).`);
}

module.exports = router;
module.exports.startTenantAutoProvisionScheduler = startTenantAutoProvisionScheduler;
