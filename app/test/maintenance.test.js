// Testes da Central de Manutencao.
//
// GET /api/maintenance/status: admin global recebe o snapshot (sem segredos);
// operador e deslogado sao barrados. O POST /restart NAO e testado aqui de
// proposito (ele encerra o processo).
const path = require('path');
process.env.STORE_PG_SYNC = 'false';
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');

const { ensurePostgres } = require('../src/utils/pg-embedded');
const store = require('../src/data/store');
const { runAsAdmin, tenantContextMiddleware } = require('../src/data/tenant-context');

const authRoutes = require('../src/routes/auth');
const maintenanceRoutes = require('../src/routes/maintenance');

const suffix = uuid().slice(0, 8);
const adminId = 'test-maint-admin-' + suffix;
const operId = 'test-maint-oper-' + suffix;
const estId = 'test-maint-est-' + suffix;
const adminEmail = `maint-admin-${suffix}@teste.com`.toLowerCase();
const operEmail = `maint-oper-${suffix}@teste.com`.toLowerCase();

let server;
let baseUrl;

function makeClient() {
  const jar = new Map();
  return {
    async request(method, url, body) {
      const headers = {};
      if (jar.size > 0) headers.Cookie = [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
      if (body !== undefined) headers['Content-Type'] = 'application/json';
      const res = await fetch(baseUrl + url, {
        method, headers, body: body !== undefined ? JSON.stringify(body) : undefined
      });
      for (const cookie of res.headers.getSetCookie()) {
        const pair = cookie.split(';')[0];
        const eq = pair.indexOf('=');
        if (eq > 0) jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
      }
      const text = await res.text();
      let json = null;
      try { json = JSON.parse(text); } catch (e) { /* nao-JSON */ }
      return { status: res.status, body: json, text };
    },
    get(url) { return this.request('GET', url); },
    post(url, body) { return this.request('POST', url, body || {}); }
  };
}

test.before(async () => {
  await ensurePostgres();
  await store.init();
  const now = new Date().toISOString();
  const passwordHash = bcrypt.hashSync('SenhaForte1!', 4);
  runAsAdmin(() => {
    store.insert('establishments', { id: estId, name: 'Manutencao', niche: 'Outro', createdAt: now });
    store.insert('users', { id: adminId, name: 'Admin', email: adminEmail, passwordHash, role: 'admin', createdAt: now, passwordChangedAt: now });
    store.insert('users', { id: operId, name: 'Oper', email: operEmail, passwordHash, role: 'operator', allowedEstablishmentIds: [estId], createdAt: now, passwordChangedAt: now });
  });
  await store.flush();

  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(session({ secret: 'test-secret', resave: false, saveUninitialized: false }));
  app.use(tenantContextMiddleware);
  app.use('/api/auth', authRoutes);
  app.use('/api/maintenance', maintenanceRoutes);
  app.use((err, req, res, next) => res.status(500).json({ error: err.message }));

  server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  try {
    if (server) await new Promise((resolve) => server.close(resolve));
    runAsAdmin(() => {
      store.remove('users', adminId);
      store.remove('users', operId);
      store.remove('establishments', estId);
    });
    await store.flush();
  } finally {
    await store.close();
  }
});

async function login(email) {
  const client = makeClient();
  const res = await client.post('/api/auth/login', { email, password: 'SenhaForte1!' });
  assert.equal(res.status, 200, 'login ' + email);
  return client;
}

test('admin recebe snapshot sem segredos', async () => {
  const client = await login(adminEmail);
  const res = await client.get('/api/maintenance/status');
  assert.equal(res.status, 200);
  assert.ok(res.body.uptimeSeconds >= 0);
  assert.ok(res.body.version);
  assert.ok(res.body.counts && typeof res.body.counts.establishments === 'number');
  assert.ok(res.body.env && typeof res.body.env.rlsEnabled === 'boolean');
  const raw = JSON.stringify(res.body).toLowerCase();
  assert.ok(!raw.includes('adminpassword'), 'sem ADMIN_PASSWORD');
  assert.ok(!raw.includes('session_secret'), 'sem SESSION_SECRET');
  assert.ok(!raw.includes('database_url'), 'sem DATABASE_URL');
});

test('operador e anonimo sao barrados', async () => {
  const oper = await login(operEmail);
  const denied = await oper.get('/api/maintenance/status');
  assert.equal(denied.status, 403);
  const anon = makeClient();
  const unauth = await anon.get('/api/maintenance/status');
  assert.ok([401, 403].includes(unauth.status));
});
