const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');
const store = require('../data/store');
const { requireLogin } = require('../middleware/auth');
const { resolveAllowedIds } = require('../utils/access');

const router = express.Router();

const FORCE_PASSWORD_CHANGE = process.env.FORCE_PASSWORD_CHANGE === 'true';

// Google OAuth configuration (so registra se .env tem as 3 vars;
// sem isso o require() quebrava o boot com "requires a clientID option")
const GOOGLE_CONFIGURED = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REDIRECT_URI);
if (GOOGLE_CONFIGURED) {
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
        // Cria novo usuário com Google ID (cadastro pendente: sem
        // estabelecimentos ate o admin associar a uma loja)
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

    // Usuarios sem estabelecimento (cadastro pendente via Google) podem
    // entrar: o frontend mostra a tela de aguardando aprovacao e o admin
    // associa a uma loja depois. Rotas de dados continuam protegidas por
    // requireEstablishment, entao nenhum dado de loja fica acessivel.
    return done(null, user);
  }
));
} else {
  console.warn('AVISO: GOOGLE_* nao configurado no .env — botao "Continuar com Google" ficara oculto.');
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = store.findById('users', id);
  done(null, user);
});

// Google OAuth config check (public endpoint)
router.get('/google-config', (req, res) => {
  const configured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REDIRECT_URI);
  res.json({ configured });
});

router.post('/login', (req, res) => {
  const { email, password, establishmentId, twoFactorToken } = req.body || {};
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

  // Verifica 2FA
  if (user.twoFactorEnabled) {
    if (!twoFactorToken) {
      // Requer código 2FA
      return res.status(200).json({
        requireTwoFactor: true,
        userId: user.id,
        message: 'Código de autenticação de dois fatores necessário.'
      });
    }
    // Verifica o token 2FA (helper usa API otplib v13 + tolerância de relógio)
    const { verifyTotpToken } = require('../utils/totp');
    const isValid = verifyTotpToken(twoFactorToken, user.twoFactorSecret);
    if (!isValid) {
      // Tenta backup code
      const crypto = require('crypto');
      const hashed = crypto.createHash('sha256').update(twoFactorToken.toUpperCase()).digest('hex');
      const backupIdx = (user.twoFactorBackupCodes || []).indexOf(hashed);
      if (backupIdx === -1) {
        return res.status(401).json({ error: 'Código 2FA inválido.' });
      }
      // Remove backup code usado
      const newBackupCodes = [...user.twoFactorBackupCodes];
      newBackupCodes.splice(backupIdx, 1);
      store.update('users', user.id, { twoFactorBackupCodes: newBackupCodes });
    }
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
  // Cadastro pendente: operador sem nenhum estabelecimento associado
  // (tipicamente criado via login Google). O frontend mostra a tela de
  // aguardando aprovacao ate o admin associar a uma loja.
  const pendingApproval = user.role !== 'admin' &&
    Array.isArray(user.allowedEstablishmentIds) &&
    user.allowedEstablishmentIds.length === 0;
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role || 'operator',
    establishmentId: req.session.establishmentId || null,
    allowedEstablishmentIds: user.allowedEstablishmentIds || null,
    pendingApproval,
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

function isGoogleConfigured() {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REDIRECT_URI);
}

router.get('/google', (req, res, next) => {
  if (!isGoogleConfigured()) {
    return res.status(503).json({ error: 'Login com Google nao configurado. Defina GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI no .env.' });
  }
  // Allow passing establishmentId as query param for tenant login flow
  const establishmentId = req.query.establishmentId;
  if (establishmentId) {
    req.session.googleEstablishmentId = establishmentId;
  }
  // FileStore grava sessao em disco de forma assincrona: garante que o
  // googleEstablishmentId foi persistido antes do redirect para o Google,
  // senao o callback volta com sessao vazia e perde a loja.
  req.session.save((err) => {
    if (err) {
      console.error('Falha ao salvar sessao antes do OAuth Google:', err.message);
      return res.status(500).json({ error: 'Falha interna ao iniciar login Google.' });
    }
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
  });
});

router.get('/google/callback',
  (req, res, next) => {
    if (!isGoogleConfigured()) {
      return res.redirect('/?google_error=not_configured');
    }
    next();
  },
  passport.authenticate('google', { failureRedirect: '/?google_error=1', failureMessage: true, session: true }),
  (req, res) => {
    if (!req.user) {
      return res.redirect('/?google_error=1');
    }

    const user = req.user;

    // If there was an establishmentId from the tenant login flow, select it
    const establishmentId = req.session.googleEstablishmentId;
    const userId = user.id;

    // 2FA com Google: NAO exige senha (conta Google pode nem ter senha).
    // Guarda estado pendente na sessao e a SPA exibe o modal de codigo TOTP.
    if (user.twoFactorEnabled) {
      return req.session.regenerate((err) => {
        if (err) {
          console.error('Falha ao regenerar sessao no callback Google (2FA):', err.message);
          return res.redirect('/?google_error=1');
        }
        req.session.pendingGoogle2fa = {
          userId,
          establishmentId: establishmentId || null,
          createdAt: Date.now()
        };
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error('Falha ao salvar sessao 2FA Google:', saveErr.message);
            return res.redirect('/?google_error=1');
          }
          return res.redirect('/?google_2fa=1');
        });
      });
    }

    // Regenera a sessao (anti-fixacao, igual ao POST /login) e grava userId.
    req.session.regenerate((err) => {
      if (err) {
        console.error('Falha ao regenerar sessao no callback Google:', err.message);
        return res.redirect('/?google_error=1');
      }
      req.session.userId = userId;
      if (establishmentId) {
        req.session.establishmentId = establishmentId;
      }
      req.session.save((saveErr) => {
        if (saveErr) {
          console.error('Falha ao salvar sessao no callback Google:', saveErr.message);
          return res.redirect('/?google_error=1');
        }
        // Redireciona para a SPA: o boot() chama /api/auth/me e renderiza a
        // tela certa (dashboard, seletor de loja ou cadastro pendente).
        res.redirect('/');
      });
    });
  }
);

