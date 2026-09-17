// Rotas de Autenticação de Dois Fatores (2FA / TOTP)

const express = require('express');
const crypto = require('crypto');
const { generateSecret, generateURI } = require('otplib');
const { verifyTotpToken } = require('../utils/totp');
const qrcode = require('qrcode');
const store = require('../data/store');
const { requireLogin, requireEstablishment } = require('../middleware/auth');
const { isGlobalAdmin } = require('../utils/access');
const { sendTwoFactorEnabledEmail, sendTwoFactorDisabledEmail } = require('../utils/email');

const router = express.Router();
router.use(requireLogin);

// Configurações
const TOTP_ISSUER = process.env.TOTP_ISSUER || 'Gestor Multi-Tenant';
const BACKUP_CODES_COUNT = 8;
const BACKUP_CODE_BYTES = 4; // 4 bytes = 8 chars hex

// Gera códigos de backup
function generateBackupCodes(count = BACKUP_CODES_COUNT) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    codes.push(crypto.randomBytes(BACKUP_CODE_BYTES).toString('hex').toUpperCase());
  }
  return codes;
}

// Hash de código de backup (para não guardar em claro)
function hashBackupCode(code) {
  return crypto.createHash('sha256').update(code.toUpperCase()).digest('hex');
}

// Verifica código de backup
function verifyBackupCode(user, code) {
  if (!user.twoFactorBackupCodes || !Array.isArray(user.twoFactorBackupCodes)) return false;
  const hashed = hashBackupCode(code);
  const idx = user.twoFactorBackupCodes.indexOf(hashed);
  if (idx === -1) return false;
  // Remove o código usado (one-time use)
  user.twoFactorBackupCodes.splice(idx, 1);
  store.update('users', user.id, { twoFactorBackupCodes: user.twoFactorBackupCodes });
  return true;
}

// POST /api/2fa/setup
// Inicia configuração do 2FA: gera secret, QR code, backup codes
router.post('/setup', async (req, res) => {
  try {
    const user = store.findById('users', req.session.userId);
    if (!user) return res.status(401).json({ error: 'Não autenticado.' });

    if (user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA já está ativado. Desative primeiro para reconfigurar.' });
    }

    // Gera secret único para o usuário
    const secret = generateSecret();
    const otpauth = generateURI({ secret, issuer: TOTP_ISSUER, label: user.email });

    // Gera QR code como data URL
    const qrCodeDataUrl = await qrcode.toDataURL(otpauth);

    // Gera backup codes
    const backupCodes = generateBackupCodes();
    const backupCodesHashed = backupCodes.map(hashBackupCode);

    // Salva temporariamente na sessão (não persiste até confirmar)
    req.session.pending2FA = {
      secret,
      backupCodesHashed,
      createdAt: Date.now()
    };

    res.json({
      secret,
      qrCode: qrCodeDataUrl,
      backupCodes,
      otpauthUrl: otpauth
    });
  } catch (err) {
    console.error('Erro em 2fa/setup:', err);
    res.status(500).json({ error: 'Erro ao gerar configuração 2FA.' });
  }
});

// POST /api/2fa/enable
// Confirma ativação: verifica código TOTP e ativa
router.post('/enable', async (req, res) => {
  try {
    const user = store.findById('users', req.session.userId);
    if (!user) return res.status(401).json({ error: 'Não autenticado.' });
    
    const { token } = req.body || {};
    const pending = req.session.pending2FA;
    
    if (!pending || !pending.secret) {
      return res.status(400).json({ error: 'Nenhuma configuração pendente. Inicie o setup primeiro.' });
    }
    
    if (!token) {
      return res.status(400).json({ error: 'Código do autenticador é obrigatório.' });
    }
    
    // Verifica TOTP (helper usa API otplib v13 + tolerância de relógio)
    const isValid = verifyTotpToken(token, pending.secret);
    if (!isValid) {
      return res.status(400).json({ error: 'Código inválido. Verifique o horário do dispositivo e tente novamente.' });
    }
    
    // Ativa 2FA no usuário
    store.update('users', user.id, {
      twoFactorEnabled: true,
      twoFactorSecret: pending.secret,
      twoFactorBackupCodes: pending.backupCodesHashed,
      twoFactorEnabledAt: new Date().toISOString()
    });
    
    // Limpa sessão pendente
    delete req.session.pending2FA;
    
    // Envia email de confirmação
    await sendTwoFactorEnabledEmail(user.email, user.name);
    
    res.json({ ok: true, message: 'Autenticação de dois fatores ativada com sucesso!' });
  } catch (err) {
    console.error('Erro em 2fa/enable:', err);
    res.status(500).json({ error: 'Erro ao ativar 2FA.' });
  }
});

// POST /api/2fa/verify
// Verifica código TOTP ou backup code (usado no login)
router.post('/verify', async (req, res) => {
  try {
    const { token, userId } = req.body || {};
    
    // Permite verificação durante login (userId vem da sessão ou body)
    const targetUserId = userId || req.session.userId;
    if (!targetUserId) return res.status(401).json({ error: 'Não autenticado.' });
    
    const user = store.findById('users', targetUserId);
    if (!user) return res.status(401).json({ error: 'Usuário não encontrado.' });
    
    if (!user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA não está ativado para este usuário.' });
    }
    
    if (!token) {
      return res.status(400).json({ error: 'Código é obrigatório.' });
    }
    
    // Primeiro tenta TOTP
    let isValid = verifyTotpToken(token, user.twoFactorSecret);
    
    // Se TOTP falhou, tenta backup code
    let usedBackup = false;
    if (!isValid) {
      isValid = verifyBackupCode(user, token);
      usedBackup = isValid;
    }
    
    if (!isValid) {
      return res.status(400).json({ error: 'Código inválido.' });
    }
    
    res.json({ ok: true, usedBackup });
  } catch (err) {
    console.error('Erro em 2fa/verify:', err);
    res.status(500).json({ error: 'Erro ao verificar código.' });
  }
});

