require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const crypto = require('crypto');
const { findAvailablePort } = require('./src/utils/port');

// Unhandled error handlers - MUST be first
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

const { runSeed } = require('./src/data/seed');
const store = require('./src/data/store');
const { ensurePostgres } = require('./src/utils/pg-embedded');

const authRoutes = require('./src/routes/auth');
const establishmentsRoutes = require('./src/routes/establishments');
const clientsRoutes = require('./src/routes/clients');
const employeesRoutes = require('./src/routes/employees');
const servicesRoutes = require('./src/routes/services');
const appointmentsRoutes = require('./src/routes/appointments');
const cashClosingsRoutes = require('./src/routes/cashClosings');
const dashboardRoutes = require('./src/routes/dashboard');
const portalRoutes = require('./src/routes/portal');
const usersRoutes = require('./src/routes/users');
const passwordRoutes = require('./src/routes/password');
const passwordRecoveryRoutes = require('./src/routes/passwordRecovery');
const twoFactorRoutes = require('./src/routes/twoFactor');
const securityRoutes = require('./src/routes/security');
const setupRoutes = require('./src/routes/setup');
const paymentsRoutes = require('./src/routes/payments');
const backupsRoutes = require('./src/routes/backups');
const couponsRoutes = require('./src/routes/coupons');
const tenantDatabasesRoutes = require('./src/routes/tenantDatabases');
const { startBackupScheduler } = require('./src/utils/backup');

const app = express();
const DEFAULT_PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';
const cookieSecure = process.env.COOKIE_SECURE === 'true';
// OAuth Google precisa de SameSite=Lax: com 'strict' o browser descarta o
// cookie de sessao no redirect de volta do accounts.google.com e o login
// nunca completa. Respeita COOKIE_SAME_SITE, default 'lax'.
const cookieSameSiteRaw = String(process.env.COOKIE_SAME_SITE || 'lax').toLowerCase();
const cookieSameSite = ['strict', 'lax', 'none'].includes(cookieSameSiteRaw) ? cookieSameSiteRaw : 'lax';

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 12;

if (isProduction && (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === 'troque-este-valor-para-um-texto-aleatorio-longo')) {
  console.error('ERRO FATAL: SESSION_SECRET deve ser configurado no .env para producao!');
  console.error('Gere um com: openssl rand -hex 64');
  process.exit(1);
}

app.set('trust proxy', 1);

// Rate limit values - configurable via env, stricter defaults in production
const GLOBAL_RATE_LIMIT_MAX = isProduction
  ? (Number(process.env.RATE_LIMIT_GLOBAL_MAX) || 200)
  : (Number(process.env.RATE_LIMIT_GLOBAL_MAX) || 1000);
const AUTH_RATE_LIMIT_MAX = isProduction
  ? (Number(process.env.RATE_LIMIT_AUTH_MAX) || 10)
  : (Number(process.env.RATE_LIMIT_AUTH_MAX) || 200);
const PASSWORD_RATE_LIMIT_MAX = isProduction
  ? (Number(process.env.RATE_LIMIT_PASSWORD_MAX) || 3)
  : (Number(process.env.RATE_LIMIT_PASSWORD_MAX) || 50);
const PORTAL_RATE_LIMIT_MAX = isProduction
  ? (Number(process.env.RATE_LIMIT_PORTAL_MAX) || 30)
  : (Number(process.env.RATE_LIMIT_PORTAL_MAX) || 200);

// Generate CSP nonce for inline scripts
app.use((req, res, next) => {
  res.locals.cspNonce = crypto.randomBytes(16).toString('base64url');
  next();
});

// ===== SECURITY =====

