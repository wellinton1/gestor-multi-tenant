const express = require('express');
const { v4: uuid } = require('uuid');
const store = require('../data/store');
const { requireLogin } = require('../middleware/auth');
const { resolveAllowedIds, isGlobalAdmin, hasAccessToEstablishment } = require('../utils/access');

const router = express.Router();

// Map niche -> theme slug (mantido em sincronia com portal.js e migrate-themes.js)
// Temas existentes em /public/themes/: eletronicos, generico, moda, tokens-base
const NICHE_TO_THEME = {
  Barbearia: 'moda',
  Pizzaria: 'generico',
  'Lava Jato': 'eletronicos',
  'Salao de Beleza': 'moda',
  'Doces e Salgados': 'generico',
  Oficina: 'eletronicos',
  Petshop: 'moda',
  Outro: 'generico'
};
function resolveTheme(niche) { return NICHE_TO_THEME[niche] || 'generico'; }

// Paletas validas por tema (anti-customizacao que quebra contraste).
// O dono escolhe de uma destas, nunca cor livre.
// Cada nome mapeia para uma cor hex (para preview no front).
const PALETTE_COLORS = {
  // Moda — tons editorialmente quentes
  champagne: '#c9a961',
  burgundy:  '#7d2025',
  forest:   '#2d4a3e',
  ink:       '#1a1814',
  blush:     '#d4a5a5',
  // Eletronicos — destaques techs
  green:  '#10b981',
  cyan:   '#06b6d4',
  lime:   '#84cc16',
  amber:  '#f59e0b',
  // Alimentacao — tons quentes
  terracotta: '#c2410c',
  mustard:    '#d4a017',
  olive:      '#6b6232',
  wine:       '#9f1239',
  charcoal:   '#2a2622',
  // Servicos
  slate: '#475569',
  ocean: '#0e7490',
  // Generico
  teal:  '#0d9488',
  navy:  '#1e3a8a'
};

const PALETTE_BY_THEME = {
  moda: ['champagne', 'burgundy', 'forest', 'ink', 'blush'],
  eletronicos: ['green', 'cyan', 'lime', 'amber', 'ink'],
  alimentacao: ['terracotta', 'mustard', 'olive', 'wine', 'charcoal'],
  servicos: ['slate', 'ocean', 'forest', 'wine', 'ink'],
  generico: ['teal', 'navy', 'forest', 'wine', 'ink']
};
// Cor livre permitida: hex #RRGGBB. Fora isso, aceita apenas nomes da paleta do tema.
const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;
// Temas de site disponiveis (CSS em /public/themes/). tokens-base.css é sempre base.
const AVAILABLE_THEMES = ['moda', 'generico', 'eletronicos'];
function isValidTheme(theme) {
  return AVAILABLE_THEMES.includes(theme);
}
function isValidAccentOverride(theme, accentName) {
  if (!accentName) return true;
  if (HEX_COLOR_REGEX.test(accentName)) return true;
  return PALETTE_BY_THEME[theme] && PALETTE_BY_THEME[theme].includes(accentName);
}
// Normaliza o valor salvo em accentOverride: cor livre fica como hex; nome de paleta fica como nome.
function normalizeAccentOverride(value) {
  const v = String(value || '').trim();
  if (!v) return null;
  return HEX_COLOR_REGEX.test(v) ? v.toLowerCase() : v;
}

