// Rotas de recuperação de senha (forgot / reset)

const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const store = require('../data/store');
const { sendPasswordResetEmail } = require('../utils/email');

const router = express.Router();

// Configurações
const RESET_TOKEN_EXPIRES_HOURS = Number(process.env.PASSWORD_RESET_EXPIRES_HOURS) || 2;
const RESET_TOKEN_BYTES = 32;
const BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3000';

// Validação de senha forte
function validatePasswordStrength(password) {
  const errors = [];
  if (password.length < 8) errors.push('A senha deve ter no mínimo 8 caracteres.');
  if (!/[A-Z]/.test(password)) errors.push('A senha deve conter pelo menos uma letra maiúscula.');
  if (!/[a-z]/.test(password)) errors.push('A senha deve conter pelo menos uma letra minúscula.');
  if (!/[0-9]/.test(password)) errors.push('A senha deve conter pelo menos um número.');
  if (!/[!@#$%^&*(),.?":{}|<>_]/.test(password)) errors.push('A senha deve conter pelo menos um caractere especial.');
  return errors;
}

// POST /api/auth/forgot-password
// Body: { email }
// Gera token, salva hash no usuário, envia email
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório.' });
    }
    
    const normalizedEmail = String(email).toLowerCase().trim();
    const user = store.query('users', (u) => u.email === normalizedEmail)[0];
    
    // Sempre retorna sucesso para não vazar existência de emails
    if (!user) {
      return res.json({ ok: true, message: 'Se o email existir, você receberá instruções.' });
    }
    
    // Gera token seguro
    const token = crypto.randomBytes(RESET_TOKEN_BYTES).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRES_HOURS * 60 * 60 * 1000).toISOString();
    
    // Salva hash do token e expiração
    store.update('users', user.id, {
      passwordResetToken: tokenHash,
      passwordResetExpires: expiresAt
    });
    
    // Envia email
    const emailResult = await sendPasswordResetEmail(user.email, token, user.name, BASE_URL);
    
    if (!emailResult.success) {
      console.error('Falha ao enviar email de reset:', emailResult.reason);
      // Em desenvolvimento, retorna o token para teste
      if (process.env.NODE_ENV !== 'production') {
        return res.json({ 
          ok: true, 
          message: 'Email não configurado (modo dev). Token: ' + token,
          devToken: token
        });
      }
    }
    
    res.json({ ok: true, message: 'Se o email existir, você receberá instruções.' });
  } catch (err) {
    console.error('Erro em forgot-password:', err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// POST /api/auth/reset-password
// Body: { token, password, confirmPassword }
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body || {};
    
    if (!token || !password || !confirmPassword) {
      return res.status(400).json({ error: 'Token, senha e confirmação são obrigatórios.' });
    }
    
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'As senhas não conferem.' });
    }
    
    const strengthErrors = validatePasswordStrength(password);
    if (strengthErrors.length > 0) {
      return res.status(400).json({ error: strengthErrors.join(' ') });
    }
    
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    const user = store.query('users', (u) => u.passwordResetToken === tokenHash)[0];
    
    if (!user) {
      return res.status(400).json({ error: 'Token inválido ou expirado.' });
    }
    
    // Verifica expiração
    if (user.passwordResetExpires && new Date(user.passwordResetExpires) < new Date()) {
      return res.status(400).json({ error: 'Token expirado. Solicite uma nova redefinição.' });
    }
    
    // Atualiza senha e limpa token
    const newHash = bcrypt.hashSync(password, 12);
    store.update('users', user.id, {
      passwordHash: newHash,
      passwordChangedAt: new Date().toISOString(),
      passwordResetToken: null,
      passwordResetExpires: null
    });
    
    res.json({ ok: true, message: 'Senha redefinida com sucesso. Faça login com a nova senha.' });
  } catch (err) {
    console.error('Erro em reset-password:', err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// GET /api/auth/verify-reset-token/:token
// Verifica se token é válido (para página de reset)
router.get('/verify-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    const user = store.query('users', (u) => u.passwordResetToken === tokenHash)[0];
    
    if (!user) {
      return res.status(400).json({ valid: false, error: 'Token inválido.' });
    }
    
    if (user.passwordResetExpires && new Date(user.passwordResetExpires) < new Date()) {
      return res.status(400).json({ valid: false, error: 'Token expirado.' });
    }
    
    res.json({ valid: true, email: user.email });
  } catch (err) {
    console.error('Erro em verify-reset-token:', err);
    res.status(500).json({ valid: false, error: 'Erro interno.' });
  }
});

module.exports = router;