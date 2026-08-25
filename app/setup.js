const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const store = require('../data/store');

const router = express.Router();

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 12;

function validatePasswordStrength(password) {
  const errors = [];
  if (!password || password.length < 8) errors.push('A senha deve ter no minimo 8 caracteres.');
  if (!/[A-Z]/.test(password || '')) errors.push('A senha deve conter pelo menos uma letra maiuscula.');
  if (!/[a-z]/.test(password || '')) errors.push('A senha deve conter pelo menos uma letra minuscula.');
  if (!/[0-9]/.test(password || '')) errors.push('A senha deve conter pelo menos um numero.');
  if (!/[!@#$%^&*(),.?":{}|<>_]/.test(password || '')) errors.push('A senha deve conter pelo menos um caractere especial.');
  return errors;
}

function hasAdmin() {
  return store.query('users', (u) => u.role === 'admin').length > 0;
}

// GET /api/setup/status -> { setupNeeded: boolean }
// Rota publica: diz ao frontend se o setup inicial ainda precisa ser feito.
router.get('/status', (req, res) => {
  res.json({ setupNeeded: !hasAdmin() });
});

// POST /api/setup -> cria o primeiro admin se nenhum existir.
// Idempotente: se ja existe admin, retorna 409.
router.post('/', (req, res) => {
  if (hasAdmin()) {
    return res.status(409).json({ error: 'Setup ja realizado. Faca login normalmente.' });
  }

  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nome, email e senha sao obrigatorios.' });
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({ error: 'Email invalido.' });
  }

  const strengthErrors = validatePasswordStrength(password);
  if (strengthErrors.length > 0) {
    return res.status(400).json({ error: strengthErrors.join(' ') });
  }

  const existing = store.query('users', (u) => u.email === normalizedEmail)[0];
  if (existing) {
    return res.status(400).json({ error: 'Email ja cadastrado.' });
  }

  const user = store.insert('users', {
    id: uuid(),
    name: String(name).trim(),
    email: normalizedEmail,
    passwordHash: bcrypt.hashSync(String(password), BCRYPT_ROUNDS),
    role: 'admin',
    passwordChangedAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  });

  // Loga o admin recem-criado na sessao atual
  req.session.regenerate((err) => {
    if (err) {
      // Mesmo se a sessao falhar, o admin foi criado
      return res.status(201).json({
        ok: true,
        message: 'Administrador criado. Faca login para continuar.',
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
      });
    }
    req.session.userId = user.id;
    res.status(201).json({
      ok: true,
      message: 'Administrador criado com sucesso.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        allowedEstablishmentIds: null,
        establishmentId: null
      }
    });
  });
});

module.exports = router;