// Testes de isolamento entre tenants (HTTP).
//
// Sobe a aplicacao Express com os routers reais (auth, clients, appointments,
// coupons, dashboard, establishments), cria dois estabelecimentos com dados
// proprios e verifica que um usuario da loja A NAO consegue ler nem alterar
// dados da loja B — nem por listagem, nem por id, nem referenciando ids de
// outro tenant em payloads (foreign keys cruzadas).
//
// Roda com: node --test test/tenant-isolation.test.js  (ou npm run test:isolation)

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
const establishmentsRoutes = require('../src/routes/establishments');
const clientsRoutes = require('../src/routes/clients');
const appointmentsRoutes = require('../src/routes/appointments');
const couponsRoutes = require('../src/routes/coupons');
const dashboardRoutes = require('../src/routes/dashboard');

const ids = {
  tenantA: 'test-iso-est-A-' + uuid(),
  tenantB: 'test-iso-est-B-' + uuid(),
  userA: 'test-iso-user-A-' + uuid(),
  userB: 'test-iso-user-B-' + uuid(),
  clientA: 'test-iso-client-A-' + uuid(),
  clientB: 'test-iso-client-B-' + uuid(),
  serviceA: 'test-iso-service-A-' + uuid(),
  serviceB: 'test-iso-service-B-' + uuid(),
  employeeA: 'test-iso-employee-A-' + uuid(),
  employeeB: 'test-iso-employee-B-' + uuid(),
  appointmentA: 'test-iso-appt-A-' + uuid(),
  appointmentB: 'test-iso-appt-B-' + uuid(),
  couponA: 'test-iso-coupon-A-' + uuid(),
  couponB: 'test-iso-coupon-B-' + uuid()
};

let server;
let baseUrl;

function makeClient() {
  const jar = new Map();
  return {
    async request(method, url, body) {
      const headers = {};
      if (jar.size > 0) {
        headers.Cookie = [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
      }
      if (body !== undefined) headers['Content-Type'] = 'application/json';
      const res = await fetch(baseUrl + url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined
      });
      for (const cookie of res.headers.getSetCookie()) {
        const pair = cookie.split(';')[0];
        const eq = pair.indexOf('=');
        if (eq > 0) jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
      }
      const text = await res.text();
      let json = null;
      try { json = JSON.parse(text); } catch (e) { /* resposta nao-JSON */ }
      return { status: res.status, body: json, text };
    },
    get(url) { return this.request('GET', url); },
    post(url, body) { return this.request('POST', url, body || {}); },
    put(url, body) { return this.request('PUT', url, body || {}); },
    del(url, body) { return this.request('DELETE', url, body); }
  };
}

