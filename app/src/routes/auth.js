const express = require('express');
const bcrypt = require('bcryptjs');
const store = require('../data/store');
const { requireLogin } = require('../middleware/auth');

const router = express.Router();

const FORCE_PASSWORD_CHANGE = process.env.FORCE_PASSWORD_CHANGE === 'true';

router.post('/login', (req, res) => {
  const { email, password, establishmentId } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Informe email e senha.' });
  }
  const normalizedEmail = String(email).toLowerCase().trim();
  const user = store.query('users', (u) => u.email === normalizedEmail)[0];
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Email ou senha invalidos.' });
  }

  // Verifica se usuario NAO-admin sem estabelecimento associado
  const allowedIds = Array.isArray(user.allowedEstablishmentIds) ? user.allowedEstablishmentIds : [];
  if (user.role !== 'admin' && allowedIds.length === 0) {
    return res.status(403).json({ error: 'Seu usuario nao esta associado a nenhum estabelecimento. Contate o administrador.' });
  }

  let selectedEstablishmentId = null;
  if (establishmentId) {
    // Acesso global (allowedEstablishmentIds null/undefined) pode acessar qualquer
    // estabelecimento. Caso contrario, precisa estar na lista permitida.
    const isGlobal = !Array.isArray(user.allowedEstablishmentIds);
    if (!isGlobal && !user.allowedEstablishmentIds.includes(establishmentId)) {
      return res.status(403).json({ error: 'Acesso ao estabelecimento nao autorizado.' });
    }
    selectedEstablishmentId = establishmentId;
  } else if (Array.isArray(user.allowedEstablishmentIds) && user.allowedEstablishmentIds.length === 1) {
    selectedEstablishmentId = user.allowedEstablishmentIds[0];
  }

  // FORCE_PASSWORD_CHANGE: forcar troca de senha no primeiro login
  if (FORCE_PASSWORD_CHANGE && !user.passwordChangedAt) {
    return res.status(403).json({
      error: 'Você precisa alterar sua senha antes de continuar.',
      forcePasswordChange: true,
      userId: user.id
    });
  }

  req.session.regenerate((err) => {
    if (err) {
      return res.status(500).json({ error: 'Falha interna no login.' });
    }

    req.session.userId = user.id;
    req.session.establishmentId = selectedEstablishmentId;

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || 'operator',
      allowedEstablishmentIds: user.allowedEstablishmentIds || null,
      establishmentId: selectedEstablishmentId || null,
      mustChangePassword: FORCE_PASSWORD_CHANGE && !user.passwordChangedAt
    });
  });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

router.get('/me', requireLogin, (req, res) => {
  const user = store.findById('users', req.session.userId);
  if (!user) return res.status(401).json({ error: 'Nao autenticado.' });
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role || 'operator',
    establishmentId: req.session.establishmentId || null,
    allowedEstablishmentIds: user.allowedEstablishmentIds || null,
    theme: user.theme || 'light'
  });
});

router.put('/theme', requireLogin, (req, res) => {
  const { theme } = req.body || {};
  if (!theme || !['light', 'dark'].includes(theme)) {
    return res.status(400).json({ error: 'Tema invalido. Use "light" ou "dark".' });
  }
  const user = store.findById('users', req.session.userId);
  if (!user) return res.status(401).json({ error: 'Nao autenticado.' });
  store.update('users', user.id, { theme });
  res.json({ ok: true, theme });
});

module.exports = router;
