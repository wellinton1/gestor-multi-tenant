const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');
const store = require('../data/store');
const { requireLogin } = require('../middleware/auth');
const { resolveAllowedIds } = require('../utils/access');

const router = express.Router();

const FORCE_PASSWORD_CHANGE = process.env.FORCE_PASSWORD_CHANGE === 'true';

// Google OAuth configuration
passport.use('google', new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_REDIRECT_URI
  },
  async (accessToken, refreshToken, profile, done) => {
    const googleId = profile.id;
    const email = profile.emails ? profile.emails[0].value : null;
    const name = profile.displayName || '';

    if (!email) {
      return done(new Error('Email do Google não disponível.'));
    }

    // Busca usuário pelo email do Google
    let user = store.query('users', (u) => u.googleId === googleId)[0];

    if (!user) {
      // Busca usuário existente pelo email (para login com email antigo)
      user = store.query('users', (u) => u.email === email)[0];

      if (user) {
        // Atualiza usuário existente com Google ID
        store.update('users', user.id, { googleId });
      } else {
        // Cria novo usuário com Google ID
        const passwordHash = bcrypt.hashSync(Math.random().toString(36).slice(-12), 12);
        user = store.insert('users', {
          id: googleId,
          name,
          email,
          passwordHash,
          googleId,
          role: 'operator',
          allowedEstablishmentIds: [],
          createdAt: new Date().toISOString(),
          passwordChangedAt: new Date().toISOString()
        });
      }
    }

    const allowedIds = resolveAllowedIds(user);
    if (user.role !== 'admin' && (!Array.isArray(allowedIds) || allowedIds.length === 0)) {
      return done(new Error('Seu usuário não está associado a nenhum estabelecimento. Contate o administrador.'));
    }

    return done(null, user);
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = store.findById('users', id);
  done(null, user);
});

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

  // Verifica se usuario NAO-admin sem estabelecimento associado.
  // Acesso global (null) e exclusivo de admins — operadores precisam de lista.
  const allowedIds = resolveAllowedIds(user);
  if (user.role !== 'admin' && (!Array.isArray(allowedIds) || allowedIds.length === 0)) {
    return res.status(403).json({ error: 'Seu usuario nao esta associado a nenhum estabelecimento. Contate o administrador.' });
  }

  let selectedEstablishmentId = null;
  if (establishmentId) {
    // Acesso global (resolveAllowedIds === null) pode acessar qualquer
    // estabelecimento. Caso contrario, precisa estar na lista permitida.
    const isGlobal = allowedIds === null;
    if (!isGlobal && !allowedIds.includes(establishmentId)) {
      return res.status(403).json({ error: 'Acesso ao estabelecimento nao autorizado.' });
    }
    selectedEstablishmentId = establishmentId;
  } else if (Array.isArray(allowedIds) && allowedIds.length === 1) {
    selectedEstablishmentId = allowedIds[0];
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

// ----- Rotas Google OAuth -----

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/api/auth/google', session: true }),
  (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Falha na autenticação com Google.' });
    }
    res.json({
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role || 'operator',
      allowedEstablishmentIds: req.user.allowedEstablishmentIds || null,
      establishmentId: req.session.establishmentId || null
    });
  }
);

// ----- Recuperação de senha via Google -----

router.post('/google/recover', (req, res) => {
  const { token } = req.body || {};
  if (!token) {
    return res.status(400).json({ error: 'Token do Google é obrigatório.' });
  }

  // Verifica se existe usuário com esse Google token
  const user = store.query('users', (u) => u.googleId === token)[0];
  if (!user) {
    return res.status(404).json({ error: 'Nenhum usuário encontrado com este token Google.' });
  }

  // Gera um token temporário de recuperação de senha
  const recoveryToken = Math.random().toString(36).slice(-24) + Date.now().toString(36);
  store.update('users', user.id, { passwordRecoveryToken: recoveryToken });

  // Em um ambiente real, aqui enviariam um email com link de recuperação
  // por enquanto, retornamos o token para teste
  res.json({
    ok: true,
    message: 'Token de recuperação gerado. Em produção, um email seria enviado.',
    recoveryToken,
    email: user.email
  });
});

module.exports = router;
