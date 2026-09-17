const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const store = require('./store');

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 12;

function buildInitialDb() {
  const db = { ...store.readDB() };
  const now = new Date().toISOString();
  // Otimizacao: o seed so persiste no PostgreSQL se efetivamente criar ou
  // alterar algo. Antes ele reescrevia TODAS as tabelas a cada boot.
  let changed = false;

  // Admin user (opcional via .env). Se ADMIN_PASSWORD nao estiver definido,
  // nenhum admin e criado aqui - o usuario fara o setup wizard na primeira
  // vez que abrir a URL (ver /api/setup em src/routes/setup.js).
  const email = (process.env.ADMIN_EMAIL || 'admin@admin.com').toLowerCase().trim();
  let password = process.env.ADMIN_PASSWORD;
  // Remove aspas ao redor se existirem (dotenv inclui aspas se valor estiver entre aspas no .env)
  if (password && ((password.startsWith('"') && password.endsWith('"')) || (password.startsWith("'") && password.endsWith("'")))) {
    password = password.slice(1, -1);
  }
  const name = process.env.ADMIN_NAME || 'Administrador';

  if (!password) {
    console.log('ADMIN_PASSWORD ausente no .env - setup wizard estara disponivel na primeira abertura da URL.');
  } else {
    if (isProduction() && password.length < 12) {
      console.error('ERRO: ADMIN_PASSWORD deve ter pelo menos 12 caracteres em producao');
      process.exit(1);
    }
    const existing = db.users.find((u) => u.email === email);
    if (!existing) {
      const passwordHash = bcrypt.hashSync(password, BCRYPT_ROUNDS);
      db.users.push({
        id: uuid(),
        email,
        passwordHash,
        name,
        role: 'admin',
        passwordChangedAt: new Date().toISOString(),
        createdAt: now
      });
      changed = true;
      console.log('Usuario administrador criado com sucesso.');
    } else if (!existing.role || existing.role !== 'admin') {
      existing.role = 'admin';
      changed = true;
      console.log('Role atualizado para admin no usuario existente.');
    }
  }

  // Demo data (only if explicitly enabled and empty)
  if (process.env.SEED_DEMO_DATA === 'true' && db.establishments.length === 0) {
    changed = true;
    const estId = uuid();
    const estId2 = uuid();
    db.establishments.push(
      { id: estId, name: 'Barbearia Elite', niche: 'Barbearia', phone: '(11) 3456-7890', address: 'Rua Augusta, 1234 - Sao Paulo, SP', description: 'Barbearia premium com cortes classicos e modernos, barba e tratamentos capilares.', logoDataUrl: '', expirationPeriod: 'Sem expiracao', createdAt: now },
      { id: estId2, name: 'Pizzaria Boa Mesa', niche: 'Pizzaria', phone: '(11) 3344-5566', address: 'Av. das Acacias, 200 - Sao Paulo, SP', description: 'Pizzaria artesanal com forno a lenha e sabores tradicionais.', logoDataUrl: '', expirationPeriod: 'Sem expiracao', createdAt: now }
    );

    const emp1 = uuid(), emp2 = uuid(), emp3 = uuid(), emp4 = uuid();
    db.employees.push(
      { id: emp1, establishmentId: estId, name: 'Joao Silva', role: 'Administrador', email: 'joao@barbeariaelite.com', phone: '(11) 91234-5678', createdAt: now },
      { id: emp2, establishmentId: estId, name: 'Carlos Santos', role: 'Funcionario', email: 'carlos@barbeariaelite.com', phone: '(11) 92345-6789', createdAt: now },
      { id: emp3, establishmentId: estId, name: 'Pedro Oliveira', role: 'Funcionario', email: 'pedro@barbeariaelite.com', phone: '(11) 93456-7890', createdAt: now },
      { id: emp4, establishmentId: estId2, name: 'Mariana Souza', role: 'Administrador', email: 'mariana@boamesa.com', phone: '(11) 99876-5432', createdAt: now }
    );

    const cli1 = uuid(), cli2 = uuid(), cli3 = uuid(), cli4 = uuid();
    db.clients.push(
      { id: cli1, establishmentId: estId, name: 'Ricardo Alves', email: 'ricardo@email.com', phone: '(11) 99876-5432', notes: '', createdAt: now },
      { id: cli2, establishmentId: estId, name: 'Marcelo Souza', email: 'marcelo@email.com', phone: '(11) 98765-4321', notes: '', createdAt: now },
      { id: cli3, establishmentId: estId, name: 'Anderson Lima', email: 'anderson@email.com', phone: '(11) 97654-3210', notes: '', createdAt: now },
      { id: cli4, establishmentId: estId2, name: 'Fabiana Costa', email: 'fabiana@email.com', phone: '(11) 94455-6677', notes: '', createdAt: now }
    );

    const svcCorte = uuid(), svcBarba = uuid(), svcCombo = uuid(), svcPezinho = uuid(), svcPizza = uuid(), svcBorda = uuid();
    db.services.push(
      { id: svcCorte, establishmentId: estId, category: 'Cabelo', name: 'Corte de Cabelo', description: 'Corte masculino classico ou moderno', price: 45, durationMinutes: 40, createdAt: now },
      { id: svcBarba, establishmentId: estId, category: 'Barba', name: 'Barba', description: 'Modelagem e acabamento de barba', price: 30, durationMinutes: 30, createdAt: now },
      { id: svcCombo, establishmentId: estId, category: 'Combo', name: 'Corte + Barba', description: 'Combo completo de corte e barba', price: 65, durationMinutes: 60, createdAt: now },
      { id: svcPezinho, establishmentId: estId, category: 'Cabelo', name: 'Pezinho', description: 'Acabamento da nuca e laterais', price: 15, durationMinutes: 15, createdAt: now },
      { id: svcPizza, establishmentId: estId2, category: 'Pizzaria', name: 'Pizza Margherita', description: 'Pizza classica com mussarela e manjericao', price: 45, durationMinutes: 30, createdAt: now },
      { id: svcBorda, establishmentId: estId2, category: 'Pizzaria', name: 'Borda Recheada', description: 'Borda especial com catupiry e ervas', price: 15, durationMinutes: 10, createdAt: now }
    );

    db.appointments.push(
      { id: uuid(), establishmentId: estId, clientId: cli1, employeeId: emp1, serviceId: svcCorte, serviceName: 'Corte de Cabelo', dateTime: '2026-07-21T11:00:00', total: 45, status: 'Em Andamento', source: 'admin', createdAt: now },
      { id: uuid(), establishmentId: estId, clientId: cli2, employeeId: emp2, serviceId: svcCombo, serviceName: 'Corte + Barba', dateTime: '2026-07-21T12:30:00', total: 65, status: 'Pendente', source: 'admin', createdAt: now },
      { id: uuid(), establishmentId: estId, clientId: cli3, employeeId: emp3, serviceId: svcBarba, serviceName: 'Barba', dateTime: '2026-07-22T07:00:00', total: 30, status: 'Cancelado', source: 'admin', createdAt: now },
      { id: uuid(), establishmentId: estId, clientId: cli1, employeeId: null, serviceId: svcCombo, serviceName: 'Corte + Barba', dateTime: '2026-07-22T18:44:00', total: 65, status: 'Concluido', source: 'portal', createdAt: now },
      { id: uuid(), establishmentId: estId2, clientId: cli4, employeeId: emp4, serviceId: svcPizza, serviceName: 'Pizza Margherita', dateTime: '2026-07-22T19:30:00', total: 45, status: 'Pendente', source: 'admin', createdAt: now }
    );

    const demoOpPassword = process.env.DEMO_OPERATOR_PASSWORD;
    if (demoOpPassword) {
      db.users.push(
        { id: uuid(), name: 'Operador A', email: 'operadorA@gestor.com', passwordHash: bcrypt.hashSync(demoOpPassword, BCRYPT_ROUNDS), role: 'operator', allowedEstablishmentIds: [estId], createdAt: now, passwordChangedAt: new Date().toISOString() },
        { id: uuid(), name: 'Operador B', email: 'operadorB@gestor.com', passwordHash: bcrypt.hashSync(demoOpPassword, BCRYPT_ROUNDS), role: 'operator', allowedEstablishmentIds: [estId2], createdAt: now, passwordChangedAt: new Date().toISOString() }
      );
    }

    console.log('Dados de demonstracao criados (estabelecimentos)');
  }

  return { db, changed };
}

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

async function runSeed() {
  const { db, changed } = buildInitialDb();
  if (changed) {
    await store.writeDBSync(db);
  }
}

module.exports = { runSeed };