// POST /api/2fa/disable
// Desativa 2FA (próprio usuário com senha, ou admin global)
router.post('/disable', async (req, res) => {
  try {
    const currentUser = store.findById('users', req.session.userId);
    if (!currentUser) return res.status(401).json({ error: 'Não autenticado.' });
    
    const { userId, password, token } = req.body || {};
    const targetUserId = userId || currentUser.id;
    
    const targetUser = store.findById('users', targetUserId);
    if (!targetUser) return res.status(404).json({ error: 'Usuário não encontrado.' });
    
    const isSelf = targetUserId === currentUser.id;
    const isAdmin = isGlobalAdmin(currentUser);
    
    // Admin global pode desativar 2FA de qualquer usuário (sem senha/token)
    if (!isSelf && !isAdmin) {
      return res.status(403).json({ error: 'Apenas o administrador da plataforma pode desativar 2FA de outros usuários.' });
    }
    
    if (!targetUser.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA não está ativado para este usuário.' });
    }
    
    // Se é o próprio usuário, exige senha + código TOTP
    if (isSelf) {
      if (!password) {
        return res.status(400).json({ error: 'Senha atual é obrigatória para desativar 2FA.' });
      }
      const bcrypt = require('bcryptjs');
      if (!bcrypt.compareSync(password, targetUser.passwordHash)) {
        return res.status(400).json({ error: 'Senha incorreta.' });
      }
      if (!token) {
        return res.status(400).json({ error: 'Código do autenticador é obrigatório.' });
      }
      const isValid = verifyTotpToken(token, targetUser.twoFactorSecret);
      if (!isValid) {
        return res.status(400).json({ error: 'Código do autenticador inválido.' });
      }
    }
    
    // Desativa
    store.update('users', targetUserId, {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorBackupCodes: null,
      twoFactorEnabledAt: null,
      twoFactorDisabledAt: new Date().toISOString(),
      twoFactorDisabledBy: isSelf ? 'self' : `admin:${currentUser.id}`
    });
    
    // Envia email
    await sendTwoFactorDisabledEmail(targetUser.email, targetUser.name, !isSelf);
    
    res.json({ ok: true, message: 'Autenticação de dois fatores desativada.' });
  } catch (err) {
    console.error('Erro em 2fa/disable:', err);
    res.status(500).json({ error: 'Erro ao desativar 2FA.' });
  }
});

// POST /api/2fa/regenerate-backup-codes
// Regenera códigos de backup (requer senha + TOTP)
router.post('/regenerate-backup-codes', async (req, res) => {
  try {
    const user = store.findById('users', req.session.userId);
    if (!user) return res.status(401).json({ error: 'Não autenticado.' });
    
    if (!user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA não está ativado.' });
    }
    
    const { password, token } = req.body || {};
    if (!password || !token) {
      return res.status(400).json({ error: 'Senha e código do autenticador são obrigatórios.' });
    }
    
    const bcrypt = require('bcryptjs');
    if (!bcrypt.compareSync(password, user.passwordHash)) {
      return res.status(400).json({ error: 'Senha incorreta.' });
    }
    
    const isValid = verifyTotpToken(token, user.twoFactorSecret);
    if (!isValid) {
      return res.status(400).json({ error: 'Código do autenticador inválido.' });
    }

    const backupCodes = generateBackupCodes();
    const backupCodesHashed = backupCodes.map(hashBackupCode);
    
    store.update('users', user.id, { twoFactorBackupCodes: backupCodesHashed });
    
    res.json({ ok: true, backupCodes, message: 'Novos códigos de backup gerados. Guarde em local seguro!' });
  } catch (err) {
    console.error('Erro em 2fa/regenerate-backup-codes:', err);
    res.status(500).json({ error: 'Erro ao gerar códigos de backup.' });
  }
});

// GET /api/2fa/status
// Retorna status do 2FA do usuário atual
router.get('/status', (req, res) => {
  const user = store.findById('users', req.session.userId);
  if (!user) return res.status(401).json({ error: 'Não autenticado.' });
  
  res.json({
    enabled: !!user.twoFactorEnabled,
    enabledAt: user.twoFactorEnabledAt || null,
    backupCodesCount: user.twoFactorBackupCodes ? user.twoFactorBackupCodes.length : 0
  });
});

// Admin: desativar 2FA de qualquer usuário (já coberto em /disable com isGlobalAdmin)
// Admin: listar usuários com 2FA ativo
router.get('/admin/list', (req, res) => {
  const currentUser = store.findById('users', req.session.userId);
  if (!currentUser || !isGlobalAdmin(currentUser)) {
    return res.status(403).json({ error: 'Apenas administrador da plataforma.' });
  }
  
  const users = store.all('users')
    .filter(u => u.twoFactorEnabled)
    .map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      twoFactorEnabledAt: u.twoFactorEnabledAt,
      backupCodesCount: u.twoFactorBackupCodes ? u.twoFactorBackupCodes.length : 0
    }));
  
  res.json(users);
});

module.exports = router;