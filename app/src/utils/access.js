// Controle centralizado de acesso por estabelecimento.
//
// Regra de negocio: acesso global (allowedEstablishmentIds null/undefined) e
// privilegio EXCLUSIVO de usuarios com role 'admin'. Operadores (role operator)
// SEMPRE precisam de uma lista explicita de lojas permitidas; sem ela, nao tem
// acesso a nenhuma loja.

// Retorna a lista efetiva de lojas permitidas para o usuario:
//   - admin com allowed null/undefined  -> null (acesso global a todas)
//   - qualquer outro                    -> array (pode ser vazio = sem acesso)
function resolveAllowedIds(user) {
  if (!user) return [];
  if (Array.isArray(user.allowedEstablishmentIds)) return user.allowedEstablishmentIds;
  if (user.role === 'admin') return null; // acesso global
  return []; // operador sem lista = sem acesso
}

// Admin da plataforma: role admin E sem restricao de lojas.
function isGlobalAdmin(user) {
  return !!user && user.role === 'admin' &&
    (user.allowedEstablishmentIds === null || user.allowedEstablishmentIds === undefined);
}

// O usuario pode acessar o estabelecimento informado?
function hasAccessToEstablishment(user, establishmentId) {
  const ids = resolveAllowedIds(user);
  if (ids === null) return true;
  return ids.includes(establishmentId);
}

module.exports = { resolveAllowedIds, isGlobalAdmin, hasAccessToEstablishment };