function normalizeLogoDataUrl(value) {
  const url = String(value || '').trim();
  if (!url) return '';
  if (/^data:image\/(png|jpeg|jpg|gif|webp);base64,[A-Za-z0-9+/=]+$/.test(url)) return url;
  if (/^https?:\/\/[^"]+$/.test(url)) return url;
  return '';
}

// Public listing of tenants for login selection.
router.get('/', (req, res) => {
  const serialize = (row) => ({
    id: row.id, name: row.name, niche: row.niche,
    theme: row.theme || resolveTheme(row.niche),
    accentOverride: row.accentOverride || null,
    plan: row.plan || 'free',
    paused: row.paused === true,
    pausedAt: row.pausedAt || null,
    phone: row.phone, address: row.address,
    description: row.description, logoDataUrl: row.logoDataUrl,
    createdAt: row.createdAt
  });
  if (!req.session || !req.session.userId) {
    const list = store.all('establishments')
      .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
      .map(serialize);
    return res.json(list);
  }

  const user = store.findById('users', req.session.userId);
  const allowedIds = resolveAllowedIds(user);
  const list = store.all('establishments')
    .filter((row) => allowedIds === null || allowedIds.includes(row.id))
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
    .map(serialize);
  res.json(list);
});

router.use(requireLogin);

router.post('/', (req, res, next) => {
  try {
    const user = store.findById('users', req.session.userId);
    if (!user) return res.status(401).json({ error: 'Nao autenticado.' });
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Apenas administradores podem criar estabelecimentos.' });
    }
    const allowedIds = resolveAllowedIds(user);
    if (allowedIds !== null) {
      return res.status(403).json({ error: 'Acesso ao estabelecimento nao autorizado.' });
    }

    const { name, niche, phone, address, description, logoDataUrl, expirationPeriod } = req.body || {};
    const nameValue = String(name || '').trim();
    const nicheValue = String(niche || '').trim();
    if (!nameValue || !nicheValue) {
      return res.status(400).json({ error: 'Nome e nicho sao obrigatorios.' });
    }
    const themeSlug = resolveTheme(nicheValue);
    const row = store.insert('establishments', {
      id: uuid(),
      name: nameValue,
      niche: nicheValue,
      theme: themeSlug,           // tema premium derivado do nicho
      accentOverride: null,        // dono escolhe depois (validado contra paleta)
      plan: 'free',                // comecam no plano gratuito
      paused: false,               // lojas novas comecam ativas
      pausedAt: null,
      phone: String(phone || '').trim(),
      address: String(address || '').trim(),
      description: String(description || '').trim(),
      logoDataUrl: normalizeLogoDataUrl(logoDataUrl),
      expirationPeriod: String(expirationPeriod || 'Sem expiracao').trim(),
      createdAt: new Date().toISOString()
    });
    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', (req, res, next) => {
  try {
    const est = store.findById('establishments', req.params.id);
    if (!est) return res.status(404).json({ error: 'Estabelecimento nao encontrado.' });
    const user = store.findById('users', req.session.userId);
    if (!user) return res.status(401).json({ error: 'Nao autenticado.' });
    // Qualquer usuário com acesso a este estabelecimento pode atualizar dados e aparência.
    // (admin global tem acesso a qualquer loja; operador somente as atribuidas.)
    if (!hasAccessToEstablishment(user, est.id)) {
      return res.status(403).json({ error: 'Acesso ao estabelecimento nao autorizado.' });
    }
    const { name, phone, address, description, logoDataUrl, businessHours, accentOverride, theme, plan } = req.body || {};

    // Customizacao de cor — aceita nome da paleta do tema OU cor livre hex (#RRGGBB).
    const currentTheme = est.theme || resolveTheme(est.niche);
    if (accentOverride !== undefined && accentOverride !== null && accentOverride !== '') {
      if (!isValidAccentOverride(currentTheme, accentOverride)) {
        return res.status(400).json({
          error: 'Cor de destaque invalida. Use uma cor hexadecimal (#RRGGBB) ou uma das opcoes da paleta.',
          palette: PALETTE_BY_THEME[currentTheme]
        });
      }
    }

    // Plano — so admin da plataforma (global) pode mudar
    const isGlobalAdminUser = isGlobalAdmin(user);
    const newPlan = (isGlobalAdminUser && plan && ['free', 'pro'].includes(plan)) ? plan : (est.plan || 'free');

    const updated = store.update('establishments', req.params.id, {
      name: name !== undefined ? String(name).trim() : est.name,
      phone: phone !== undefined ? String(phone).trim() : est.phone,
      address: address !== undefined ? String(address).trim() : est.address,
      description: description !== undefined ? String(description).trim() : est.description,
      logoDataUrl: logoDataUrl !== undefined ? normalizeLogoDataUrl(logoDataUrl) : est.logoDataUrl,
      businessHours: businessHours !== undefined ? businessHours : est.businessHours,
      accentOverride: accentOverride !== undefined ? normalizeAccentOverride(accentOverride) : est.accentOverride,
      plan: newPlan
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', (req, res, next) => {
  try {
    const est = store.findById('establishments', req.params.id);
    if (!est) return res.status(404).json({ error: 'Estabelecimento nao encontrado.' });
    const user = store.findById('users', req.session.userId);
    if (!user) return res.status(401).json({ error: 'Nao autenticado.' });
    // Remover loja e plataforma: apaga loja + todos os dados vinculados.
    // So o admin da plataforma (global) pode fazer isso.
    if (!isGlobalAdmin(user)) {
      return res.status(403).json({ error: 'Apenas o administrador da plataforma pode remover estabelecimentos.' });
    }
    if (!hasAccessToEstablishment(user, est.id)) {
      return res.status(403).json({ error: 'Acesso ao estabelecimento nao autorizado.' });
    }

    const ok = store.remove('establishments', req.params.id);
    if (!ok) return res.status(404).json({ error: 'Estabelecimento nao encontrado.' });
    ['employees', 'clients', 'services', 'appointments'].forEach((coll) => {
      store.query(coll, (row) => row.establishmentId === req.params.id).forEach((row) => {
        store.remove(coll, row.id);
      });
    });
    if (req.session.establishmentId === req.params.id) {
      req.session.establishmentId = null;
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Select which establishment the session is currently managing.
router.post('/:id/select', (req, res) => {
  const est = store.findById('establishments', req.params.id);
  if (!est) return res.status(404).json({ error: 'Estabelecimento nao encontrado.' });
  const user = store.findById('users', req.session.userId);
  if (!user) return res.status(401).json({ error: 'Nao autenticado.' });
  if (!hasAccessToEstablishment(user, est.id)) {
    return res.status(403).json({ error: 'Acesso ao estabelecimento nao autorizado.' });
  }
  req.session.establishmentId = est.id;
  res.json(est);
});

router.post('/clear-selection', (req, res) => {
  req.session.establishmentId = null;
  res.json({ ok: true });
});

router.get('/current', (req, res) => {
  if (!req.session.establishmentId) return res.json(null);
  const est = store.findById('establishments', req.session.establishmentId);
  if (!est) return res.json(null);
  const user = store.findById('users', req.session.userId);
  if (user && !hasAccessToEstablishment(user, est.id)) {
    // Sessao apontando para loja sem acesso (acesso revogado): limpa selecao.
    req.session.establishmentId = null;
    return res.json(null);
  }
  const theme = est.theme || resolveTheme(est.niche);
  // Anexa paleta permitida (com cores) para customizacao no front
  const paletteNames = PALETTE_BY_THEME[theme] || [];
  est.themePalette = paletteNames.map((name) => ({ name, color: PALETTE_COLORS[name] || '#999' }));
  res.json(est);
});

// Public endpoint: lista paletas disponiveis para um tema.
// Front usa isto para o seletor de cor de destaque.
router.get('/themes/:slug/palette', (req, res) => {
  const slug = req.params.slug;
  if (!PALETTE_BY_THEME[slug]) {
    return res.status(404).json({ error: 'Tema nao encontrado.' });
  }
  const palette = PALETTE_BY_THEME[slug].map((name) => ({ name, color: PALETTE_COLORS[name] || '#999' }));
  res.json({ theme: slug, palette });
});

// Admin global (plataforma) pode mudar plano da loja: free <-> pro.
// So admin da plataforma (allowedEstablishmentIds null) - donos de loja nao.
router.put('/:id/plan', (req, res) => {
  try {
    const user = store.findById('users', req.session.userId);
    if (!user) return res.status(401).json({ error: 'Nao autenticado.' });
    if (!isGlobalAdmin(user)) {
      return res.status(403).json({ error: 'Apenas o administrador da plataforma pode mudar o plano.' });
    }
    const est = store.findById('establishments', req.params.id);
    if (!est) return res.status(404).json({ error: 'Estabelecimento nao encontrado.' });
    const { plan } = req.body || {};
    if (!['free', 'pro'].includes(plan)) {
      return res.status(400).json({ error: 'Plano invalido. Use "free" ou "pro".' });
    }
    const updated = store.update('establishments', est.id, { plan });
    res.json({ ok: true, plan: updated.plan });
  } catch (err) {
    next(err);
  }
});

// Pausar loja — admin da plataforma (accesso global) apenas.
// Loja pausada: portal publico retorna 423 Locked (clientes nao podem agendar),
// dados NAO sao tocados (nao exclui nada). Eh reversivel via /resume.
router.put('/:id/pause', (req, res) => {
  try {
    const user = store.findById('users', req.session.userId);
    if (!user) return res.status(401).json({ error: 'Nao autenticado.' });
    if (!isGlobalAdmin(user)) {
      return res.status(403).json({ error: 'Apenas o administrador da plataforma pode pausar uma loja.' });
    }
    const est = store.findById('establishments', req.params.id);
    if (!est) return res.status(404).json({ error: 'Estabelecimento nao encontrado.' });
    if (est.paused) return res.status(409).json({ error: 'Loja ja esta pausada.' });
    const updated = store.update('establishments', est.id, {
      paused: true,
      pausedAt: new Date().toISOString()
    });
    res.json({ ok: true, paused: updated.paused, pausedAt: updated.pausedAt });
  } catch (err) {
    next(err);
  }
});

// Reativar loja pausada — reversivel, nao perde dados.
router.put('/:id/resume', (req, res) => {
  try {
    const user = store.findById('users', req.session.userId);
    if (!user) return res.status(401).json({ error: 'Nao autenticado.' });
    if (!isGlobalAdmin(user)) {
      return res.status(403).json({ error: 'Apenas o administrador da plataforma pode reativar uma loja.' });
    }
    const est = store.findById('establishments', req.params.id);
    if (!est) return res.status(404).json({ error: 'Estabelecimento nao encontrado.' });
    if (!est.paused) return res.status(409).json({ error: 'Loja nao esta pausada.' });
    const updated = store.update('establishments', est.id, {
      paused: false,
      pausedAt: null
    });
    res.json({ ok: true, paused: updated.paused });
  } catch (err) {
    next(err);
  }
});

// ATENCAO: este GET /:id fica propositalmente no FIM do arquivo.
// Rotas nomeadas (/current, /clear-selection, /themes/:slug/palette) devem
// ser registradas ANTES — senao Express faz match em /:id primeiro e
// trata "current" como um UUID, retornando 404.
router.get('/:id', (req, res) => {
  const est = store.findById('establishments', req.params.id);
  if (!est) return res.status(404).json({ error: 'Estabelecimento nao encontrado.' });
  const user = store.findById('users', req.session.userId);
  if (!user) return res.status(401).json({ error: 'Nao autenticado.' });
  if (!hasAccessToEstablishment(user, est.id)) {
    return res.status(403).json({ error: 'Acesso ao estabelecimento nao autorizado.' });
  }
  res.json(est);
});

module.exports = router;
