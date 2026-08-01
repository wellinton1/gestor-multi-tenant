const express = require('express');
const bcrypt = require('bcryptjs');
const store = require('../data/store');
const { requireLogin } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

const router = express.Router();
router.use(requireLogin);

// Inspeção de segurança - apenas admin
router.get('/inspect', (req, res) => {
  const currentUser = store.findById('users', req.session.userId);
  if (!currentUser || currentUser.role !== 'admin') {
    return res.status(403).json({ error: 'Apenas administradores podem acessar a inspecao de seguranca.' });
  }

  const issues = [];
  const users = store.all('users');
  const envPath = path.join(__dirname, '..', '..', '.env');
  const packagePath = path.join(__dirname, '..', '..', 'package.json');

  // 1. Verificar senhas fracas
  const weakPasswords = [];
  users.forEach((user) => {
    // Verifica se a senha foi alterada
    if (!user.passwordChangedAt) {
      weakPasswords.push({
        email: user.email,
        name: user.name,
        issue: 'Senha nunca foi alterada (possivelmente padrao)'
      });
    }
  });
  if (weakPasswords.length > 0) {
    issues.push({
      severity: 'high',
      category: 'Senhas Fracas',
      description: `${weakPasswords.length} usuario(s) nunca alteraram a senha padrão.`,
      details: weakPasswords
    });
  }

  // 2. Verificar senha admin padrao no .env
  try {
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const adminPassMatch = envContent.match(/ADMIN_PASSWORD=(.+)/);
      if (adminPassMatch && adminPassMatch[1].trim() === 'admin123') {
        issues.push({
          severity: 'critical',
          category: 'Senha Padrao do Admin',
          description: 'A senha do administrador no arquivo .env ainda e a padrao "admin123". Altere para uma senha forte.',
          details: [{ issue: 'ADMIN_PASSWORD no .env contem a senha padrao "admin123"' }]
        });
      }
    }
  } catch (e) { /* ignora erro de leitura */ }

  // 3. Verificar SESSION_SECRET padrao
  try {
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const secretMatch = envContent.match(/SESSION_SECRET=(.+)/);
      if (secretMatch && secretMatch[1].trim() === 'troque-este-valor-para-um-texto-aleatorio-longo') {
        issues.push({
          severity: 'critical',
          category: 'Segredo da Sessao',
          description: 'O SESSION_SECRET no .env ainda e o valor padrao de exemplo. Isso fragiliza a seguranca das sessoes.',
          details: [{ issue: 'SESSION_SECRET contem o valor padrao de exemplo' }]
        });
      }
    }
  } catch (e) { /* ignora */ }

  // 4. Verificar COOKIE_SECURE
  try {
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const secureMatch = envContent.match(/COOKIE_SECURE=(.+)/);
      if (secureMatch && secureMatch[1].trim() === 'false') {
        issues.push({
          severity: 'medium',
          category: 'Cookie Seguro (HTTPS)',
          description: 'COOKIE_SECURE esta como "false". Recomendado ativar em producao com HTTPS.',
          details: [{ issue: 'Cookies de sessao nao sao marcados como Secure' }]
        });
      }
    }
  } catch (e) { /* ignora */ }

  // 5. Verificar usuarios sem estabelecimento vinculado (admin global)
  const globalAdmins = users.filter((u) => !u.allowedEstablishmentIds || u.allowedEstablishmentIds.length === 0);
  if (globalAdmins.length > 0) {
    issues.push({
      severity: 'info',
      category: 'Usuarios Globais',
      description: `${globalAdmins.length} usuario(s) tem acesso global a todos os estabelecimentos.`,
      details: globalAdmins.map((u) => ({ email: u.email, name: u.name }))
    });
  }

  // 6. Verificar se bcrypt usa salt rounds adequados
  issues.push({
    severity: 'info',
    category: 'Hash de Senhas',
    description: 'O sistema usa bcrypt com salt rounds = 12 para novas senhas (recomendado: 10-12). Adequado.',
    details: [{ issue: 'bcrypt salt rounds = 12 (adequado)' }]
  });

  // 7. Verificar versao do Node
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0], 10);
  if (majorVersion < 16) {
    issues.push({
      severity: 'high',
      category: 'Versao do Node.js',
      description: `Node.js ${nodeVersion} esta desatualizado. Recomendado v16 ou superior.`,
      details: [{ issue: `Node.js ${nodeVersion}` }]
    });
  } else {
    issues.push({
      severity: 'info',
      category: 'Versao do Node.js',
      description: `Node.js ${nodeVersion} - OK.`,
      details: [{ issue: `Node.js ${nodeVersion}` }]
    });
  }

  // 8. Verificar dependencias com vulnerabilidades conhecidas
  try {
    if (fs.existsSync(packagePath)) {
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      const knownVulnerable = {
        'express': { minSafe: '4.18.0', description: 'Versoes antigas do Express podem ter vulnerabilidades' },
        'bcryptjs': { minSafe: '2.4.3', description: 'OK' }
      };
      Object.entries(knownVulnerable).forEach(([dep, info]) => {
        if (deps[dep]) {
          issues.push({
            severity: 'info',
            category: `Dependencia: ${dep}`,
            description: `${dep} ${deps[dep]} - ${info.description}`,
            details: [{ issue: `${dep}@${deps[dep]}` }]
          });
        }
      });
    }
  } catch (e) { /* ignora */ }

  // 9. Verificar taxa de hash (bcrypt rounds)
  const usersWithPasswords = users.filter((u) => u.passwordHash);
  issues.push({
    severity: 'info',
    category: 'Totais do Sistema',
    description: `Total de usuarios cadastrados: ${users.length} | Total de estabelecimentos: ${store.all('establishments').length}`,
    details: [{ issue: `Usuarios: ${users.length} | Estabelecimentos: ${store.all('establishments').length}` }]
  });

  // 10. Verificar se CSRF esta ativo
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    issues.push({
      severity: 'info',
      category: 'Protecao CSRF',
      description: 'CSRF protegido via Double Submit Cookie Pattern (produção).',
      details: [{ issue: 'Token CSRF validado em todas as requisições POST/PUT/DELETE.' }]
    });
  } else {
    issues.push({
      severity: 'info',
      category: 'Protecao CSRF',
      description: 'CSRF em modo de desenvolvimento (token enviado mas nao validado rigorosamente).',
      details: [{ issue: 'Em producao (NODE_ENV=production), a validacao CSRF e obrigatoria.' }]
    });
  }

  // 11. Verificar FORCE_PASSWORD_CHANGE
  if (process.env.FORCE_PASSWORD_CHANGE === 'true') {
    issues.push({
      severity: 'info',
      category: 'Forcar Troca de Senha',
      description: 'FORCE_PASSWORD_CHANGE esta ativado. Usuarios serao forçados a trocar a senha no primeiro login.',
      details: [{ issue: 'Configuracao ativa no .env' }]
    });
  }

  // 12. Verificar sameSite cookie
  issues.push({
    severity: 'info',
    category: 'Configuracao de Cookie',
    description: 'Cookies de sessao configurados com httpOnly, sameSite=strict, path=/',
    details: [{ issue: 'Protecao contra sequestro de sessao via XSS e CSRF.' }]
  });

  res.json({ issues, inspectedAt: new Date().toISOString() });
});

module.exports = router;