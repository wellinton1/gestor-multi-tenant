// Contexto de tenant por requisicao (AsyncLocalStorage).
//
// A camada de dados (store) precisa saber, sem receber parametros por toda a
// aplicacao, qual e o estabelecimento da requisicao atual e se ela roda no
// contexto de um administrador global da plataforma. Esse contexto e usado
// para configurar o Row-Level Security do PostgreSQL (app.establishment_id /
// app.admin_context) antes de cada escrita, como camada extra de isolamento.
//
// Uso nas rotas: nada a fazer nas rotas autenticadas (o middleware abaixo ja
// propaga o contexto da sessao). Rotas publicas que escrevem em nome de uma
// loja (portal do cliente) devem envolver a operacao com runWithTenant().

const { AsyncLocalStorage } = require('async_hooks');

const storage = new AsyncLocalStorage();

// Retorna o contexto atual (ou null fora de uma requisicao/operacao).
function getContext() {
  return storage.getStore() || null;
}

// Executa fn dentro de um contexto de tenant explicito.
function runWithTenant(establishmentId, fn) {
  return storage.run({ establishmentId: establishmentId || null, admin: false }, fn);
}

// Executa fn com bypass de RLS (operacoes de sistema: seed, backup, migracao,
// manutencao do cache e rotas de administrador global da plataforma).
function runAsAdmin(fn) {
  return storage.run({ establishmentId: null, admin: true }, fn);
}

// Middleware Express: propaga o contexto do usuario logado para toda a
// requisicao. Admins globais (role admin sem lista de lojas) recebem bypass,
// pois legitimamente operam em qualquer estabelecimento.
function tenantContextMiddleware(req, res, next) {
  if (!req.session || !req.session.userId) return next();
  const context = {
    userId: req.session.userId,
    establishmentId: req.session.establishmentId || null,
    admin: false
  };
  try {
    const store = require('./store');
    const { isGlobalAdmin } = require('../utils/access');
    context.admin = isGlobalAdmin(store.findById('users', req.session.userId));
  } catch (err) {
    // Cache indisponivel (boot): segue sem bypass; o RLS continua default-deny.
  }
  storage.run(context, next);
}

module.exports = {
  getContext,
  runWithTenant,
  runAsAdmin,
  tenantContextMiddleware
};