test.before(async () => {
  await ensurePostgres();
  await store.init();

  const now = new Date().toISOString();
  const passwordHash = bcrypt.hashSync('SenhaForte1!', 4);

  runAsAdmin(() => {
    store.insert('establishments', { id: ids.tenantA, name: 'Isolamento A', niche: 'Outro', createdAt: now });
    store.insert('establishments', { id: ids.tenantB, name: 'Isolamento B', niche: 'Outro', createdAt: now });

    store.insert('users', { id: ids.userA, name: 'Operador A', email: `iso-a-${ids.userA}@teste.com`.toLowerCase(), passwordHash, role: 'operator', allowedEstablishmentIds: [ids.tenantA], createdAt: now });
    store.insert('users', { id: ids.userB, name: 'Operador B', email: `iso-b-${ids.userB}@teste.com`.toLowerCase(), passwordHash, role: 'operator', allowedEstablishmentIds: [ids.tenantB], createdAt: now });
    store.insert('clients', { id: ids.clientA, establishmentId: ids.tenantA, name: 'Cliente A', phone: '1111', createdAt: now });
    store.insert('clients', { id: ids.clientB, establishmentId: ids.tenantB, name: 'Cliente B', phone: '2222', createdAt: now });

    store.insert('services', { id: ids.serviceA, establishmentId: ids.tenantA, name: 'Servico A', price: 10, createdAt: now });
    store.insert('services', { id: ids.serviceB, establishmentId: ids.tenantB, name: 'Servico B', price: 20, createdAt: now });

    store.insert('employees', { id: ids.employeeA, establishmentId: ids.tenantA, name: 'Funcionario A', createdAt: now });
    store.insert('employees', { id: ids.employeeB, establishmentId: ids.tenantB, name: 'Funcionario B', createdAt: now });

    store.insert('appointments', { id: ids.appointmentA, establishmentId: ids.tenantA, clientId: ids.clientA, serviceId: ids.serviceA, serviceName: 'Servico A', dateTime: '2026-10-01T10:00', total: 10, status: 'Pendente', createdAt: now });
    store.insert('appointments', { id: ids.appointmentB, establishmentId: ids.tenantB, clientId: ids.clientB, serviceId: ids.serviceB, serviceName: 'Servico B', dateTime: '2026-10-01T11:00', total: 20, status: 'Pendente', createdAt: now });

    store.insert('coupons', { id: ids.couponA, establishmentId: ids.tenantA, code: 'ISO10', type: 'percent', value: 10, usedCount: 0, status: 'active', createdAt: now });
    store.insert('coupons', { id: ids.couponB, establishmentId: ids.tenantB, code: 'BRL20', type: 'percent', value: 10, usedCount: 0, status: 'active', createdAt: now });
  });
  await store.flush();

  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(session({ secret: 'test-secret', resave: false, saveUninitialized: false }));
  app.use(tenantContextMiddleware);
  app.use('/api/auth', authRoutes);
  app.use('/api/establishments', establishmentsRoutes);
  app.use('/api/clients', clientsRoutes);
  app.use('/api/appointments', appointmentsRoutes);
  app.use('/api/coupons', couponsRoutes);
  app.use('/api/dashboard', dashboardRoutes);
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
      // Remove tudo que foi criado pelos dois tenants de teste (inclusive
      // registros criados via HTTP pelos proprios testes). Itera sobre um
      // SNAPSHOT: store.remove faz splice no cache vivo e pularia linhas.
      for (const collection of ['coupons', 'appointments', 'employees', 'services', 'clients']) {
        const rows = store.all(collection).filter((row) =>
          row.establishmentId === ids.tenantA || row.establishmentId === ids.tenantB);
        for (const row of rows) store.remove(collection, row.id);
      }
      store.remove('users', ids.userA);
      store.remove('users', ids.userB);
      store.remove('establishments', ids.tenantA);
      store.remove('establishments', ids.tenantB);
    });
    await store.flush();
  } finally {
    await store.close();
  }
});

async function loginAsA() {
  const client = makeClient();
  const res = await client.post('/api/auth/login', {
    email: `iso-a-${ids.userA}@teste.com`.toLowerCase(),
    password: 'SenhaForte1!',
    establishmentId: ids.tenantA
  });
  assert.equal(res.status, 200, 'login do operador A');
  assert.equal(res.body.establishmentId, ids.tenantA);
  return client;
}

test('T1 — listagem de clientes nao retorna clientes de outro tenant', async () => {
  const client = await loginAsA();
  const res = await client.get('/api/clients');
  assert.equal(res.status, 200);
  const returned = res.body.map((c) => c.id);
  assert.ok(returned.includes(ids.clientA), 'cliente da loja A aparece');
  assert.ok(!returned.includes(ids.clientB), 'cliente da loja B NAO aparece');
  for (const row of res.body) assert.equal(row.establishmentId, ids.tenantA);
});

test('T2 — leitura/alteracao de cliente de outro tenant retorna 404 e nao altera', async () => {
  const client = await loginAsA();
  const before = store.findById('clients', ids.clientB).name;

  const put = await client.put(`/api/clients/${ids.clientB}`, { name: 'Invadido' });
  assert.equal(put.status, 404);

  const del = await client.del(`/api/clients/${ids.clientB}`);
  assert.equal(del.status, 404);

  assert.equal(store.findById('clients', ids.clientB).name, before, 'cliente B permanece intacto');
});

test('T3 — agendamento de outro tenant nao pode ser lido nem alterado/removido', async () => {
  const client = await loginAsA();

  const list = await client.get('/api/appointments');
  assert.equal(list.status, 200);
  const returned = list.body.map((a) => a.id);
  assert.ok(returned.includes(ids.appointmentA));
  assert.ok(!returned.includes(ids.appointmentB));

  const put = await client.put(`/api/appointments/${ids.appointmentB}`, { status: 'Concluido' });
  assert.equal(put.status, 404);

  const del = await client.del(`/api/appointments/${ids.appointmentB}`);
  assert.equal(del.status, 404);

  assert.equal(store.findById('appointments', ids.appointmentB).status, 'Pendente', 'agendamento B intacto');
});

