const express = require('express');
const bcrypt = require('bcryptjs');
const store = require('../data/store');
const { requireLogin, requireEstablishment } = require('../middleware/auth');

const router = express.Router();
router.use(requireLogin);

function hasAccessToEstablishment(req, establishmentId) {
  const user = store.findById('users', req.session.userId);
  if (!user) return false;
  const allowedIds = Array.isArray(user.allowedEstablishmentIds) ? user.allowedEstablishmentIds : null;
  if (allowedIds === null) return true;
  return allowedIds.includes(establishmentId);
}

router.get('/me', (req, res) => {
  try {
    const user = store.findById('users', req.session.userId);
    if (!user) return res.status(401).json({ error: 'Nao autenticado.' });
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      establishmentId: req.session.establishmentId || null,
      allowedEstablishmentIds: user.allowedEstablishmentIds || null
    });
  } catch (err) {
    next(err);
  }
});

router.get('/', requireEstablishment, (req, res, next) => {
  try {
    const users = store.all('users').filter((user) => Array.isArray(user.allowedEstablishmentIds) && user.allowedEstablishmentIds.includes(req.session.establishmentId));
    res.json(users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      allowedEstablishmentIds: user.allowedEstablishmentIds
    })));
  } catch (err) {
    next(err);
  }
});

router.get('/by-establishment/:id', (req, res, next) => {
  try {
    const estId = req.params.id;
    if (!hasAccessToEstablishment(req, estId)) {
      return res.status(403).json({ error: 'Acesso ao estabelecimento nao autorizado.' });
    }
    const users = store.all('users').filter((user) => Array.isArray(user.allowedEstablishmentIds) && user.allowedEstablishmentIds.includes(estId));
    res.json(users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      allowedEstablishmentIds: user.allowedEstablishmentIds
    })));
  } catch (err) {
    next(err);
  }
});

router.post('/by-establishment/:id', (req, res, next) => {
  try {
    const currentUser = store.findById('users', req.session.userId);
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'Apenas administradores podem criar usuarios.' });
    }

    const estId = req.params.id;
    if (!hasAccessToEstablishment(req, estId)) {
      return res.status(403).json({ error: 'Acesso ao estabelecimento nao autorizado.' });
    }

    const { name, email, password, role } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, email e senha sao obrigatorios.' });
    }
    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = store.query('users', (u) => u.email === normalizedEmail)[0];
    if (existing) {
      return res.status(400).json({ error: 'Email ja cadastrado.' });
    }

    const newUser = store.insert('users', {
      id: require('uuid').v4(),
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash: bcrypt.hashSync(String(password), 10),
      role: role || 'operator',
      allowedEstablishmentIds: [estId],
      createdAt: new Date().toISOString()
    });
    res.status(201).json({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      allowedEstablishmentIds: newUser.allowedEstablishmentIds
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireEstablishment, (req, res, next) => {
  try {
    const currentUser = store.findById('users', req.session.userId);
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'Apenas administradores podem remover usuarios.' });
    }

    const user = store.findById('users', req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuario nao encontrado.' });
    if (!Array.isArray(user.allowedEstablishmentIds) || !user.allowedEstablishmentIds.includes(req.session.establishmentId)) {
      return res.status(403).json({ error: 'Acesso ao usuario nao autorizado.' });
    }
    if (user.id === req.session.userId) {
      return res.status(400).json({ error: 'Nao e possivel remover o seu proprio usuario.' });
    }
    store.remove('users', req.params.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
