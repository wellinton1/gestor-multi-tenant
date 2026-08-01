const express = require('express');
const { v4: uuid } = require('uuid');
const store = require('../data/store');
const { requireLogin } = require('../middleware/auth');

const router = express.Router();

function normalizeLogoDataUrl(value) {
  const url = String(value || '').trim();
  if (!url) return '';
  if (/^data:image\/(png|jpeg|jpg|gif|webp);base64,[A-Za-z0-9+/=]+$/.test(url)) return url;
  if (/^https?:\/\/[^"]+$/.test(url)) return url;
  return '';
}

// Public listing of tenants for login selection.
router.get('/', (req, res) => {
  if (!req.session || !req.session.userId) {
    const list = store.all('establishments')
      .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
    return res.json(list);
  }

  const user = store.findById('users', req.session.userId);
  const allowedIds = Array.isArray(user && user.allowedEstablishmentIds) ? user.allowedEstablishmentIds : null;
  const list = store.all('establishments')
    .filter((row) => allowedIds === null || allowedIds.includes(row.id))
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  res.json(list);
});

router.use(requireLogin);

router.post('/', (req, res, next) => {
  try {
    const user = store.findById('users', req.session.userId);
    if (!user) return res.status(401).json({ error: 'Nao autenticado.' });
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Apenas administradores podem criar estabelecimentos.' });
    }
    const allowedIds = Array.isArray(user.allowedEstablishmentIds) ? user.allowedEstablishmentIds : null;
    if (allowedIds !== null && allowedIds.length > 0) {
      return res.status(403).json({ error: 'Acesso ao estabelecimento nao autorizado.' });
    }

    const { name, niche, phone, address, description, logoDataUrl, expirationPeriod } = req.body || {};
    const nameValue = String(name || '').trim();
    const nicheValue = String(niche || '').trim();
    if (!nameValue || !nicheValue) {
      return res.status(400).json({ error: 'Nome e nicho sao obrigatorios.' });
    }
    const row = store.insert('establishments', {
      id: uuid(),
      name: nameValue,
      niche: nicheValue,
      phone: String(phone || '').trim(),
      address: String(address || '').trim(),
      description: String(description || '').trim(),
      logoDataUrl: normalizeLogoDataUrl(logoDataUrl),
      expirationPeriod: String(expirationPeriod || 'Sem expiracao').trim(),
      createdAt: new Date().toISOString()
    });
    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', (req, res, next) => {
  try {
    const est = store.findById('establishments', req.params.id);
    if (!est) return res.status(404).json({ error: 'Estabelecimento nao encontrado.' });
    const user = store.findById('users', req.session.userId);
    if (!user) return res.status(401).json({ error: 'Nao autenticado.' });
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Apenas administradores podem atualizar estabelecimentos.' });
    }
    const allowedIds = Array.isArray(user.allowedEstablishmentIds) ? user.allowedEstablishmentIds : null;
    if (allowedIds !== null && !allowedIds.includes(est.id)) {
      return res.status(403).json({ error: 'Acesso ao estabelecimento nao autorizado.' });
    }
    const { name, phone, address, description, logoDataUrl, businessHours } = req.body || {};
    const updated = store.update('establishments', req.params.id, {
      name: name !== undefined ? String(name).trim() : est.name,
      phone: phone !== undefined ? String(phone).trim() : est.phone,
      address: address !== undefined ? String(address).trim() : est.address,
      description: description !== undefined ? String(description).trim() : est.description,
      logoDataUrl: logoDataUrl !== undefined ? normalizeLogoDataUrl(logoDataUrl) : est.logoDataUrl,
      businessHours: businessHours !== undefined ? businessHours : est.businessHours
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', (req, res, next) => {
  try {
    const est = store.findById('establishments', req.params.id);
    if (!est) return res.status(404).json({ error: 'Estabelecimento nao encontrado.' });
    const user = store.findById('users', req.session.userId);
    if (!user) return res.status(401).json({ error: 'Nao autenticado.' });
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Apenas administradores podem remover estabelecimentos.' });
    }
    const allowedIds = Array.isArray(user && user.allowedEstablishmentIds) ? user.allowedEstablishmentIds : null;
    if (allowedIds !== null && !allowedIds.includes(est.id)) {
      return res.status(403).json({ error: 'Acesso ao estabelecimento nao autorizado.' });
    }

    const ok = store.remove('establishments', req.params.id);
    if (!ok) return res.status(404).json({ error: 'Estabelecimento nao encontrado.' });
    ['employees', 'clients', 'services', 'appointments'].forEach((coll) => {
      store.query(coll, (row) => row.establishmentId === req.params.id).forEach((row) => {
        store.remove(coll, row.id);
      });
    });
    if (req.session.establishmentId === req.params.id) {
      req.session.establishmentId = null;
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Select which establishment the session is currently managing.
router.post('/:id/select', (req, res) => {
  const est = store.findById('establishments', req.params.id);
  if (!est) return res.status(404).json({ error: 'Estabelecimento nao encontrado.' });
  const user = store.findById('users', req.session.userId);
  const allowedIds = Array.isArray(user && user.allowedEstablishmentIds) ? user.allowedEstablishmentIds : null;
  if (allowedIds !== null && !allowedIds.includes(est.id)) {
    return res.status(403).json({ error: 'Acesso ao estabelecimento nao autorizado.' });
  }
  req.session.establishmentId = est.id;
  res.json(est);
});

router.post('/clear-selection', (req, res) => {
  req.session.establishmentId = null;
  res.json({ ok: true });
});

router.get('/current', (req, res) => {
  if (!req.session.establishmentId) return res.json(null);
  const est = store.findById('establishments', req.session.establishmentId);
  res.json(est || null);
});

module.exports = router;
