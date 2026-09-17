const express = require('express');
const bcrypt = require('bcryptjs');
const store = require('../data/store');
const { requireLogin } = require('../middleware/auth');
const { isGlobalAdmin } = require('../utils/access');

const router = express.Router();
// requireLogin e rate limiting sao aplicados no server.js
router.use(requireLogin);

// Validação de senha forte
function validatePasswordStrength(password) {
  const errors = [];
  if (password.length < 8) errors.push('A senha deve ter no minimo 8 caracteres.');
  if (!/[A-Z]/.test(password)) errors.push('A senha deve conter pelo menos uma letra maiuscula.');
  if (!/[a-z]/.test(password)) errors.push('A senha deve conter pelo menos uma letra minuscula.');
  if (!/[0-9]/.test(password)) errors.push('A senha deve conter pelo menos um numero.');
  if (!/[!@#$%^&*(),.?":{}|<>_]/.test(password)) errors.push('A senha deve conter pelo menos um caractere especial.');
  return errors;
}

// Trocar propria senha
router.put('/change', (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Senha atual e nova senha sao obrigatorias.' });
  }

  const user = store.findById('users', req.session.userId);
  if (!user) return res.status(401).json({ error: 'Nao autenticado.' });

  if (!bcrypt.compareSync(currentPassword, user.passwordHash)) {
    return res.status(400).json({ error: 'Senha atual incorreta.' });
  }

  const strengthErrors = validatePasswordStrength(newPassword);
  if (strengthErrors.length > 0) {
    return res.status(400).json({ error: strengthErrors.join(' ') });
  }

  const newHash = bcrypt.hashSync(newPassword, 12);
  store.update('users', user.id, { passwordHash: newHash, passwordChangedAt: new Date().toISOString() });
  res.json({ ok: true, message: 'Senha alterada com sucesso.' });
});

// Admin: resetar senha de outro usuario
router.put('/admin-reset/:userId', (req, res) => {
  const currentUser = store.findById('users', req.session.userId);
  if (!currentUser || !isGlobalAdmin(currentUser)) {
    return res.status(403).json({ error: 'Apenas o administrador da plataforma pode resetar senhas.' });
  }

  const targetUser = store.findById('users', req.params.userId);
  if (!targetUser) return res.status(404).json({ error: 'Usuario nao encontrado.' });

  const { newPassword } = req.body || {};
  if (!newPassword) {
    return res.status(400).json({ error: 'Nova senha obrigatoria.' });
  }

  const strengthErrors = validatePasswordStrength(newPassword);
  if (strengthErrors.length > 0) {
    return res.status(400).json({ error: strengthErrors.join(' ') });
  }

  const newHash = bcrypt.hashSync(newPassword, 12);
  store.update('users', targetUser.id, { passwordHash: newHash, passwordChangedAt: new Date().toISOString() });
  res.json({ ok: true, message: 'Senha do usuario resetada com sucesso.' });
});

// Admin: listar todos os usuarios do sistema (para gerenciamento)
router.get('/admin-users', (req, res) => {
  const currentUser = store.findById('users', req.session.userId);
  if (!currentUser || !isGlobalAdmin(currentUser)) {
    return res.status(403).json({ error: 'Apenas o administrador da plataforma pode gerenciar usuarios.' });
  }

  const users = store.all('users').map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role || 'operator',
    allowedEstablishmentIds: u.allowedEstablishmentIds || null,
    passwordChangedAt: u.passwordChangedAt || null,
    twoFactorEnabled: !!u.twoFactorEnabled,
    createdAt: u.createdAt
  }));
  res.json(users);
});

// Admin: excluir usuario
router.delete('/admin-delete/:userId', (req, res) => {
  const currentUser = store.findById('users', req.session.userId);
  if (!currentUser || !isGlobalAdmin(currentUser)) {
    return res.status(403).json({ error: 'Apenas o administrador da plataforma pode excluir usuarios.' });
  }

  const targetUser = store.findById('users', req.params.userId);
  if (!targetUser) return res.status(404).json({ error: 'Usuario nao encontrado.' });

  if (targetUser.id === currentUser.id) {
    return res.status(400).json({ error: 'Nao e possivel excluir o seu proprio usuario.' });
  }

  store.remove('users', targetUser.id);
  res.json({ ok: true, message: 'Usuario excluido com sucesso.' });
});

// Admin: associar estabelecimentos ao usuario
router.put('/admin-associate/:userId', (req, res) => {
  const currentUser = store.findById('users', req.session.userId);
  if (!currentUser || !isGlobalAdmin(currentUser)) {
    return res.status(403).json({ error: 'Apenas o administrador da plataforma pode gerenciar associacoes.' });
  }

  const targetUser = store.findById('users', req.params.userId);
  if (!targetUser) return res.status(404).json({ error: 'Usuario nao encontrado.' });

  const { allowedEstablishmentIds } = req.body || {};
  // allowedEstablishmentIds deve ser:
  //   - null  -> acesso global (apenas admin da plataforma / role admin)
  //   - array -> IDs permitidos (nao vazio p/ nao-admin, senao lockout)
  let ids = Array.isArray(allowedEstablishmentIds) ? allowedEstablishmentIds : null;

  // Anti-lockout: nao-admin com array vazio nao consegue logar (auth.js 403
  // "nao associado a nenhum estabelecimento"). Rejeitar p/ evitar isso.
  if (Array.isArray(ids) && ids.length === 0 && targetUser.role !== 'admin') {
    return res.status(400).json({
      error: 'Voce precisa marcar ao menos 1 estabelecimento (ou ativar Acesso Global). Este usuario ficaria sem acesso e nao conseguiria fazer login.'
    });
  }

  // Acesso Global (null) e privilegio EXCLUSIVO de administradores.
  // Operadores SEMPRE precisam de uma lista explicita de lojas permitidas.
  if (ids === null && targetUser.role !== 'admin') {
    return res.status(400).json({
      error: 'Acesso Global e exclusivo para administradores. Marque ao menos 1 estabelecimento para este operador.'
    });
  }

  store.update('users', targetUser.id, { allowedEstablishmentIds: ids });
  res.json({ ok: true, message: 'Associacoes atualizadas com sucesso.' });
});

module.exports = router;