// Helmet - security headers
// NOTA: HSTS e upgrade-insecure-requests so fazem sentido com HTTPS real
// (Nginx + Certbot). Com HTTP puro (IP da VPS) eles mandam o browser
// reescrever tudo para https:// -> ERR_CONNECTION_REFUSED e pagina em branco.
// Por isso amarramos ao COOKIE_SECURE (install.sh so poe true com HTTPS).
const httpsEnabled = cookieSecure === true;
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", (req, res) => `'nonce-${res.locals.cspNonce}'`],
      // 'unsafe-inline': o frontend usa atributos style= em toda parte (padrao
      // do projeto). NAO adicionar nonce aqui — a presenca de nonce/hash anula
      // o 'unsafe-inline' segundo a spec do CSP.
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: httpsEnabled ? [] : null
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: httpsEnabled ? undefined : false,
  crossOriginResourcePolicy: false,
  originAgentCluster: false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: httpsEnabled ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
  noSniff: true,
  frameguard: { action: 'deny' }
}));

// Rate limiting global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: GLOBAL_RATE_LIMIT_MAX,
  message: { error: 'Muitas requisicoes deste IP. Tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(globalLimiter);

// Stricter rate limit for login (anti brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: AUTH_RATE_LIMIT_MAX,
  message: { error: 'Muitas tentativas de login - aguarde 1 minuto.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limit for password change routes
const passwordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: PASSWORD_RATE_LIMIT_MAX,
  message: { error: 'Muitas tentativas de alteracao de senha. Aguarde 1 hora.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limit for public portal endpoints (booking, etc)
const portalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: PORTAL_RATE_LIMIT_MAX,
  message: { error: 'Muitas requisicoes ao portal. Tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET || SESSION_SECRET === 'troque-este-valor-para-um-texto-aleatorio-longo') {
  if (isProduction) {
    console.error('ERRO FATAL: SESSION_SECRET nao configurado no .env!');
    process.exit(1);
  }
  console.warn('AVISO: SESSION_SECRET nao configurado no .env! Usando valor gerado automaticamente (sessoes serao perdidas ao reiniciar).');
}

// Sessoes persistidas em disco: sobrevivem a reinicios do servidor
// (sem isso, cada restart/redeploy desloga todos os usuarios).
const FileStore = require('session-file-store')(session);
const SESSIONS_DIR = path.join(__dirname, 'data', 'sessions');

app.use(
  session({
    name: 'gestor.sid',
    store: new FileStore({
      path: SESSIONS_DIR,
      logFn: () => {}, // silencia logs verbosos da biblioteca
      ttl: 60 * 60 * 24 * 7, // 7 dias, igual ao maxAge do cookie
      reapInterval: 60 * 60 // limpa sessoes expiradas a cada 1h
    }),
    secret: SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      sameSite: cookieSameSite,
      maxAge: 1000 * 60 * 60 * 24 * 7,
      secure: cookieSameSite === 'none' ? true : cookieSecure,
      path: '/'
    }
  })
);

// Passport eh obrigatorio para o login Google funcionar:
// sem initialize()/session(), passport.authenticate() falha com
// "passport.initialize() middleware not in use" e req.user nunca existe.
app.use(passport.initialize());
app.use(passport.session());

// Contexto de tenant (AsyncLocalStorage): propaga o estabelecimento da sessao
// para a camada de dados, que configura o RLS do PostgreSQL nas escritas.
app.use(require('./src/data/tenant-context').tenantContextMiddleware);

// ===== CSRF Protection (Double Submit Cookie Pattern) =====
// Gera token CSRF e armazena em cookie acessivel via JS
app.use((req, res, next) => {
  // Pula CSRF para rotas de autenticacao (login nao precisa de CSRF)
  if (req.path.startsWith('/api/auth') || req.path.startsWith('/api/setup')) {
    return next();
  }

  // Metodos seguros (GET, HEAD, OPTIONS): sempre emite o cookie CSRF se ainda
  // nao existir. Importante: NAO pular o portal aqui, senao o frontend publico
  // nunca recebe o cookie e o POST /book subsequente falha com 403.
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    if (!req.cookies || !req.cookies['gestor.csrf']) {
      const csrfToken = crypto.randomBytes(32).toString('hex');
      res.cookie('gestor.csrf', csrfToken, {
        httpOnly: false,
        sameSite: 'strict',
        secure: cookieSecure,
        maxAge: 1000 * 60 * 60 * 24
      });
      res.locals.csrfToken = csrfToken;
    } else {
      res.locals.csrfToken = req.cookies['gestor.csrf'];
    }
    return next();
  }

  // Para metodos que modificam dados (POST, PUT, DELETE, PATCH)
  const csrfCookie = req.cookies && req.cookies['gestor.csrf'];
  const csrfHeader = req.headers['x-csrf-token'];

  if (!csrfCookie) {
    return res.status(403).json({ error: 'Token CSRF ausente (cookie).' });
  }

  if (!csrfHeader) {
    return res.status(403).json({ error: 'Token CSRF ausente (header).' });
  }

  // Use constant-time comparison to prevent timing attacks.
  // Guarda contra comprimentos diferentes (timingSafeEqual lanca RangeError nesse caso).
  const cookieBuf = Buffer.from(csrfCookie);
  const headerBuf = Buffer.from(csrfHeader);
  if (cookieBuf.length !== headerBuf.length || !crypto.timingSafeEqual(cookieBuf, headerBuf)) {
    return res.status(403).json({ error: 'Token CSRF invalido.' });
  }

  next();
});

// Bootstrap admin user + optional demo data on first run (apos o banco
// estar pronto — ver boot() no final do arquivo).

// API routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/auth', passwordRecoveryRoutes); // forgot/reset password (sem rate limit extra)

app.use('/api/2fa', require('./src/middleware/auth').requireLogin, twoFactorRoutes);
app.use('/api/setup', authLimiter, setupRoutes);
app.use('/api/password', require('./src/middleware/auth').requireLogin, passwordLimiter, passwordRoutes);
app.use('/api/establishments', establishmentsRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/cash-closings', cashClosingsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/portal', portalLimiter, portalRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/backups', backupsRoutes);
app.use('/api/coupons', couponsRoutes);
app.use('/api/tenant-databases', tenantDatabasesRoutes);

// Static frontend com cache-control
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: isProduction ? '1h' : 0,
  etag: true,
  lastModified: true
}));