// Informa se ha verificacao 2FA Google pendente nesta sessao (publico,
// mas so responde com a sessao criada no callback). Expira em 10 min.
router.get('/google/2fa-pending', (req, res) => {
  const pending = req.session && req.session.pendingGoogle2fa;
  if (!pending || !pending.userId) {
    return res.status(404).json({ error: 'Nenhuma verificacao 2FA pendente.' });
  }
  if (Date.now() - (pending.createdAt || 0) > 10 * 60 * 1000) {
    delete req.session.pendingGoogle2fa;
    return res.status(410).json({ error: 'Verificacao 2FA expirada. Entre com Google novamente.' });
  }
  const user = store.findById('users', pending.userId);
  if (!user) return res.status(404).json({ error: 'Usuario nao encontrado.' });
  res.json({ pending: true, email: user.email, name: user.name });
});

// Verifica o codigo TOTP (ou backup code) e conclui o login Google.
router.post('/google/2fa-verify', (req, res) => {
  const pending = req.session && req.session.pendingGoogle2fa;
  if (!pending || !pending.userId) {
    return res.status(401).json({ error: 'Nenhuma verificacao 2FA pendente. Entre com Google novamente.' });
  }
  if (Date.now() - (pending.createdAt || 0) > 10 * 60 * 1000) {
    delete req.session.pendingGoogle2fa;
    return res.status(410).json({ error: 'Verificacao 2FA expirada. Entre com Google novamente.' });
  }
  const { token } = req.body || {};
  if (!token) {
    return res.status(400).json({ error: 'Informe o codigo do autenticador.' });
  }
  const user = store.findById('users', pending.userId);
  if (!user) return res.status(401).json({ error: 'Usuario nao encontrado.' });
  if (!user.twoFactorEnabled) {
    return res.status(400).json({ error: '2FA nao esta ativado para este usuario.' });
  }

  const { verifyTotpToken } = require('../utils/totp');
  let isValid = verifyTotpToken(token, user.twoFactorSecret);
  if (!isValid) {
    // Tenta backup code (mesma regra do POST /login)
    const crypto = require('crypto');
    const hashed = crypto.createHash('sha256').update(String(token).toUpperCase().trim()).digest('hex');
    const backupIdx = (user.twoFactorBackupCodes || []).indexOf(hashed);
    if (backupIdx === -1) {
      return res.status(401).json({ error: 'Codigo 2FA invalido.' });
    }
    const newBackupCodes = [...user.twoFactorBackupCodes];
    newBackupCodes.splice(backupIdx, 1);
    store.update('users', user.id, { twoFactorBackupCodes: newBackupCodes });
  }

  const userId = user.id;
  const establishmentId = pending.establishmentId || null;
  req.session.regenerate((err) => {
    if (err) {
      return res.status(500).json({ error: 'Falha interna no login.' });
    }
    req.session.userId = userId;
    if (establishmentId) {
      req.session.establishmentId = establishmentId;
    }
    req.session.save((saveErr) => {
      if (saveErr) {
        return res.status(500).json({ error: 'Falha interna no login.' });
      }
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || 'operator',
        allowedEstablishmentIds: user.allowedEstablishmentIds || null,
        establishmentId: establishmentId || null
      });
    });
  });
});

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