test('T4 — criar agendamento referenciando service/client/employee de outro tenant e recusado', async () => {
  const client = await loginAsA();

  const withService = await client.post('/api/appointments', {
    clientId: ids.clientA, serviceId: ids.serviceB, dateTime: '2026-10-02T09:00'
  });
  assert.equal(withService.status, 400, 'serviceId de outro tenant recusado');

  const withClient = await client.post('/api/appointments', {
    clientId: ids.clientB, serviceId: ids.serviceA, dateTime: '2026-10-02T09:00'
  });
  assert.equal(withClient.status, 400, 'clientId de outro tenant recusado');

  const withEmployee = await client.post('/api/appointments', {
    clientId: ids.clientA, serviceId: ids.serviceA, employeeId: ids.employeeB, dateTime: '2026-10-02T09:00'
  });
  assert.equal(withEmployee.status, 400, 'employeeId de outro tenant recusado');

  const valid = await client.post('/api/appointments', {
    clientId: ids.clientA, serviceId: ids.serviceA, dateTime: '2026-10-02T09:00'
  });
  assert.equal(valid.status, 201, 'agendamento com dados do proprio tenant e aceito');
  assert.equal(valid.body.establishmentId, ids.tenantA);
});

test('T5 — cupons sao isolados por tenant (mesmo codigo pode existir em lojas diferentes)', async () => {
  const client = await loginAsA();

  const list = await client.get('/api/coupons');
  assert.equal(list.status, 200);
  const returned = list.body.map((c) => c.id);
  assert.ok(returned.includes(ids.couponA));
  assert.ok(!returned.includes(ids.couponB), 'cupom da loja B NAO aparece');

  const dup = await client.post('/api/coupons', { code: 'BRL20', type: 'percent', value: 5 });
  assert.equal(dup.status, 201, 'codigo igual ao da loja B e permitido (tenants diferentes)');

  const sameTenantDup = await client.post('/api/coupons', { code: 'ISO10', type: 'percent', value: 5 });
  assert.equal(sameTenantDup.status, 400, 'codigo duplicado no MESMO tenant e recusado');

  const putB = await client.put(`/api/coupons/${ids.couponB}`, { code: 'HACK', type: 'percent', value: 99 });
  assert.equal(putB.status, 404);

  const delB = await client.del(`/api/coupons/${ids.couponB}`);
  assert.equal(delB.status, 404);
});

test('T6 — dashboard calcula apenas dados do tenant da sessao', async () => {
  const client = await loginAsA();
  const res = await client.get('/api/dashboard');
  assert.equal(res.status, 200);
  const expectedClients = store.allScoped('clients', ids.tenantA).length;
  const expectedAppointments = store.allScoped('appointments', ids.tenantA).length;
  assert.equal(res.body.totalClients, expectedClients);
  assert.equal(res.body.totalAppointments, expectedAppointments);
  assert.ok(res.body.totalClients < store.all('clients').length, 'nao conta clientes de outras lojas');
});

test('T7 — operador da loja A nao consegue selecionar nem ler a loja B', async () => {
  const client = await loginAsA();

  const select = await client.post(`/api/establishments/${ids.tenantB}/select`);
  assert.equal(select.status, 403);

  const read = await client.get(`/api/establishments/${ids.tenantB}`);
  assert.equal(read.status, 403);

  const list = await client.get('/api/establishments');
  assert.equal(list.status, 200);
  const returned = list.body.map((e) => e.id);
  assert.ok(returned.includes(ids.tenantA));
  assert.ok(!returned.includes(ids.tenantB));
});

test('T8 — operador da loja B ve apenas os proprios dados', async () => {
  const client = makeClient();
  const login = await client.post('/api/auth/login', {
    email: `iso-b-${ids.userB}@teste.com`.toLowerCase(),
    password: 'SenhaForte1!',
    establishmentId: ids.tenantB
  });
  assert.equal(login.status, 200);
  assert.equal(login.body.establishmentId, ids.tenantB);

  const clients = await client.get('/api/clients');
  const returned = clients.body.map((c) => c.id);
  assert.ok(returned.includes(ids.clientB));
  assert.ok(!returned.includes(ids.clientA));

  const apptPut = await client.put(`/api/appointments/${ids.appointmentA}`, { status: 'Cancelado' });
  assert.equal(apptPut.status, 404);
  assert.equal(store.findById('appointments', ids.appointmentA).status, 'Pendente');
});