// Public client-booking page (clean URL, no admin auth required)
app.get('/loja/:establishmentId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'portal.html'), {
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff'
    }
  });
});

// Everything else -> the admin SPA (client-side routing handles the rest)
app.get('*', (req, res) => {
  const nonce = res.locals.cspNonce;
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, maximum-scale=5.0" />
<meta name="theme-color" content="#ffffff" />
<title>Painel de Gestao</title>
<link rel="stylesheet" href="/css/style.css" nonce="${nonce}" />
<link rel="stylesheet" href="/themes/tokens-base.css" nonce="${nonce}" />
</head>
<body>
<div id="root"></div>
<script src="/js/app.js" nonce="${nonce}"></script>
</body>
</html>`;
  res.set({
    'Content-Type': 'text/html; charset=utf-8',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff'
  });
  res.send(html);
});

// ===== Global Error Handling =====
app.use((err, req, res, next) => {
  console.error('Erro nao tratado:', err.message);
  res.status(500).json({
    error: isProduction ? 'Erro interno do servidor.' : err.message
  });
});

async function startServer() {
  const port = await findAvailablePort(DEFAULT_PORT);
  app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
    if (!isProduction) {
      console.log('Modo: DESENVOLVIMENTO');
    }
  });
}

// Boot: 1) sobe/verifica PostgreSQL; 2) carrega cache do store e importa
// db.json residual (migracao ou pos-restore); 3) seed; 4) backups; 5) HTTP.
async function boot() {
  try {
    await ensurePostgres();
    await store.init();
  } catch (err) {
    console.error('ERRO FATAL ao iniciar o banco de dados:', err.message);
    process.exit(1);
  }
  try {
    await runSeed();
  } catch (err) {
    console.error('Erro durante execucao do seed:', err.message);
  }
  startBackupScheduler();
  try {
    tenantDatabasesRoutes.startTenantAutoProvisionScheduler();
  } catch (err) {
    console.error('Erro ao iniciar auto-provision de bancos dedicados:', err.message);
  }
  await startServer();
}

boot().catch((err) => {
  console.error('Falha ao iniciar o servidor:', err);
  process.exit(1);
});