/* Painel de Gestao - Admin SPA (vanilla JS, sem dependencias de build) */

const root = document.getElementById('root');

const ICONS = {
  dashboard: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>',
  clipboard: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3a1 1 0 011-1h4a1 1 0 011 1v1"/><path d="M9 11h6M9 15h6"/></svg>',
  users: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="8" r="3.2"/><path d="M2.5 20a6.5 6.5 0 0113 0"/><path d="M16 8.2a3 3 0 010 5.9M20.5 20a6 6 0 00-4.7-6.3"/></svg>',
  userCog: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="8" r="3.2"/><path d="M2.5 20a6.5 6.5 0 0113 0"/><circle cx="18.5" cy="15.5" r="2.3"/><path d="M18.5 12v.8M18.5 17.5v.8M21 15.5h-.8M16.8 15.5H16M20 13.2l-.6.5M17.6 17.3l-.6.5M20 17.8l-.6-.5M17.6 13.7l-.6-.5"/></svg>',
  wrench: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a4 4 0 00-5.4 5l-6 6 2.4 2.4 6-6a4 4 0 005-5.4l-2.6 2.6-2-2z"/></svg>',
  gear: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 13a7.4 7.4 0 000-2l2-1.5-2-3.4-2.3.9a7.5 7.5 0 00-1.7-1L15 3h-4l-.4 2.4a7.5 7.5 0 00-1.7 1l-2.3-.9-2 3.4L6.6 11a7.4 7.4 0 000 2l-2 1.5 2 3.4 2.3-.9a7.5 7.5 0 001.7 1L11 21h4l.4-2.6a7.5 7.5 0 001.7-1l2.3.9 2-3.4z"/></svg>',
  plus: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 5v14M5 12h14"/></svg>',
  pencil: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg>',
  trash: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4h8v2M6 6l1 15h10l1-15"/></svg>',
  clock: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
  dollar: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 6.5C16 5 14.2 4.3 12 4.3c-2.8 0-5 1.4-5 3.5s2.2 3.2 5 3.5c2.8.3 5 1.4 5 3.5s-2.2 3.5-5 3.5c-2.2 0-4-.7-5-2.2"/></svg>',
  globe: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 010 18M12 3a15 15 0 000 18"/></svg>',
  arrowLeft: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
  arrowRight: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  close: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 6L6 18M6 6l12 12"/></svg>',
  mail: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
  phone: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h4l2 5-2.5 1.5a11 11 0 005 5L14 13l5 2v4a2 2 0 01-2 2A16 16 0 014 6a2 2 0 012-2z"/></svg>',
  scissors: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><path d="M8.5 8l11 8M8.5 16l11-8"/></svg>',
  pizza: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 5l9-3 9 3-9 16z"/><circle cx="12" cy="9" r="1" fill="currentColor"/><circle cx="9" cy="13" r="1" fill="currentColor"/><circle cx="15" cy="13" r="1" fill="currentColor"/></svg>',
  car: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 13l1.5-5A2 2 0 016.4 6.5h11.2A2 2 0 0119.5 8L21 13v5a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1H6v1a1 1 0 01-1 1H4a1 1 0 01-1-1z"/><circle cx="7" cy="16.5" r="1.4"/><circle cx="17" cy="16.5" r="1.4"/></svg>',
  store: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l1-5h16l1 5"/><path d="M4 9h16v10H4z"/><path d="M9 19v-5h6v5"/></svg>',
  sparkles: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/><path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8z"/><path d="M5 14l.6 1.8L7.5 16.5l-1.9.7L5 19l-.6-1.8L2.5 16.5l1.9-.7z"/></svg>',
  cake: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 21h16v-7H4z"/><path d="M4 14c0-3 2-5 8-5s8 2 8 5"/><path d="M4 14l16 0"/><path d="M9 5c0-1 1-2 3-2s3 1 3 2"/><path d="M12 5v3"/><circle cx="12" cy="3" r="0.5" fill="currentColor"/></svg>',
  wrench2: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a4 4 0 00-5.4 5l-6 6 2.4 2.4 6-6a4 4 0 005-5.4l-2.6 2.6-2-2z"/></svg>',
  paw: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="5.5" cy="11" r="2"/><circle cx="9" cy="7" r="2"/><circle cx="15" cy="7" r="2"/><circle cx="18.5" cy="11" r="2"/><path d="M8 16c0-2 1.8-3.5 4-3.5s4 1.5 4 3.5-1.8 4-4 4-4-2-4-4z"/></svg>',
  upload: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3"/></svg>',
  sun: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4.5"/><path d="M12 1.5v3M12 19.5v3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M1.5 12h3M19.5 12h3M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1"/></svg>',
  moon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A9 9 0 1111.2 3a7 7 0 109.8 9.8z"/></svg>',
  shield: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l9 4v6c0 5.5-4 10.6-9 12-5-1.4-9-6.5-9-12V6z"/><path d="M9 12l2 2 4-4"/></svg>',
  lock: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 118 0v4"/></svg>',
  pause: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
  play: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M6 4l14 8-14 8z"/></svg>',
  creditCard: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M6 15h4"/></svg>',
  rotateCw: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-3-6.7"/><path d="M21 3v6h-6"/></svg>',
  info: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>',
  archive: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v10a1 1 0 001 1h12a1 1 0 001-1V9"/><path d="M10 13h4"/></svg>',
  download: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v12M7 11l5 5 5-5"/><path d="M4 20h16"/></svg>',
  database: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/></svg>'
};

const NICHE_ICON = {
  'Barbearia': ICONS.scissors,
  'Pizzaria': ICONS.pizza,
  'Lava Jato': ICONS.car,
  'Salao de Beleza': ICONS.sparkles,
  'Doces e Salgados': ICONS.cake,
  'Oficina': ICONS.wrench2,
  'Petshop': ICONS.paw,
  'Outro': ICONS.store
};
function nicheIcon(niche) { return NICHE_ICON[niche] || ICONS.store; }

// Administrador do sistema (plataforma): role admin E sem restricao de lojas.
// Usuarios da loja (operadores ou admins vinculados a lojas) NAO sao globais.
function isGlobalAdmin(user) {
  return !!user && user.role === 'admin' &&
    (user.allowedEstablishmentIds === null || user.allowedEstablishmentIds === undefined);
}

const NICHE_OPTIONS = [
  { value: 'Barbearia', icon: ICONS.scissors, desc: 'Cortes, barba e grooming' },
  { value: 'Salao de Beleza', icon: ICONS.sparkles, desc: 'Cabelo, unhas, estetica' },
  { value: 'Lava Jato', icon: ICONS.car, desc: 'Lavagem e detalhamento' },
  { value: 'Pizzaria', icon: ICONS.pizza, desc: 'Pizzas e delivery' },
  { value: 'Doces e Salgados', icon: ICONS.cake, desc: 'Confeitaria esalgados' },
  { value: 'Oficina', icon: ICONS.wrench2, desc: 'Mecanica e manutencao' },
  { value: 'Petshop', icon: ICONS.paw, desc: 'Banho, tosa e pets' },
  { value: 'Outro', icon: ICONS.store, desc: 'Outro tipo de negocio' }
];

// Map nicho -> theme slug (mesma logica do backend e migrate-themes.js).
// Usado em Configuracoes p/ mostrar o tema atual da loja.
// Temas existentes em /public/themes/: eletronicos, generico, moda, tokens-base
const NICHE_TO_THEME_LEGACY = {
  Barbearia: 'moda',
  Pizzaria: 'generico',
  'Lava Jato': 'eletronicos',
  'Salao de Beleza': 'moda',
  'Doces e Salgados': 'generico',
  Oficina: 'eletronicos',
  Petshop: 'moda',
  Outro: 'generico'
};

// Temas de site disponiveis p/ o seletor (livre para todos).
const THEME_OPTIONS = [
  { slug: 'moda', label: 'Moda' },
  { slug: 'eletronicos', label: 'Eletrônicos' },
  { slug: 'generico', label: 'Genérico' }
];

// ---------- state ----------
let currentUser = null;
let currentEstablishment = null;
let establishments = [];
let setupNeeded = false;

// ---------- CSRF token helper ----------
function getCsrfToken() {
  const match = document.cookie.match(/(?:^|;\s*)gestor\.csrf=([^;]*)/);
  return match ? match[1] : null;
}

// ---------- api helper ----------
async function api(method, path, body) {
  const opts = { method, headers: {}, credentials: 'same-origin' };
  
  // Adiciona token CSRF para metodos que modificam dados
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      opts.headers['X-CSRF-Token'] = csrfToken;
    }
  }
  
  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(path, opts);
  let data = null;
  try { data = await res.json(); } catch (e) { /* no body */ }
  if (!res.ok) {
    const err = new Error((data && data.error) || 'Erro na requisicao.');
    err.status = res.status;
    throw err;
  }
  return data;
}

// ---------- formatting ----------
function formatMoney(v) {
  const n = Number(v) || 0;
  return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function toMapsLink(address) {
  if (!address) return '';
  const q = encodeURIComponent(String(address).trim());
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}
function clientAddressParts(c) {
  if (!c) return [];
  const parts = [];
  const street = [c.addressStreet, c.addressNumber].filter(Boolean).join(', ');
  if (street) parts.push(street);
  if (c.addressComplement) parts.push(c.addressComplement);
  if (c.addressDistrict) parts.push(c.addressDistrict);
  const cityState = [c.addressCity, c.addressState].filter(Boolean).join(' - ');
  if (cityState) parts.push(cityState);
  return parts;
}
function clientAddressLine(c) {
  return clientAddressParts(c).join(' - ');
}
function clientAddressMapsLink(c) {
  const parts = clientAddressParts(c);
  if (parts.length === 0) return '';
  return toMapsLink(parts.join(', '));
}
function slugifyStoreName(name) {
  const slug = String(name || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'loja';
}
function formatDateTime(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy}, ${hh}:${min}`;
}
function toWhatsappLink(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (!digits) return '';
  const normalized = digits.startsWith('55') ? digits : `55${digits}`;
  return `https://web.whatsapp.com/send?phone=${normalized}`;
}
function toDateTimeLocalValue(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function escapeHtml(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}

// Comprime uma imagem (data URL) via canvas para caber nos limites de upload
// (MAX_BASE64_SIZE = 5MB). Redimensiona para no maximo 800px e converte p/ WebP
// (quando suportado) ou JPEG como fallback.
function compressImage(dataUrl, cb) {
  try {
    const isWebp = /^data:image\/webp/i.test(dataUrl);
    const img = new Image();
    img.onload = () => {
      const MAX_DIM = 800;
      let { width, height } = img;
      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) { height = Math.round((height * MAX_DIM) / width); width = MAX_DIM; }
        else { width = Math.round((width * MAX_DIM) / height); height = MAX_DIM; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Prefere WebP (arquivo menor). Fallback p/ JPEG se o navegador nao suportar.
      const supportsWebp = typeof document.createElement('canvas').toDataURL === 'function'
        && canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      const outType = (isWebp || supportsWebp) ? 'image/webp' : 'image/jpeg';

      let out = canvas.toDataURL(outType, 0.82);
      // Se ainda ficou grande, reduz a qualidade progressivamente
      let quality = 0.82;
      while (out.length * 0.75 > 5242880 && quality > 0.3) {
        quality -= 0.15;
        out = canvas.toDataURL(outType, quality);
      }
      cb(out);
    };
    img.onerror = () => cb(dataUrl);
    img.src = dataUrl;
  } catch (e) {
    cb(dataUrl);
  }
}
function statusPillClass(status) {
  return {
    'Concluido': 'pill-concluido',
    'Em Andamento': 'pill-andamento',
    'Pendente': 'pill-pendente',
    'Cancelado': 'pill-cancelado'
  }[status] || 'pill-pendente';
}

// ---------- toast ----------
function toast(msg, isError) {
  const el = document.createElement('div');
  el.className = 'toast' + (isError ? ' error' : '');
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

// ---------- modal ----------
function showModal(titleText, bodyHtml, onMount) {
  closeModal();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2>${escapeHtml(titleText)}</h2>
        <button class="modal-close" id="modal-close-btn">${ICONS.close}</button>
      </div>
      ${bodyHtml}
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  document.getElementById('modal-close-btn').addEventListener('click', closeModal);
  if (onMount) onMount(overlay);
}
function closeModal() {
  const el = document.getElementById('modal-overlay');
  if (el) el.remove();
}

// ---------- Theme ----------
function getTheme() {
  // Use server-side theme for logged-in users, fallback to localStorage for login screen
  if (currentUser && currentUser.theme) return currentUser.theme;
  return localStorage.getItem('theme') || 'light';
}
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}
async function toggleTheme() {
  const current = getTheme();
  const newTheme = current === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
  // Save to server for logged-in users
  if (currentUser) {
    try {
      await api('PUT', '/api/auth/theme', { theme: newTheme });
      currentUser.theme = newTheme;
    } catch (e) { /* ignore */ }
  } else {
    localStorage.setItem('theme', newTheme);
  }
  // Re-render current view to update theme-dependent elements
  if (currentUser && currentEstablishment) renderAppShell();
  else if (currentUser) renderSelector();
  else renderLogin();
}
function applyTheme() {
  const theme = getTheme();
  document.documentElement.setAttribute('data-theme', theme);
}

// ---------- boot / routing ----------
async function boot() {
  applyTheme();
  try {
    currentUser = await api('GET', '/api/auth/me');
    if (currentUser.establishmentId) {
      currentEstablishment = await api('GET', '/api/establishments/current');
    }
  } catch (e) {
    currentUser = null;
  }
  // Se nao ha usuario logado, checa se o setup inicial e necessario.
  if (!currentUser) {
    try {
      const status = await api('GET', '/api/setup/status');
      setupNeeded = !!(status && status.setupNeeded);
    } catch (e) {
      setupNeeded = false;
    }
  } else {
    setupNeeded = false;
  }
  render();
}

window.addEventListener('hashchange', () => {
  if (!currentUser) return;
  if (currentEstablishment) return renderAppShell();
  renderRouteWithoutEstablishment();
});

function render() {
  if (!currentUser) {
    if (setupNeeded) return renderSetup();
    // Link do email de recuperacao: /reset-password?token=... ou ?token=...
    // (o servidor serve a SPA nessa rota; cai aqui pois nao ha login).
    try {
      const _path = window.location.pathname || '';
      const _p = new URLSearchParams(window.location.search);
      const _resetToken = _p.get('token');
      if (_path === '/reset-password' || (_resetToken && _path === '/')) {
        if (_resetToken) return renderResetPassword(_resetToken);
      }
    } catch (e) { /* ignore */ }
    // Erros vindos do callback Google OAuth (?google_error=1, ?google_2fa=1, ?google_error=not_configured)
    try {
      const params = new URLSearchParams(window.location.search);
      const gErr = params.get('google_error');
      const g2fa = params.get('google_2fa');
      if (gErr || g2fa) {
        // Limpa a querystring para nao reexibir o erro no refresh
        window.history.replaceState({}, document.title, window.location.pathname);
        if (g2fa) {
          // Conta Google com 2FA: abre direto o modal de codigo (sem senha).
          renderLogin();
          // setTimeout: garante que o DOM do login montou antes do modal.
          setTimeout(showGoogle2faModal, 50);
          return;
        }
        if (gErr === 'not_configured') return renderLogin('Login com Google nao configurado no servidor (GOOGLE_* no .env).');
        return renderLogin('Falha no login com Google. Tente novamente.');
      }
    } catch (e) { /* ignore */ }
    return renderLogin();
  }

  // Cadastro pendente (login Google sem loja associada): mostra tela de
  // aguardando aprovacao. O admin associa a uma loja na pagina de Senhas.
  if (currentUser.pendingApproval) {
    return renderPendingApproval();
  }

  if (!currentEstablishment) {
    return renderRouteWithoutEstablishment();
  }

  return renderAppShell();
}

// Tela para usuarios que se cadastraram (ex: via Google) mas ainda nao
// foram associados a nenhum estabelecimento pelo administrador.
function renderPendingApproval() {
  const currentTheme = getTheme();
  root.innerHTML = `
    <div class="centered-screen">
      <button class="top-theme-toggle" id="pending-theme-toggle" title="${currentTheme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}">${currentTheme === 'dark' ? ICONS.sun : ICONS.moon}</button>
      <div class="login-card" style="text-align:center;">
        <div class="brand-icon">${ICONS.clock}</div>
        <h1>Cadastro recebido!</h1>
        <p class="subtitle">Crie seu estabelecimento ou aguarde aprovacao</p>
        <div class="hint-box" style="text-align:left;">
          Sua conta (<strong>${escapeHtml(currentUser.email)}</strong>) foi criada com sucesso.
          Crie o seu proprio estabelecimento para comecar agora, ou aguarde o administrador
          associar seu usuario a uma loja existente.
          <br><br>
          Assim que estiver tudo pronto, entre novamente para acessar o painel.
        </div>
        <button class="btn btn-primary" id="pending-create-store-btn" style="margin-top:16px;">${ICONS.plus} Novo Estabelecimento</button>
        <button class="btn btn-secondary" id="pending-refresh-btn" style="margin-top:12px;">Ja fui aprovado, entrar</button>
        <button class="btn btn-secondary" id="pending-logout-btn" style="margin-top:12px;">Sair</button>
      </div>
    </div>
  `;
  document.getElementById('pending-theme-toggle').addEventListener('click', toggleTheme);
  document.getElementById('pending-logout-btn').addEventListener('click', logout);
  document.getElementById('pending-create-store-btn').addEventListener('click', () => {
    openNewEstablishmentModal(async () => {
      try {
        currentUser = await api('GET', '/api/auth/me');
        currentEstablishment = await api('GET', '/api/establishments/current');
        location.hash = '#/dashboard';
        render();
      } catch (e) {
        toast(e.message, true);
        render();
      }
    });
  });
  document.getElementById('pending-refresh-btn').addEventListener('click', async () => {
    try {
      currentUser = await api('GET', '/api/auth/me');
      if (currentUser.pendingApproval) {
        toast('Seu cadastro ainda esta aguardando aprovacao.', true);
      }
      render();
    } catch (e) {
      currentUser = null;
      render();
    }
  });
}

// Paginas globais acessiveis sem estabelecimento selecionado (so admin da plataforma).
function renderRouteWithoutEstablishment() {
  const globalPages = {
    '#/backups': renderBackupsPage,
    '#/senhas': renderSenhasPage,
    '#/seguranca': renderSegurancaPage,
    '#/manutencao': renderManutencaoPage
  };
  (globalPages[currentRoute()] || renderSelector)();
}

// ================= SETUP INICIAL (primeira abertura da URL) =================
function renderSetup(errorMsg) {
  const currentTheme = getTheme();
  root.innerHTML = `
    <div class="centered-screen">
      <button class="top-theme-toggle" id="setup-theme-toggle" title="${currentTheme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}">${currentTheme === 'dark' ? ICONS.sun : ICONS.moon}</button>
      <div class="login-card">
        <div class="brand-icon">${ICONS.shield}</div>
        <h1>Primeira configuracao</h1>
        <p class="subtitle">Crie a conta de administrador do sistema</p>
        ${errorMsg ? `<div class="error-msg">${escapeHtml(errorMsg)}</div>` : ''}
        <form id="setup-form">
          <div class="form-field">
            <label>Nome *</label>
            <input type="text" name="name" required autofocus autocomplete="name" />
          </div>
          <div class="form-field">
            <label>Email *</label>
            <input type="email" name="email" required autocomplete="email" />
          </div>
          <div class="form-field">
            <label>Senha *</label>
            <input type="password" name="password" required minlength="8" autocomplete="new-password" />
            <div class="password-requirements">
              <small>Minimo 8 caracteres, 1 maiuscula, 1 minuscula, 1 numero e 1 caractere especial.</small>
            </div>
          </div>
          <div class="form-field">
            <label>Confirmar Senha *</label>
            <input type="password" name="confirmPassword" required minlength="8" autocomplete="new-password" />
          </div>
          <button type="submit" class="btn btn-primary">Criar Administrador</button>
        </form>
        <div class="hint-box">Esta tela aparece apenas na primeira vez que o sistema e aberto. Apos criar o administrador, voce podera fazer login e configurar seus estabelecimentos.</div>
      </div>
    </div>
  `;
  document.getElementById('setup-theme-toggle').addEventListener('click', toggleTheme);
  document.getElementById('setup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const password = fd.get('password');
    const confirmPassword = fd.get('confirmPassword');
    if (password !== confirmPassword) {
      return toast('As senhas nao conferem.', true);
    }
    try {
      const result = await api('POST', '/api/setup', {
        name: fd.get('name'),
        email: fd.get('email'),
        password: password
      });
      toast('Administrador criado com sucesso!');
      setupNeeded = false;
      currentUser = result.user || await api('GET', '/api/auth/me');
      render();
    } catch (err) {
      renderSetup(err.message);
    }
  });
}

// ================= LOGIN =================
function renderLogin(errorMsg) {
  const currentTheme = getTheme();
  const googleIcon = '<svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>';
  
  root.innerHTML = `
    <div class="centered-screen">
      <button class="top-theme-toggle" id="login-theme-toggle" title="${currentTheme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}">${currentTheme === 'dark' ? ICONS.sun : ICONS.moon}</button>
      <div class="login-card">
        <div class="brand-icon">${ICONS.store}</div>
        <h1>Painel de Gestao</h1>
        <p class="subtitle">Entre para gerenciar seus estabelecimentos</p>
        ${errorMsg ? `<div class="error-msg">${escapeHtml(errorMsg)}</div>` : ''}
        <form id="login-form">
          <div class="form-field">
            <label>Email</label>
            <input type="email" name="email" required autofocus />
          </div>
          <div class="form-field">
            <label>Senha</label>
            <input type="password" name="password" required />
          </div>
          <div style="text-align:right;margin:-4px 0 12px;">
            <a href="#" id="forgot-password-link" style="font-size:13px;">Esqueci minha senha</a>
          </div>
          <button type="submit" class="btn btn-primary">Entrar</button>
        </form>
        <div class="divider">ou continue com</div>
        <button type="button" class="btn btn-secondary btn-google" id="google-login-btn" style="display:none;">
          ${googleIcon} Continuar com Google
        </button>
      </div>
    </div>
  `;
  document.getElementById('login-theme-toggle').addEventListener('click', toggleTheme);
  
  // Check if Google OAuth is configured
  checkGoogleOAuthConfig().then(configured => {
    const btn = document.getElementById('google-login-btn');
    if (btn) btn.style.display = configured ? 'inline-flex' : 'none';
  });
  
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await handleLogin({
      email: fd.get('email'),
      password: fd.get('password')
    });
  });
  
  document.getElementById('google-login-btn').addEventListener('click', () => {
    window.location.href = '/api/auth/google';
  });

  document.getElementById('forgot-password-link').addEventListener('click', (e) => {
    e.preventDefault();
    renderForgotPassword();
  });
}

// ================= RECUPERACAO DE SENHA =================
// Fluxo: "Esqueci minha senha" -> POST /api/auth/forgot-password {email}
// -> email com link /reset-password?token=... -> renderResetPassword()
// -> POST /api/auth/reset-password {token, password, confirmPassword}.
function renderForgotPassword(infoMsg) {
  const currentTheme = getTheme();
  root.innerHTML = `
    <div class="centered-screen">
      <button class="top-theme-toggle" id="forgot-theme-toggle" title="${currentTheme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}">${currentTheme === 'dark' ? ICONS.sun : ICONS.moon}</button>
      <div class="login-card">
        <div class="brand-icon">${ICONS.lock || ICONS.shield}</div>
        <h1>Recuperar senha</h1>
        <p class="subtitle">Informe seu email para receber o link de redefinicao</p>
        ${infoMsg ? `<div class="hint-box">${escapeHtml(infoMsg)}</div>` : ''}
        <form id="forgot-form">
          <div class="form-field">
            <label>Email</label>
            <input type="email" name="email" required autofocus autocomplete="email" />
          </div>
          <button type="submit" class="btn btn-primary">Enviar link</button>
        </form>
        <div style="text-align:center;margin-top:12px;">
          <a href="#" id="back-to-login" style="font-size:13px;">Voltar ao login</a>
        </div>
      </div>
    </div>
  `;
  document.getElementById('forgot-theme-toggle').addEventListener('click', toggleTheme);
  document.getElementById('back-to-login').addEventListener('click', (e) => {
    e.preventDefault();
    window.history.replaceState({}, document.title, '/');
    renderLogin();
  });
  document.getElementById('forgot-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      const res = await api('POST', '/api/auth/forgot-password', { email: fd.get('email') });
      // Em dev sem SMTP o backend pode retornar devToken: mostra para teste.
      const extra = res && res.devToken ? `<br><br>Modo dev (sem SMTP): <code style="word-break:break-all;">${escapeHtml(res.devToken)}</code>` : '';
      renderForgotPassword('Se o email existir, voce recebera as instrucoes.' + extra);
      toast('Solicitacao enviada. Verifique seu email.');
    } catch (err) {
      toast(err.message, true);
      btn.disabled = false;
    }
  });
}

function renderResetPassword(token, errorMsg) {
  const currentTheme = getTheme();
  root.innerHTML = `
    <div class="centered-screen">
      <button class="top-theme-toggle" id="reset-theme-toggle" title="${currentTheme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}">${currentTheme === 'dark' ? ICONS.sun : ICONS.moon}</button>
      <div class="login-card">
        <div class="brand-icon">${ICONS.lock || ICONS.shield}</div>
        <h1>Nova senha</h1>
        <p class="subtitle">Escolha uma senha forte para sua conta</p>
        ${errorMsg ? `<div class="error-msg">${escapeHtml(errorMsg)}</div>` : ''}
        <form id="reset-form">
          <div class="form-field">
            <label>Nova senha *</label>
            <input type="password" name="password" required minlength="8" autocomplete="new-password" />
            <div class="password-requirements">
              <small>Minimo 8 caracteres, 1 maiuscula, 1 minuscula, 1 numero e 1 caractere especial.</small>
            </div>
          </div>
          <div class="form-field">
            <label>Confirmar senha *</label>
            <input type="password" name="confirmPassword" required minlength="8" autocomplete="new-password" />
          </div>
          <button type="submit" class="btn btn-primary">Redefinir senha</button>
        </form>
        <div style="text-align:center;margin-top:12px;">
          <a href="#" id="reset-back-login" style="font-size:13px;">Voltar ao login</a>
        </div>
      </div>
    </div>
  `;
  document.getElementById('reset-theme-toggle').addEventListener('click', toggleTheme);
  document.getElementById('reset-back-login').addEventListener('click', (e) => {
    e.preventDefault();
    window.history.replaceState({}, document.title, '/');
    renderLogin();
  });
  // Valida o token ao abrir (expirado/invalido volta ao login com aviso).
  api('GET', '/api/auth/verify-reset-token/' + encodeURIComponent(token)).catch((err) => {
    window.history.replaceState({}, document.title, '/');
    renderLogin(err.message || 'Link invalido ou expirado. Solicite novamente.');
  });
  document.getElementById('reset-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    if (fd.get('password') !== fd.get('confirmPassword')) {
      return renderResetPassword(token, 'As senhas nao conferem.');
    }
    try {
      await api('POST', '/api/auth/reset-password', {
        token,
        password: fd.get('password'),
        confirmPassword: fd.get('confirmPassword')
      });
      window.history.replaceState({}, document.title, '/');
      toast('Senha redefinida com sucesso! Faca login.');
      renderLogin();
    } catch (err) {
      renderResetPassword(token, err.message);
    }
  });
}

async function handleLogin(credentials) {
  try {
    const result = await api('POST', '/api/auth/login', credentials);
    if (result.requireTwoFactor) {
      // Mostra modal de 2FA
      showTwoFactorModal(result.userId, credentials);
      return;
    }
    currentUser = result;
    if (currentUser.establishmentId) {
      currentEstablishment = await api('GET', '/api/establishments/current');
    }
    render();
  } catch (err) {
    renderLogin(err.message);
  }
}

function showTwoFactorModal(userId, originalCredentials) {
  const bodyHtml = `
    <form id="twofactor-form">
      <div class="form-field">
        <label>Código do Autenticador</label>
        <input type="text" name="twoFactorToken" required autocomplete="one-time-code" placeholder="123456" style="text-align:center;letter-spacing:4px;font-size:18px;" maxlength="6" />
        <small>Digite o código de 6 dígitos do Google Authenticator, Authy, etc.</small>
      </div>
      <div class="form-field">
        <label>Ou código de backup</label>
        <input type="text" name="backupCode" placeholder="ABCD1234" style="text-transform:uppercase;" />
        <small>Use um dos códigos de backup se não tiver acesso ao autenticador.</small>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" id="cancel-2fa">Cancelar</button>
        <button type="submit" class="btn btn-primary">Verificar</button>
      </div>
    </form>
  `;
  showModal('Autenticação de Dois Fatores', bodyHtml, (overlay) => {
    overlay.querySelector('#cancel-2fa').addEventListener('click', () => {
      closeModal();
      renderLogin(); // Volta para tela de login
    });
    
    overlay.querySelector('#twofactor-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const twoFactorToken = fd.get('twoFactorToken') || fd.get('backupCode');
      if (!twoFactorToken) return;
      
      try {
        currentUser = await api('POST', '/api/auth/login', {
          ...originalCredentials,
          twoFactorToken
        });
        closeModal();
        if (currentUser.establishmentId) {
          currentEstablishment = await api('GET', '/api/establishments/current');
        }
        render();
      } catch (err) {
        toast(err.message, true);
      }
    });
  });
}

// Login Google + 2FA: o callback deixou a sessao em estado pendente
// (pendingGoogle2fa). Exibe o campo de codigo SEM pedir senha — conta
// Google pode nem ter senha cadastrada.
async function showGoogle2faModal() {
  let pending = null;
  try {
    pending = await api('GET', '/api/auth/google/2fa-pending');
  } catch (err) {
    toast(err.message || 'Verificacao 2FA expirada. Entre com Google novamente.', true);
    return renderLogin();
  }
  const bodyHtml = `
    <form id="google-2fa-form">
      <p class="subtitle" style="margin-top:0;">Conta <strong>${escapeHtml(pending.email || '')}</strong>: digite o codigo do autenticador para concluir o login.</p>
      <div class="form-field">
        <label>Código do Autenticador</label>
        <input type="text" name="twoFactorToken" required autocomplete="one-time-code" placeholder="123456" style="text-align:center;letter-spacing:4px;font-size:18px;" maxlength="6" />
        <small>Digite o código de 6 dígitos do Google Authenticator, Authy, etc.</small>
      </div>
      <div class="form-field">
        <label>Ou código de backup</label>
        <input type="text" name="backupCode" placeholder="ABCD1234" style="text-transform:uppercase;" />
        <small>Use um dos códigos de backup se não tiver acesso ao autenticador.</small>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" id="cancel-google-2fa">Cancelar</button>
        <button type="submit" class="btn btn-primary">Verificar e entrar</button>
      </div>
    </form>
  `;
  showModal('Autenticação de Dois Fatores', bodyHtml, (overlay) => {
    overlay.querySelector('#cancel-google-2fa').addEventListener('click', async () => {
      try { await api('POST', '/api/auth/logout'); } catch (e) {}
      closeModal();
      renderLogin();
    });

    overlay.querySelector('#google-2fa-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const token = fd.get('twoFactorToken') || fd.get('backupCode');
      if (!token) return;

      try {
        currentUser = await api('POST', '/api/auth/google/2fa-verify', { token });
        closeModal();
        if (currentUser.establishmentId) {
          currentEstablishment = await api('GET', '/api/establishments/current');
        }
        render();
      } catch (err) {
        toast(err.message, true);
      }
    });
  });
}

async function checkGoogleOAuthConfig() {
  try {
    const res = await fetch('/api/auth/google-config');
    const data = await res.json();
    return data.configured === true;
  } catch (e) {
    return false;
  }
}

async function logout() {
  try { await api('POST', '/api/auth/logout'); } catch (e) {}
  currentUser = null;
  currentEstablishment = null;
  applyEstablishmentTheme(null); // limpa tema ao sair
  // Limpa o hash da URL para evitar acesso a paginas internas
  location.hash = '';
  render();
}

// ================= ESTABLISHMENT SELECTOR =================
async function renderSelector() {
  document.body.removeAttribute('data-niche');
  applyEstablishmentTheme(null); // seletor sempre usa tema base
  root.innerHTML = `<div class="loading-state">Carregando estabelecimentos...</div>`;
  try {
    establishments = await api('GET', '/api/establishments');
  } catch (e) {
    return renderLogin('Sessao expirada, entre novamente.');
  }

  const currentTheme = getTheme();
  root.innerHTML = `
    <div class="selector-screen">
      <button class="top-theme-toggle" id="selector-theme-toggle" title="${currentTheme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}">${currentTheme === 'dark' ? ICONS.sun : ICONS.moon}</button>
      <div class="selector-top">
        <span class="suite-pill">${ICONS.store} Multi-Tenant SaaS</span>
        <h1>Escolha um estabelecimento</h1>
        <p>Selecione um tenant para acessar o painel de gestao</p>
      </div>
      <div class="selector-grid" id="selector-grid"></div>
      <div class="selector-actions">
        ${isGlobalAdmin(currentUser) ? `
          <a href="#/backups" class="btn btn-secondary">${ICONS.archive} Backups</a>
          <a href="#/senhas" class="btn btn-secondary">${ICONS.lock} Usuarios e Senhas</a>
          <a href="#/seguranca" class="btn btn-secondary">${ICONS.shield} Inspecao de Seguranca</a>
          <a href="#/manutencao" class="btn btn-secondary">${ICONS.wrench} Manutenção</a>
        ` : ''}
        <button class="btn btn-secondary" id="selector-logout">${ICONS.arrowRight} Sair</button>
      </div>
    </div>
  `;

  const grid = document.getElementById('selector-grid');
  const canPause = currentUser && currentUser.role === 'admin' &&
    (currentUser.allowedEstablishmentIds === null || currentUser.allowedEstablishmentIds === undefined);
  // Status de bancos dedicados (so admin global; falha silenciosa = sem badges).
  let dedicatedById = {};
  if (isGlobalAdmin(currentUser)) {
    try {
      const dbStatus = await api('GET', '/api/tenant-databases');
      for (const s of (dbStatus.databases || [])) dedicatedById[s.establishmentId] = s;
    } catch (e) { /* sem status de banco dedicado */ }
  }
  grid.innerHTML = establishments.map((est) => `
    <div class="tenant-card ${est.paused ? 'tenant-paused' : ''}">
      ${est.paused ? '<div class="paused-overlay-badge" title="Loja pausada pelo administrador da plataforma">' + ICONS.pause + ' Pausada</div>' : ''}
      ${dedicatedById[est.id] && dedicatedById[est.id].dedicated ? '<div class="paused-overlay-badge" style="top:34px" title="Loja com banco de dados dedicado (isolamento fisico)">' + ICONS.database + ' Banco dedicado</div>' : ''}
      <div class="brand-icon" style="margin-bottom:14px;">${est.logoDataUrl ? `<img src="${est.logoDataUrl}"/>` : nicheIcon(est.niche)}</div>
      <div class="niche-tag">${escapeHtml(est.niche)}</div>
      <h3>${escapeHtml(est.name)}</h3>
      <p class="desc">${escapeHtml(est.description || '')}</p>
      ${est.address ? `<a class="maps-link" href="${toMapsLink(est.address)}" target="_blank" rel="noopener" title="Abrir no Google Maps">${ICONS.globe} ${escapeHtml(est.address)}</a>` : ''}
      <div class="tenant-footer">
        <span>${escapeHtml(est.phone || '')}</span>
        <div class="tenant-actions">
          ${currentUser && currentUser.role === 'admin' ? `
            <button class="access-link" data-id="${est.id}" data-action="login">Acessar ${ICONS.arrowRight}</button>
          ` : `
            <button class="access-link" data-id="${est.id}" ${est.paused ? 'disabled title="Loja pausada — entre como admin da plataforma para reativar"' : ''}>Acessar ${ICONS.arrowRight}</button>
          `}
          ${canPause ? (est.paused
            ? `<button class="btn-icon btn-resume" data-id="${est.id}" title="Reativar loja (reabrir portal)">${ICONS.play}</button>`
            : `<button class="btn-icon btn-pause" data-id="${est.id}" title="Pausar loja (fechar portal sem perder dados)">${ICONS.pause}</button>`
          ) : ''}
          ${canPause ? `<button class="btn-icon danger delete-tenant-btn" data-id="${est.id}" title="Excluir estabelecimento">${ICONS.trash}</button>` : ''}
          ${canPause ? (dedicatedById[est.id] && dedicatedById[est.id].dedicated
            ? `<button class="btn-icon move-back-db-btn" data-id="${est.id}" title="Voltar ao banco compartilhado">${ICONS.database}</button>`
            : `<button class="btn-icon migrate-db-btn" data-id="${est.id}" title="Migrar para banco dedicado (automatico)">${ICONS.database}</button>`
          ) : ''}
        </div>
      </div>
      ${currentUser && currentUser.role === 'admin' ? `<a class="create-user-link" data-id="${est.id}" href="#">Criar acesso</a>` : ''}
    </div>
  `).join('') + `
    ${isGlobalAdmin(currentUser) ? `
    <div class="tenant-card new-tenant" id="new-tenant-card">
      <div class="plus-icon">${ICONS.plus}</div>
      <strong>Novo Estabelecimento</strong>
      <span>Crie e configure um novo tenant</span>
    </div>
    ` : ''}
  `;

  grid.querySelectorAll('.access-link').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      try {
        const action = btn.dataset.action;
        const est = establishments.find((item) => item.id === btn.dataset.id);
        if (action === 'login' && est) {
          openTenantLoginModal(est);
          return;
        }
        currentEstablishment = await api('POST', `/api/establishments/${btn.dataset.id}/select`);
        location.hash = '#/dashboard';
        render();
      } catch (e) { toast(e.message, true); }
    });
  });
  grid.querySelectorAll('.delete-tenant-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const est = establishments.find((item) => item.id === id);
      if (!est) return;
      const confirmed = window.confirm(`Deseja excluir o estabelecimento "${est.name}" e todos os dados relacionados a ele?`);
      if (!confirmed) return;
      try {
        await api('DELETE', `/api/establishments/${id}`);
        toast('Estabelecimento excluido com sucesso.');
        await renderSelector();
      } catch (err) {
        toast(err.message, true);
      }
    });
  });
  grid.querySelectorAll('.migrate-db-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const est = establishments.find((item) => item.id === id);
      if (!est) return;
      const ok = window.confirm(
        `Migrar "${est.name}" para um BANCO DEDICADO?\n\n` +
        `O sistema cria o banco sozinho, move todos os dados da loja e ativa o isolamento fisico — sem editar .env e sem reiniciar.\n\n` +
        `Continuar?`
      );
      if (!ok) return;
      btn.disabled = true;
      try {
        toast('Migrando loja para banco dedicado, aguarde...');
        await api('POST', `/api/tenant-databases/${id}/provision`, {});
        toast('Loja migrada para banco dedicado com sucesso.');
        await renderSelector();
      } catch (err) {
        toast(err.message, true);
        btn.disabled = false;
      }
    });
  });
  grid.querySelectorAll('.move-back-db-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const est = establishments.find((item) => item.id === id);
      if (!est) return;
      const ok = window.confirm(
        `Voltar "${est.name}" ao banco COMPARTILHADO?\n\n` +
        `Os dados voltam ao banco padrao. O banco dedicado e removido do roteamento.\n\n` +
        `Continuar?`
      );
      if (!ok) return;
      btn.disabled = true;
      try {
        await api('POST', `/api/tenant-databases/${id}/move-back`, {});
        toast('Loja voltou ao banco compartilhado.');
        await renderSelector();
      } catch (err) {
        toast(err.message, true);
        btn.disabled = false;
      }
    });
  });
  grid.querySelectorAll('.btn-pause').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const est = establishments.find((item) => item.id === id);
      if (!est) return;
      const ok = window.confirm(
        `Pausar "${est.name}"?\n\n` +
        `O portal publico de clientes (${"'" + est.name + "'"}) fica offline imediatamente, e nenhum cliente podera agendar. ` +
        `Os dados (agendamentos, clientes, servicos) nao sao apagados. ` +
        `Para reabrir, clique no botao de play.\n\n` +
        `Continuar?`
      );
      if (!ok) return;
      try {
        await api('PUT', `/api/establishments/${id}/pause`);
        toast('Loja "' + est.name + '" pausada. Portal publico offline.');
        await renderSelector();
      } catch (err) { toast(err.message, true); }
    });
  });
  grid.querySelectorAll('.btn-resume').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const est = establishments.find((item) => item.id === id);
      if (!est) return;
      try {
        await api('PUT', `/api/establishments/${id}/resume`);
        toast('Loja "' + est.name + '" reativada. Portal publico volta a aceitar agendamentos.');
        await renderSelector();
      } catch (err) { toast(err.message, true); }
    });
  });
  grid.querySelectorAll('.create-user-link').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const est = establishments.find((item) => item.id === btn.dataset.id);
      if (!est) return;
      openCreateUserModal(est);
    });
  });
  const newTenantCard = document.getElementById('new-tenant-card');
  if (newTenantCard) newTenantCard.addEventListener('click', openNewEstablishmentModal);
  document.getElementById('selector-logout').addEventListener('click', logout);
  document.getElementById('selector-theme-toggle').addEventListener('click', toggleTheme);
}

function renderSelectorPublic() {
  root.innerHTML = `<div class="loading-state">Carregando estabelecimentos...</div>`;
  return api('GET', '/api/establishments').then((list) => {
    establishments = list;
    root.innerHTML = `
      <div class="selector-screen">
        <button class="top-theme-toggle" id="selector-theme-toggle" title="${getTheme() === 'dark' ? 'Modo Claro' : 'Modo Escuro'}">${getTheme() === 'dark' ? ICONS.sun : ICONS.moon}</button>
        <div class="selector-top">
          <span class="suite-pill">${ICONS.store} Multi-Tenant SaaS</span>
          <h1>Escolha um estabelecimento</h1>
          <p>Selecione um tenant para acessar o painel de gestao</p>
        </div>
        <div class="selector-grid" id="selector-grid"></div>
      </div>
    `;

    document.getElementById('selector-theme-toggle').addEventListener('click', toggleTheme);

    const grid = document.getElementById('selector-grid');
    grid.innerHTML = establishments.map((est) => `
      <div class="tenant-card">
        <div class="brand-icon" style="margin-bottom:14px;">${est.logoDataUrl ? `<img src="${est.logoDataUrl}"/>` : nicheIcon(est.niche)}</div>
        <div class="niche-tag">${escapeHtml(est.niche)}</div>
        <h3>${escapeHtml(est.name)}</h3>
        <p class="desc">${escapeHtml(est.description || '')}</p>
        ${est.address ? `<a class="maps-link" href="${toMapsLink(est.address)}" target="_blank" rel="noopener" title="Abrir no Google Maps">${ICONS.globe} ${escapeHtml(est.address)}</a>` : ''}
        <div class="tenant-footer">
          <span>${escapeHtml(est.phone || '')}</span>
          <div class="tenant-actions">
            <button class="access-link" data-id="${est.id}">Acessar ${ICONS.arrowRight}</button>
          </div>
        </div>
      </div>
    `).join('');

    grid.querySelectorAll('.access-link').forEach((btn) => {
      btn.addEventListener('click', () => {
        const est = establishments.find((item) => item.id === btn.dataset.id);
        if (est) openTenantLoginModal(est);
      });
    });
  }).catch((e) => {
    renderLogin('Erro ao carregar estabelecimentos.');
  });
}

function openTenantLoginModal(establishment) {
  const googleIcon = '<svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>';
  
  const bodyHtml = `
    <form id="tenant-login-form">
      <div class="form-field"><label>Email *</label><input type="email" name="email" required /></div>
      <div class="form-field"><label>Senha *</label><input type="password" name="password" required /></div>
      <div class="divider">ou continue com</div>
      <button type="button" class="btn btn-secondary btn-google" id="tenant-google-login-btn" style="display:none;">
        ${googleIcon} Continuar com Google
      </button>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" id="cancel-tenant-login">Cancelar</button>
        <button type="submit" class="btn btn-primary">Entrar em ${escapeHtml(establishment.name)}</button>
      </div>
    </form>
  `;
  showModal(`Login para ${escapeHtml(establishment.name)}`, bodyHtml, (overlay) => {
    overlay.querySelector('#cancel-tenant-login').addEventListener('click', closeModal);
    
    // Check if Google OAuth is configured
    checkGoogleOAuthConfig().then(configured => {
      const btn = overlay.querySelector('#tenant-google-login-btn');
      if (btn) btn.style.display = configured ? 'inline-flex' : 'none';
    });
    
    overlay.querySelector('#tenant-google-login-btn').addEventListener('click', () => {
      window.location.href = `/api/auth/google?establishmentId=${establishment.id}`;
    });
    
    overlay.querySelector('#tenant-login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const credentials = {
        email: fd.get('email'),
        password: fd.get('password'),
        establishmentId: establishment.id
      };
      try {
        const result = await api('POST', '/api/auth/login', credentials);
        if (result.requireTwoFactor) {
          closeModal();
          showTwoFactorModal(result.userId, credentials);
          return;
        }
        currentUser = result;
        if (currentUser.establishmentId) {
          currentEstablishment = await api('GET', '/api/establishments/current');
        }
        closeModal();
        render();
      } catch (err) {
        toast(err.message, true);
      }
    });
  });
}

function openCreateUserModal(establishment) {
  const bodyHtml = `
    <form id="new-est-user-form">
      <div class="form-field"><label>Nome *</label><input type="text" name="name" required /></div>
      <div class="form-field"><label>Email *</label><input type="email" name="email" required /></div>
      <div class="form-field"><label>Senha *</label><input type="password" name="password" required /></div>
      <div class="form-field">
        <label>Perfil</label>
        <select name="role">
          <option value="operator" selected>Operador</option>
          <option value="admin">Administrador</option>
        </select>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" id="cancel-new-est-user">Cancelar</button>
        <button type="submit" class="btn btn-primary">Criar Acesso</button>
      </div>
    </form>
  `;
  showModal(`Criar login para ${escapeHtml(establishment.name)}`, bodyHtml, (overlay) => {
    overlay.querySelector('#cancel-new-est-user').addEventListener('click', closeModal);
    overlay.querySelector('#new-est-user-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await api('POST', `/api/users/by-establishment/${establishment.id}`, {
          name: fd.get('name'),
          email: fd.get('email'),
          password: fd.get('password'),
          role: fd.get('role')
        });
        closeModal();
        toast('Acesso criado para ' + establishment.name + '.');
      } catch (err) {
        toast(err.message, true);
      }
    });
  });
}

function openNewEstablishmentModal(onCreated) {
  const bodyHtml = `
    <form id="new-est-form">
      <div class="logo-upload-row">
        <div class="logo-preview" id="logo-preview">${ICONS.store}</div>
        <label class="btn btn-secondary" style="cursor:pointer;">
          ${ICONS.upload} Carregar logo
          <input type="file" accept="image/*" id="logo-input" style="display:none;" />
        </label>
      </div>
      <div class="form-field">
        <label>Nome *</label>
        <input type="text" name="name" placeholder="Ex: Barbearia Elite" required />
      </div>
      <div class="form-field">
        <label>Nicho *</label>
        <div class="niche-selector-grid" id="niche-selector-grid">
          ${NICHE_OPTIONS.map((opt, i) => `
            <div class="niche-option${i === 0 ? ' selected' : ''}" data-niche="${opt.value}">
              <div class="niche-icon">${opt.icon}</div>
              <div class="niche-label">${opt.value}</div>
              <div class="niche-desc">${opt.desc}</div>
            </div>
          `).join('')}
        </div>
        <input type="hidden" name="niche" id="niche-hidden" value="Barbearia" />
      </div>
      <div class="form-grid">
        <div class="form-field">
          <label>Telefone</label>
          <input type="text" name="phone" placeholder="(11) 99999-9999" />
        </div>
        <div class="form-field">
          <label>Endereco</label>
          <input type="text" name="address" placeholder="Rua, numero" />
        </div>
      </div>
      <div class="form-field">
        <label>Descricao</label>
        <textarea name="description" placeholder="Breve descricao"></textarea>
      </div>
      <div class="form-field">
        <label>Periodo de Expiracao</label>
        <select name="expirationPeriod">
          <option>Sem expiracao</option>
          <option>30 dias</option>
          <option>90 dias</option>
          <option>1 ano</option>
        </select>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" id="cancel-new-est">Cancelar</button>
        <button type="submit" class="btn btn-primary">Criar Estabelecimento</button>
      </div>
    </form>
  `;
  let logoDataUrl = '';
  showModal('Novo Estabelecimento', bodyHtml, (overlay) => {
    overlay.querySelector('#cancel-new-est').addEventListener('click', closeModal);

    overlay.querySelectorAll('.niche-option').forEach((opt) => {
      opt.addEventListener('click', () => {
        overlay.querySelectorAll('.niche-option').forEach((o) => o.classList.remove('selected'));
        opt.classList.add('selected');
        const niche = opt.dataset.niche;
        overlay.querySelector('#niche-hidden').value = niche;
        overlay.querySelector('#logo-preview').innerHTML = NICHE_ICON[niche] || ICONS.store;
      });
    });

    overlay.querySelector('#logo-input').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        logoDataUrl = reader.result;
        overlay.querySelector('#logo-preview').innerHTML = `<img src="${logoDataUrl}"/>`;
      };
      reader.readAsDataURL(file);
    });
    overlay.querySelector('#new-est-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        const created = await api('POST', '/api/establishments', {
          name: fd.get('name'),
          niche: fd.get('niche'),
          phone: fd.get('phone'),
          address: fd.get('address'),
          description: fd.get('description'),
          expirationPeriod: fd.get('expirationPeriod'),
          logoDataUrl
        });
        closeModal();
        toast('Estabelecimento criado com sucesso.');
        if (typeof onCreated === 'function') onCreated(created);
        else renderSelector();
      } catch (err) { toast(err.message, true); }
    });
  });
}

// ================= APP SHELL (sidebar + pages) =================
const NAV_ITEMS = [
  { hash: '#/dashboard', label: 'Dashboard', icon: ICONS.dashboard },
  { hash: '#/pedidos', label: 'Pedidos', icon: ICONS.clipboard },
  { hash: '#/clientes', label: 'Clientes', icon: ICONS.users },
  { hash: '#/funcionarios', label: 'Funcionarios', icon: ICONS.userCog },
  { hash: '#/servicos', label: 'Servicos', icon: ICONS.wrench },
  { hash: '#/fechamento-caixa', label: 'Fechamento de Caixa', icon: ICONS.dollar },
  { hash: '#/configuracoes', label: 'Configuracoes', icon: ICONS.gear },
  { hash: '#/backups', label: 'Backups', icon: ICONS.archive, adminOnly: true },
  { hash: '#/senhas', label: 'Usuarios e Senhas', icon: ICONS.lock, adminOnly: true },
  { hash: '#/seguranca', label: 'Inspecao de Seguranca', icon: ICONS.shield, adminOnly: true },
  { hash: '#/manutencao', label: 'Manutenção', icon: ICONS.wrench, adminOnly: true }
];

function currentRoute() {
  return location.hash && location.hash !== '#' ? location.hash : '#/dashboard';
}

function renderAppShell() {
  if (!location.hash) location.hash = '#/dashboard';
  const route = currentRoute();

  document.body.dataset.niche = currentEstablishment.niche || 'Outro';
  // Aplica o tema premium da loja selecionada no painel admin.
  applyEstablishmentTheme(currentEstablishment);

  root.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="sidebar-brand">
          <div class="brand-icon">${currentEstablishment.logoDataUrl ? `<img src="${currentEstablishment.logoDataUrl}"/>` : nicheIcon(currentEstablishment.niche)}</div>
          <div class="brand-text">
            <div class="brand-name">${escapeHtml(currentEstablishment.name)}</div>
            <div class="brand-niche">${escapeHtml(currentEstablishment.niche)}</div>
          </div>
        </div>
        <nav class="sidebar-nav">
          ${NAV_ITEMS.filter((item) => !item.adminOnly || isGlobalAdmin(currentUser)).map((item) => `
            <a href="${item.hash}" class="nav-item ${route === item.hash ? 'active' : ''}">
              <span class="ic">${item.icon}</span>${item.label}
            </a>
          `).join('')}
        </nav>
        <div class="sidebar-footer">
          <button class="theme-toggle-btn" id="theme-toggle-btn"><span class="ic">${getTheme() === 'dark' ? ICONS.sun : ICONS.moon}</span>${getTheme() === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</button>
          ${currentUser && currentUser.role === 'admin' ? `<button class="nav-item" id="switch-est-btn"><span class="ic">${ICONS.arrowLeft}</span>Trocar Estabelecimento</button>` : ''}
          <button class="nav-item" id="logout-btn"><span class="ic">${ICONS.arrowRight}</span>Sair</button>
        </div>
      </aside>
      <main class="main" id="main-content"></main>
    </div>
  `;

  document.getElementById('theme-toggle-btn').addEventListener('click', toggleTheme);

  const switchBtn = document.getElementById('switch-est-btn');
  if (switchBtn) {
    switchBtn.addEventListener('click', async () => {
      await api('POST', '/api/establishments/clear-selection');
      currentEstablishment = null;
      applyEstablishmentTheme(null); // limpa tema ao voltar ao seletor
      location.hash = '';
      render();
    });
  }
  document.getElementById('logout-btn').addEventListener('click', logout);

  const pageRenderers = {
    '#/dashboard': renderDashboardPage,
    '#/pedidos': renderPedidosPage,
    '#/clientes': renderClientesPage,
    '#/funcionarios': renderFuncionariosPage,
    '#/servicos': renderServicosPage,
    '#/fechamento-caixa': renderCashClosingPage,
    '#/configuracoes': renderConfiguracoesPage,
    '#/backups': renderBackupsPage,
    '#/senhas': renderSenhasPage,
    '#/seguranca': renderSegurancaPage,
    '#/manutencao': renderManutencaoPage
  };
  (pageRenderers[route] || renderDashboardPage)();
}

function mainEl() { return document.getElementById('main-content'); }

// ---------- Theme (admin SPA) ----------
// Injeta só o <link> do tema da loja atual. Remove links de tema anteriores.
// Isso garante que o painel admin tambem herda o design premium do nicho.
function applyEstablishmentTheme(est) {
  // Remove tema anterior (se houver)
  document.querySelectorAll('link[data-admin-theme]').forEach((l) => l.remove());
  if (!est) {
    document.body.removeAttribute('data-theme');
    document.documentElement.style.removeProperty('--accent');
    return;
  }
  const theme = est.theme || (NICHE_TO_THEME_LEGACY[est.niche] || 'generico');
  if (theme && theme !== 'generico') {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/themes/' + encodeURIComponent(theme) + '.css';
    link.dataset.adminTheme = theme;
    document.head.appendChild(link);
  }
  document.body.dataset.theme = theme;
  // Se a loja tem accentOverride, aplica a cor de destaque.
  // Cor livre (hex #RRGGBB) aplica direto; nome de paleta busca o hex no endpoint.
  if (est.accentOverride) {
    if (/^#[0-9a-fA-F]{6}$/.test(est.accentOverride)) {
      applyAccentColor(est.accentOverride);
    } else {
      api('GET', `/api/establishments/themes/${encodeURIComponent(theme)}/palette`)
        .then((res) => {
          const found = res.palette && res.palette.find((p) => p.name === est.accentOverride);
          if (found) applyAccentColor(found.color);
        })
        .catch(() => {});
    }
  } else {
    document.documentElement.style.removeProperty('--accent');
    document.documentElement.style.removeProperty('--accent-rgb');
    document.documentElement.style.removeProperty('--accent-dark');
    document.documentElement.style.removeProperty('--accent-light');
  }
}

// Aplica uma cor hex nas CSS vars de destaque (--accent, --accent-rgb, etc.).
function applyAccentColor(hex) {
  if (!hex) return;
  document.documentElement.style.setProperty('--accent', hex);
  const rgb = hexToRgb(hex);
  if (rgb) {
    document.documentElement.style.setProperty('--accent-rgb', rgb);
    document.documentElement.style.setProperty('--accent-dark', shade(hex, -0.15));
    document.documentElement.style.setProperty('--accent-light', shade(hex, 0.15));
  }
}

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{6})$/i.exec(hex);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

// Clareira/escurece um hex por fator (-0.2 a +0.2).
function shade(hex, factor) {
  const m = /^#?([a-f\d]{6})$/i.exec(hex || '');
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const r = Math.max(0, Math.min(255, Math.round(((n >> 16) & 255) * (1 + factor))));
  const g = Math.max(0, Math.min(255, Math.round(((n >> 8) & 255) * (1 + factor))));
  const b = Math.max(0, Math.min(255, Math.round((n & 255) * (1 + factor))));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

// ---------- Dashboard ----------
async function renderDashboardPage() {
  mainEl().innerHTML = `<div class="loading-state">Carregando...</div>`;
  let stats;
  try {
    stats = await api('GET', '/api/dashboard');
  } catch (e) { return toast(e.message, true); }

  mainEl().innerHTML = `
    <div class="page-header">
      <div>
        <h1>Dashboard</h1>
        <p>Visao geral de ${escapeHtml(currentEstablishment.name)}</p>
      </div>
    </div>
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-top"><span class="stat-label">Agendamentos</span>
          <span class="stat-icon" style="background:var(--badge-orange-bg)">${ICONS.clipboard}</span></div>
        <div class="stat-value">${stats.totalAppointments}</div>
        <div class="stat-sub">${stats.inProgress} em andamento</div>
      </div>
      <div class="stat-card">
        <div class="stat-top"><span class="stat-label">Clientes</span>
          <span class="stat-icon" style="background:var(--badge-blue-bg)">${ICONS.users}</span></div>
        <div class="stat-value">${stats.totalClients}</div>
        <div class="stat-sub">&nbsp;</div>
      </div>
      <div class="stat-card">
        <div class="stat-top"><span class="stat-label">Funcionarios</span>
          <span class="stat-icon" style="background:var(--badge-purple-bg)">${ICONS.userCog}</span></div>
        <div class="stat-value">${stats.totalEmployees}</div>
        <div class="stat-sub">&nbsp;</div>
      </div>
      <div class="stat-card">
        <div class="stat-top"><span class="stat-label">Receita</span>
          <span class="stat-icon" style="background:var(--badge-green-bg)">${ICONS.dollar}</span></div>
        <div class="stat-value">${formatMoney(stats.revenue)}</div>
        <div class="stat-sub">Pedidos concluidos</div>
      </div>
    </div>
    <div class="card">
      <div class="card-header">Agendamentos recentes ${ICONS.clock}</div>
      ${stats.recentAppointments.length === 0 ? `<div class="empty-state">Nenhum agendamento ainda.</div>` : `
      <table>
        <thead><tr><th>Cliente</th><th>Data</th><th>Total</th><th>Status</th></tr></thead>
        <tbody>
          ${stats.recentAppointments.map((a) => `
            <tr>
              <td class="cell-strong">${escapeHtml(a.clientName)}</td>
              <td class="cell-muted">${formatDateTime(a.dateTime)}</td>
              <td class="cell-strong">${formatMoney(a.total)}</td>
              <td><span class="pill ${statusPillClass(a.status)}">${a.status}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>`}
    </div>
  `;
}

// ---------- Pedidos (Agendamentos) ----------
let cachedClients = [];
let cachedEmployees = [];
let cachedServices = [];

async function renderPedidosPage() {
  mainEl().innerHTML = `<div class="loading-state">Carregando...</div>`;
  let appts;
  try {
    [appts, cachedClients, cachedEmployees, cachedServices] = await Promise.all([
      api('GET', '/api/appointments'),
      api('GET', '/api/clients'),
      api('GET', '/api/employees'),
      api('GET', '/api/services')
    ]);
  } catch (e) { return toast(e.message, true); }

  mainEl().innerHTML = `
    <div class="page-header">
      <div>
        <h1>Agendamentos</h1>
        <p>Gerencie os agendamentos do estabelecimento</p>
      </div>
      <button class="btn btn-primary" id="new-appt-btn">${ICONS.plus} Novo Agendamento</button>
    </div>
    <div class="card">
      ${appts.length === 0 ? `<div class="empty-state">Nenhum agendamento cadastrado.</div>` : `
      <table>
        <thead><tr><th>Cliente</th><th>WhatsApp</th><th>Servico</th><th>Funcionario</th><th>Data</th><th>Total</th><th>Status</th><th></th></tr></thead>
        <tbody id="appt-tbody">
          ${appts.map((a) => {
            const rawPhone = a.clientPhone || (cachedClients.find((c) => c.id === a.clientId) || {}).phone || '';
            const whatsappLink = toWhatsappLink(rawPhone);
            const clientEmail = (cachedClients.find((c) => c.id === a.clientId) || {}).email || '';
            const deliveryLine = a.deliveryAddress ? clientAddressLine(a.deliveryAddress) : '';
            const addressLine = deliveryLine || a.clientAddress || '';
            const addressLabel = (a.deliveryAddress && a.deliveryAddress.addressLabel) || '';
            return `
            <tr data-id="${a.id}">
              <td class="cell-strong">
                ${escapeHtml(a.clientName)}
                ${addressLine ? `
                  <div class="address-block">
                    ${addressLabel ? `<div class="address-label">${escapeHtml(addressLabel)}</div>` : ''}
                    <div class="address-line">${a.deliveryAddress ? 'Entrega: ' : ''}${escapeHtml(addressLine)}</div>
                  </div>
                ` : ''}
              </td>
              <td class="cell-muted">${whatsappLink ? `<a href="${whatsappLink}" target="_blank" rel="noopener" class="whatsapp-link">${escapeHtml(rawPhone)}</a>` : '&mdash;'}</td>
              <td class="cell-muted">${escapeHtml(a.serviceName || '—')}</td>
              <td class="cell-muted">${a.employeeName ? escapeHtml(a.employeeName) : '&mdash;'}</td>
              <td class="cell-muted">${formatDateTime(a.dateTime)}</td>
              <td class="cell-strong">${formatMoney(a.total)}</td>
              <td>
                <select class="status-select" data-id="${a.id}">
                  ${['Pendente', 'Em Andamento', 'Concluido', 'Cancelado'].map((s) => `<option value="${s}" ${s === a.status ? 'selected' : ''}>${s}</option>`).join('')}
                </select>
              </td>
              <td class="actions-cell">
                <button class="btn-icon pay-appt" data-id="${a.id}" data-total="${a.total}" data-client="${escapeHtml(a.clientName)}" data-email="${escapeHtml(clientEmail)}" data-phone="${escapeHtml(rawPhone)}" title="Cobrar via AbacatePay">${ICONS.creditCard}</button>
                <button class="btn-icon edit-appt" data-id="${a.id}">${ICONS.pencil}</button>
                <button class="btn-icon danger delete-appt" data-id="${a.id}">${ICONS.trash}</button>
              </td>
            </tr>
          `;
          }).join('')}
        </tbody>
      </table>`}
    </div>
  `;

  document.getElementById('new-appt-btn').addEventListener('click', () => openAppointmentModal());
  mainEl().querySelectorAll('.status-select').forEach((sel) => {
    sel.addEventListener('change', async () => {
      try {
        await api('PUT', `/api/appointments/${sel.dataset.id}`, { status: sel.value });
        toast('Status atualizado.');
        renderPedidosPage();
      } catch (e) { toast(e.message, true); }
    });
  });
  mainEl().querySelectorAll('.edit-appt').forEach((btn) => {
    btn.addEventListener('click', () => {
      const appt = appts.find((a) => a.id === btn.dataset.id);
      openAppointmentModal(appt);
    });
  });
  mainEl().querySelectorAll('.delete-appt').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Excluir este agendamento?')) return;
      try {
        await api('DELETE', `/api/appointments/${btn.dataset.id}`);
        toast('Agendamento excluido.');
        renderPedidosPage();
      } catch (e) { toast(e.message, true); }
    });
  });
  mainEl().querySelectorAll('.pay-appt').forEach((btn) => {
    btn.addEventListener('click', () => {
      openPaymentModal({
        appointmentId: btn.dataset.id,
        total: parseFloat(btn.dataset.total) || 0,
        clientName: btn.dataset.client || '',
        clientEmail: btn.dataset.email || '',
        clientPhone: btn.dataset.phone || ''
      });
    });
  });
}

function openAppointmentModal(appt) {
  const isEdit = !!appt;
  const bodyHtml = `
    <form id="appt-form">
      <div class="form-field">
        <label>Cliente *</label>
        <select name="clientId" id="appt-client-select">
          <option value="">-- Novo cliente --</option>
          ${cachedClients.map((c) => `<option value="${c.id}" ${appt && appt.clientId === c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}
        </select>
      </div>
      <div class="form-grid" id="new-client-fields" style="${isEdit ? 'display:none;' : ''}">
        <div class="form-field"><label>Nome do novo cliente</label><input type="text" name="newClientName" /></div>
        <div class="form-field"><label>Telefone</label><input type="text" name="newClientPhone" /></div>
      </div>
      <div class="form-field">
        <label>Funcionario</label>
        <select name="employeeId">
          <option value="">-- Nao definido --</option>
          ${cachedEmployees.map((e) => `<option value="${e.id}" ${appt && appt.employeeId === e.id ? 'selected' : ''}>${escapeHtml(e.name)}</option>`).join('')}
        </select>
      </div>
      <div class="form-field">
        <label>Servico</label>
        <select name="serviceId" id="appt-service-select">
          <option value="">-- Nenhum --</option>
          ${cachedServices.map((s) => `<option value="${s.id}" data-price="${s.price}" ${appt && appt.serviceId === s.id ? 'selected' : ''}>${escapeHtml(s.name)} (${formatMoney(s.price)})</option>`).join('')}
        </select>
      </div>
      <div class="form-grid">
        <div class="form-field">
          <label>Data e hora *</label>
          <input type="datetime-local" name="dateTime" value="${appt ? toDateTimeLocalValue(appt.dateTime) : ''}" required />
        </div>
        <div class="form-field">
          <label>Total (R$)</label>
          <input type="number" step="0.01" name="total" id="appt-total-input" value="${appt ? appt.total : ''}" />
        </div>
      </div>
      <div class="form-field">
        <label>Status</label>
        <select name="status">
          ${['Pendente', 'Em Andamento', 'Concluido', 'Cancelado'].map((s) => `<option value="${s}" ${appt && appt.status === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" id="cancel-appt">Cancelar</button>
        <button type="submit" class="btn btn-primary">${isEdit ? 'Salvar Alteracoes' : 'Criar Agendamento'}</button>
      </div>
    </form>
  `;
  showModal(isEdit ? 'Editar Agendamento' : 'Novo Agendamento', bodyHtml, (overlay) => {
    overlay.querySelector('#cancel-appt').addEventListener('click', closeModal);
    overlay.querySelector('#appt-client-select').addEventListener('change', (e) => {
      overlay.querySelector('#new-client-fields').style.display = e.target.value ? 'none' : 'grid';
    });
    overlay.querySelector('#appt-service-select').addEventListener('change', (e) => {
      const opt = e.target.selectedOptions[0];
      const totalInput = overlay.querySelector('#appt-total-input');
      if (opt && opt.dataset.price && !totalInput.value) {
        totalInput.value = opt.dataset.price;
      } else if (opt && opt.dataset.price) {
        totalInput.value = opt.dataset.price;
      }
    });
    overlay.querySelector('#appt-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const payload = {
        clientId: fd.get('clientId') || undefined,
        newClientName: fd.get('newClientName') || undefined,
        newClientPhone: fd.get('newClientPhone') || undefined,
        employeeId: fd.get('employeeId') || null,
        serviceId: fd.get('serviceId') || null,
        dateTime: fd.get('dateTime'),
        total: fd.get('total') || undefined,
        status: fd.get('status')
      };
      try {
        if (isEdit) {
          await api('PUT', `/api/appointments/${appt.id}`, payload);
          toast('Agendamento atualizado.');
        } else {
          await api('POST', '/api/appointments', payload);
          toast('Agendamento criado.');
        }
        closeModal();
        renderPedidosPage();
      } catch (err) { toast(err.message, true); }
    });
  });
}

// ---------- Payment Modal (AbacatePay) ----------
async function openPaymentModal(info) {
  let apiKeyStatus;
  try {
    apiKeyStatus = await api('GET', '/api/payments/api-key');
  } catch (e) {
    return toast(e.message, true);
  }

  if (!apiKeyStatus.configured) {
    showModal('Pagamento - AbacatePay', `
      <div style="text-align:center;padding:20px;">
        <p style="margin-bottom:16px;">Configure sua API key do AbacatePay antes de cobrar.</p>
        <form id="pay-apikey-form">
          <div class="form-field">
            <label>API Key do AbacatePay</label>
            <input type="password" name="apiKey" placeholder="Sua API key" required />
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" id="cancel-pay-apikey">Cancelar</button>
            <button type="submit" class="btn btn-primary">Salvar API Key</button>
          </div>
        </form>
        <p style="margin-top:12px;font-size:12px;color:var(--text-muted);">
          Obtenha sua API key em <a href="https://abacatepay.com" target="_blank" rel="noopener">abacatepay.com</a>
        </p>
      </div>
    `, (overlay) => {
      overlay.querySelector('#cancel-pay-apikey').addEventListener('click', closeModal);
      overlay.querySelector('#pay-apikey-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        try {
          await api('PUT', '/api/payments/api-key', { apiKey: fd.get('apiKey') });
          toast('API key salva com sucesso.');
          closeModal();
          openPaymentModal(info);
        } catch (err) { toast(err.message, true); }
      });
    });
    return;
  }

  const bodyHtml = `
    <div style="padding:8px 0;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <div>
          <strong>${escapeHtml(info.clientName)}</strong>
          <span style="color:var(--text-muted);font-size:13px;margin-left:8px;">${formatMoney(info.total)}</span>
        </div>
        <button type="button" class="btn btn-secondary" id="pay-change-key" style="font-size:12px;padding:4px 10px;">Trocar API Key</button>
      </div>
      <div class="form-field">
        <label>Email do cliente</label>
        <input type="email" id="pay-email" value="${escapeHtml(info.clientEmail)}" placeholder="email@exemplo.com" />
      </div>
      <div class="form-field">
        <label>Valor (R$)</label>
        <input type="number" step="0.01" id="pay-amount" value="${info.total}" min="0.01" />
      </div>
      <div style="display:flex;gap:10px;margin-top:16px;">
        <button type="button" class="btn btn-primary" id="pay-pix-btn" style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px;">
          ${ICONS.creditCard} PIX (Copia e Cola)
        </button>
        <button type="button" class="btn btn-secondary" id="pay-checkout-btn" style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px;">
          ${ICONS.globe} Checkout Hospedado
        </button>
      </div>
      <div id="pay-result" style="margin-top:16px;"></div>
    </div>
  `;

  showModal('Cobrar Pagamento', bodyHtml, (overlay) => {
    const resultEl = overlay.querySelector('#pay-result');

    overlay.querySelector('#pay-change-key').addEventListener('click', () => {
      const newKey = prompt('Digite a nova API key do AbacatePay:');
      if (newKey) {
        api('PUT', '/api/payments/api-key', { apiKey: newKey })
          .then(() => { toast('API key atualizada.'); closeModal(); openPaymentModal(info); })
          .catch((e) => toast(e.message, true));
      }
    });

    overlay.querySelector('#pay-pix-btn').addEventListener('click', async () => {
      const email = overlay.querySelector('#pay-email').value.trim();
      const amount = parseFloat(overlay.querySelector('#pay-amount').value);
      if (!amount || amount <= 0) return toast('Informe um valor valido.', true);

      resultEl.innerHTML = '<div class="loading-state">Gerando PIX...</div>';
      try {
        const payload = { amount, description: `Agendamento - ${info.clientName}` };
        if (email) payload.customer = { email };
        const result = await api('POST', '/api/payments/create-pix', payload);
        const pixData = result.data || result;
        const brCode = pixData.brCode || '';
        const brCodeBase64 = pixData.brCodeBase64 || '';
        const pixId = pixData.id || '';

        resultEl.innerHTML = `
          <div style="text-align:center;">
            ${brCodeBase64 ? `<img src="${brCodeBase64}" alt="QR Code PIX" style="max-width:200px;margin:0 auto 12px;display:block;border-radius:8px;" />` : ''}
            <div style="background:var(--bg-muted,#f5f5f5);padding:10px;border-radius:6px;word-break:break-all;font-family:monospace;font-size:12px;margin-bottom:8px;">
              ${escapeHtml(brCode)}
            </div>
            <button type="button" class="btn btn-secondary" id="copy-pix-btn" style="font-size:13px;">Copiar codigo PIX</button>
            ${pixId ? `<button type="button" class="btn btn-secondary" id="check-pix-btn" data-id="${pixId}" style="font-size:13px;margin-left:6px;">Verificar pagamento</button>` : ''}
            <div id="pix-status" style="margin-top:8px;font-size:13px;"></div>
          </div>
        `;

        const copyBtn = resultEl.querySelector('#copy-pix-btn');
        if (copyBtn) {
          copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(brCode).then(() => toast('Codigo PIX copiado!')).catch(() => toast('Erro ao copiar.', true));
          });
        }

        const checkBtn = resultEl.querySelector('#check-pix-btn');
        if (checkBtn) {
          checkBtn.addEventListener('click', async () => {
            const statusEl = resultEl.querySelector('#pix-status');
            statusEl.textContent = 'Verificando...';
            try {
              const status = await api('GET', `/api/payments/check/${pixId}`);
              const s = (status.data && status.data.status) || status.status || 'Desconhecido';
              statusEl.innerHTML = `<strong>Status:</strong> ${escapeHtml(s)}`;
              if (s === 'PAID' || s === 'COMPLETED') {
                statusEl.innerHTML += '<br><span style="color:#10b981;font-weight:600;">Pagamento confirmado!</span>';
              }
            } catch (e) { statusEl.textContent = 'Erro: ' + e.message; }
          });
        }
      } catch (e) {
        resultEl.innerHTML = `<p style="color:#ef4444;">${escapeHtml(e.message)}</p>`;
      }
    });

    overlay.querySelector('#pay-checkout-btn').addEventListener('click', async () => {
      const email = overlay.querySelector('#pay-email').value.trim();
      const amount = parseFloat(overlay.querySelector('#pay-amount').value);
      if (!amount || amount <= 0) return toast('Informe um valor valido.', true);
      if (!email) return toast('Informe o email do cliente.', true);

      resultEl.innerHTML = '<div class="loading-state">Criando checkout...</div>';
      try {
        const customerResult = await api('POST', '/api/payments/create-customer', {
          email,
          name: info.clientName,
          cellphone: info.clientPhone || undefined
        });
        const customerId = (customerResult.data && customerResult.data.id) || customerResult.id;

        const productResult = await api('POST', '/api/payments/create-product', {
          externalId: `appt-${info.appointmentId}-${Date.now()}`,
          name: `Agendamento - ${info.clientName}`,
          price: amount,
          description: `Pagamento do agendamento`
        });
        const productId = (productResult.data && productResult.data.id) || productResult.id;

        const checkoutResult = await api('POST', '/api/payments/create-checkout', {
          items: [{ id: productId, quantity: 1 }],
          customerId,
          methods: ['PIX', 'CARD'],
          returnUrl: window.location.href,
          completionUrl: window.location.href
        });
        const checkoutUrl = (checkoutResult.data && checkoutResult.data.url) || checkoutResult.url;

        resultEl.innerHTML = `
          <div style="text-align:center;">
            <p style="margin-bottom:12px;">Checkout criado com sucesso!</p>
            <a href="${escapeHtml(checkoutUrl)}" target="_blank" rel="noopener" class="btn btn-primary" style="display:inline-flex;align-items:center;gap:6px;">
              ${ICONS.globe} Abrir pagina de pagamento
            </a>
            <p style="margin-top:8px;font-size:12px;color:var(--text-muted);">O cliente sera redirecionado para o AbacatePay</p>
          </div>
        `;
      } catch (e) {
        resultEl.innerHTML = `<p style="color:#ef4444;">${escapeHtml(e.message)}</p>`;
      }
    });
  });
}

// ---------- Clientes ----------
async function renderClientesPage() {
  mainEl().innerHTML = `<div class="loading-state">Carregando...</div>`;
  let clients;
  try { clients = await api('GET', '/api/clients'); } catch (e) { return toast(e.message, true); }

  mainEl().innerHTML = `
    <div class="page-header">
      <div><h1>Clientes</h1><p>Gerencie os clientes do estabelecimento</p></div>
      <button class="btn btn-primary" id="new-client-btn">${ICONS.plus} Novo Cliente</button>
    </div>
    <div class="card">
      ${clients.length === 0 ? `<div class="empty-state">Nenhum cliente cadastrado.</div>` : `
      <table>
        <thead><tr><th>Nome</th><th>Contato</th><th>Endereco</th><th>Observacoes</th><th></th></tr></thead>
        <tbody>
          ${clients.map((c) => {
            const addressLine = clientAddressLine(c);
            const mapsLink = clientAddressMapsLink(c);
            return `
            <tr data-id="${c.id}">
              <td><div class="name-cell"><span class="avatar-dot">${ICONS.users}</span>${escapeHtml(c.name)}</div></td>
              <td>
                ${c.email ? `<div class="contact-line">${ICONS.mail}${escapeHtml(c.email)}</div>` : ''}
                ${c.phone ? `<div class="contact-line">${ICONS.phone}${escapeHtml(c.phone)}</div>` : ''}
              </td>
              <td class="cell-muted">
                ${addressLine ? `
                  <div class="address-block">
                    ${c.addressLabel ? `<div class="address-label">${escapeHtml(c.addressLabel)}</div>` : ''}
                    <div class="address-line">${escapeHtml(addressLine)}</div>
                    ${c.addressReference ? `<div class="address-line">Ref.: ${escapeHtml(c.addressReference)}</div>` : ''}
                    ${mapsLink ? `<a class="maps-link-inline" href="${mapsLink}" target="_blank" rel="noopener">${ICONS.globe} Ver no Maps</a>` : ''}
                  </div>
                ` : '&mdash;'}
              </td>
              <td class="cell-muted">${escapeHtml(c.notes) || '&mdash;'}</td>
              <td class="actions-cell">
                <button class="btn-icon edit-client" data-id="${c.id}">${ICONS.pencil}</button>
                <button class="btn-icon danger delete-client" data-id="${c.id}">${ICONS.trash}</button>
              </td>
            </tr>
          `;}).join('')}
        </tbody>
      </table>`}
    </div>
  `;
  document.getElementById('new-client-btn').addEventListener('click', () => openClientModal());
  mainEl().querySelectorAll('.edit-client').forEach((btn) => btn.addEventListener('click', () => {
    openClientModal(clients.find((c) => c.id === btn.dataset.id));
  }));
  mainEl().querySelectorAll('.delete-client').forEach((btn) => btn.addEventListener('click', async () => {
    if (!confirm('Excluir este cliente?')) return;
    try { await api('DELETE', `/api/clients/${btn.dataset.id}`); toast('Cliente excluido.'); renderClientesPage(); }
    catch (e) { toast(e.message, true); }
  }));
}

function openClientModal(client) {
  const isEdit = !!client;
  const val = (field) => (client ? escapeHtml(client[field]) : '');
  const bodyHtml = `
    <form id="client-form">
      <div class="form-field"><label>Nome *</label><input type="text" name="name" value="${val('name')}" required /></div>
      <div class="form-grid">
        <div class="form-field"><label>Email</label><input type="email" name="email" value="${val('email')}" /></div>
        <div class="form-field"><label>Telefone</label><input type="text" name="phone" value="${val('phone')}" /></div>
      </div>
      <div class="associate-divider"></div>
      <h3 style="margin:0 0 4px 0;font-size:16px;">Endereco</h3>
      <p style="color:var(--text-muted);font-size:12.5px;margin:0 0 16px 0;">Padronizado para entrega (delivery).</p>
      <div class="form-field"><label>Logradouro</label><input type="text" name="addressStreet" value="${val('addressStreet')}" placeholder="ex Rua do Ancião" /></div>
      <div class="form-grid">
        <div class="form-field"><label>Cidade</label><input type="text" name="addressCity" value="${val('addressCity')}" placeholder="ex São Paulo" /></div>
        <div class="form-field"><label>Estado</label><input type="text" name="addressState" value="${val('addressState')}" placeholder="ex SP" /></div>
      </div>
      <div class="form-grid">
        <div class="form-field"><label>Número</label><input type="text" name="addressNumber" value="${val('addressNumber')}" /></div>
        <div class="form-field"><label>Complemento</label><input type="text" name="addressComplement" value="${val('addressComplement')}" placeholder="Ex. Casa, apartamento" /></div>
      </div>
      <div class="form-grid">
        <div class="form-field"><label>Bairro</label><input type="text" name="addressDistrict" value="${val('addressDistrict')}" placeholder="ex Chácara Maria Trindade" /></div>
        <div class="form-field"><label>Ponto de referência</label><input type="text" name="addressReference" value="${val('addressReference')}" placeholder="Ex. Perto da padaria" /></div>
      </div>
      <div class="form-field"><label>Favoritar como</label><input type="text" name="addressLabel" value="${val('addressLabel')}" placeholder="Ex. Minha casa" /></div>
      <div class="form-field"><label>Observacoes</label><textarea name="notes">${val('notes')}</textarea></div>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" id="cancel-client">Cancelar</button>
        <button type="submit" class="btn btn-primary">${isEdit ? 'Salvar Alteracoes' : 'Criar Cliente'}</button>
      </div>
    </form>
  `;
  showModal(isEdit ? 'Editar Cliente' : 'Novo Cliente', bodyHtml, (overlay) => {
    overlay.querySelector('#cancel-client').addEventListener('click', closeModal);
    overlay.querySelector('#client-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const payload = {
        name: fd.get('name'),
        email: fd.get('email'),
        phone: fd.get('phone'),
        notes: fd.get('notes'),
        addressStreet: fd.get('addressStreet'),
        addressCity: fd.get('addressCity'),
        addressState: fd.get('addressState'),
        addressNumber: fd.get('addressNumber'),
        addressComplement: fd.get('addressComplement'),
        addressDistrict: fd.get('addressDistrict'),
        addressReference: fd.get('addressReference'),
        addressLabel: fd.get('addressLabel')
      };
      try {
        if (isEdit) await api('PUT', `/api/clients/${client.id}`, payload);
        else await api('POST', '/api/clients', payload);
        closeModal();
        toast(isEdit ? 'Cliente atualizado.' : 'Cliente criado.');
        renderClientesPage();
      } catch (err) { toast(err.message, true); }
    });
  });
}

// ---------- Funcionarios ----------
async function renderFuncionariosPage() {
  mainEl().innerHTML = `<div class="loading-state">Carregando...</div>`;
  let employees;
  try { employees = await api('GET', '/api/employees'); } catch (e) { return toast(e.message, true); }

  mainEl().innerHTML = `
    <div class="page-header">
      <div><h1>Funcionarios</h1><p>Gerencie a equipe do estabelecimento</p></div>
      <button class="btn btn-primary" id="new-emp-btn">${ICONS.plus} Novo Funcionario</button>
    </div>
    <div class="card">
      ${employees.length === 0 ? `<div class="empty-state">Nenhum funcionario cadastrado.</div>` : `
      <table>
        <thead><tr><th>Nome</th><th>Cargo</th><th>Contato</th><th></th></tr></thead>
        <tbody>
          ${employees.map((e) => `
            <tr data-id="${e.id}">
              <td class="cell-strong">${escapeHtml(e.name)}</td>
              <td><span class="role-badge ${e.role === 'Administrador' ? '' : 'func'}">${escapeHtml(e.role)}</span></td>
              <td>
                ${e.email ? `<div class="contact-line">${ICONS.mail}${escapeHtml(e.email)}</div>` : ''}
                ${e.phone ? `<div class="contact-line">${ICONS.phone}${escapeHtml(e.phone)}</div>` : ''}
              </td>
              <td class="actions-cell">
                <button class="btn-icon edit-emp" data-id="${e.id}">${ICONS.pencil}</button>
                <button class="btn-icon danger delete-emp" data-id="${e.id}">${ICONS.trash}</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>`}
    </div>
  `;
  document.getElementById('new-emp-btn').addEventListener('click', () => openEmployeeModal());
  mainEl().querySelectorAll('.edit-emp').forEach((btn) => btn.addEventListener('click', () => {
    openEmployeeModal(employees.find((e) => e.id === btn.dataset.id));
  }));
  mainEl().querySelectorAll('.delete-emp').forEach((btn) => btn.addEventListener('click', async () => {
    if (!confirm('Excluir este funcionario?')) return;
    try { await api('DELETE', `/api/employees/${btn.dataset.id}`); toast('Funcionario excluido.'); renderFuncionariosPage(); }
    catch (e) { toast(e.message, true); }
  }));
}

function openEmployeeModal(emp) {
  const isEdit = !!emp;
  const bodyHtml = `
    <form id="emp-form">
      <div class="form-field"><label>Nome *</label><input type="text" name="name" value="${emp ? escapeHtml(emp.name) : ''}" required /></div>
      <div class="form-field">
        <label>Cargo</label>
        <select name="role">
          <option value="Funcionario" ${emp && emp.role === 'Funcionario' ? 'selected' : ''}>Funcionario</option>
          <option value="Administrador" ${emp && emp.role === 'Administrador' ? 'selected' : ''}>Administrador</option>
        </select>
      </div>
      <div class="form-grid">
        <div class="form-field"><label>Email</label><input type="email" name="email" value="${emp ? escapeHtml(emp.email) : ''}" /></div>
        <div class="form-field"><label>Telefone</label><input type="text" name="phone" value="${emp ? escapeHtml(emp.phone) : ''}" /></div>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" id="cancel-emp">Cancelar</button>
        <button type="submit" class="btn btn-primary">${isEdit ? 'Salvar Alteracoes' : 'Criar Funcionario'}</button>
      </div>
    </form>
  `;
  showModal(isEdit ? 'Editar Funcionario' : 'Novo Funcionario', bodyHtml, (overlay) => {
    overlay.querySelector('#cancel-emp').addEventListener('click', closeModal);
    overlay.querySelector('#emp-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const payload = { name: fd.get('name'), role: fd.get('role'), email: fd.get('email'), phone: fd.get('phone') };
      try {
        if (isEdit) await api('PUT', `/api/employees/${emp.id}`, payload);
        else await api('POST', '/api/employees', payload);
        closeModal();
        toast(isEdit ? 'Funcionario atualizado.' : 'Funcionario criado.');
        renderFuncionariosPage();
      } catch (err) { toast(err.message, true); }
    });
  });
}

// ---------- Servicos ----------
async function renderServicosPage() {
  mainEl().innerHTML = `<div class="loading-state">Carregando...</div>`;
  let services;
  try { services = await api('GET', '/api/services'); } catch (e) { return toast(e.message, true); }

  mainEl().innerHTML = `
    <div class="page-header">
      <div><h1>Servicos e Produtos</h1><p>Gerencie os servicos e produtos oferecidos</p></div>
      <button class="btn btn-primary" id="new-svc-btn">${ICONS.plus} Novo Item</button>
    </div>
    ${services.length === 0 ? `<div class="card"><div class="empty-state">Nenhum item cadastrado.</div></div>` : `
    <div class="services-grid">
      ${services.map((s) => `
        <div class="service-card" data-id="${s.id}">
          ${s.photoDataUrl ? `<div class="service-img-wrap"><img src="${escapeHtml(s.photoDataUrl)}" alt="${escapeHtml(s.name)}" class="service-img"/></div>` : ''}
          <span class="category-tag">${escapeHtml(s.category || 'Geral')}</span>
          ${s.itemType === 'Produto' ? '<span class="category-tag product-tag">Produto (entrega)</span>' : ''}
          <h3>${escapeHtml(s.name)}</h3>
          <p>${escapeHtml(s.description)}</p>
          <div class="service-footer">
            <span class="service-price">${formatMoney(s.price)}</span>
            ${s.itemType === 'Produto'
              ? '<span class="service-duration">Entrega</span>'
              : `<span class="service-duration">${ICONS.clock} ${s.durationMinutes} min</span>`}
          </div>
          <div class="actions-cell service-card-actions">
            <button class="btn-icon edit-svc" data-id="${s.id}">${ICONS.pencil}</button>
            <button class="btn-icon danger delete-svc" data-id="${s.id}">${ICONS.trash}</button>
          </div>
        </div>
      `).join('')}
    </div>`}
  `;
  document.getElementById('new-svc-btn').addEventListener('click', () => openServiceModal());
  mainEl().querySelectorAll('.edit-svc').forEach((btn) => btn.addEventListener('click', () => {
    openServiceModal(services.find((s) => s.id === btn.dataset.id));
  }));
  mainEl().querySelectorAll('.delete-svc').forEach((btn) => btn.addEventListener('click', async () => {
    if (!confirm('Excluir este item?')) return;
    try { await api('DELETE', `/api/services/${btn.dataset.id}`); toast('Item excluido.'); renderServicosPage(); }
    catch (e) { toast(e.message, true); }
  }));
}

function filterLastMonth(items) {
  const now = Date.now();
  const cutoff = now - 1000 * 60 * 60 * 24 * 30;
  return items.filter((item) => {
    const d = new Date(item.closingDate || item.createdAt).getTime();
    return !isNaN(d) && d >= cutoff;
  });
}

async function renderCashClosingPage() {
  mainEl().innerHTML = `<div class="loading-state">Carregando...</div>`;
  let closings;
  try {
    closings = await api('GET', '/api/cash-closings');
  } catch (e) {
    toast(e.message, true);
    mainEl().innerHTML = `
      <div class="page-header">
        <div>
          <h1>Fechamento de Caixa</h1>
          <p>Historico de fechamento dos ultimos 30 dias. Exclua apenas quando necessario.</p>
        </div>
        <button class="btn btn-primary" id="new-cash-btn">${ICONS.plus} Novo Fechamento</button>
      </div>
      <div class="card"><div class="empty-state">Nao foi possivel carregar os dados. Verifique se voce esta autenticado e recarregue a pagina.</div></div>
    `;
    document.getElementById('new-cash-btn').addEventListener('click', () => openCashClosingModal());
    return;
  }

  const recentClosings = filterLastMonth(closings);

  mainEl().innerHTML = `
    <div class="page-header">
      <div>
        <h1>Fechamento de Caixa</h1>
        <p>Historico de fechamento dos ultimos 30 dias. Exclua apenas quando necessario.</p>
      </div>
      <button class="btn btn-primary" id="new-cash-btn">${ICONS.plus} Novo Fechamento</button>
    </div>
    <div class="card">
      ${recentClosings.length === 0 ? `<div class="empty-state">Nenhum fechamento de caixa registrado nos ultimos 30 dias.</div>` : `
      <table>
        <thead><tr><th>Titulo</th><th>Valor</th><th>Responsavel</th><th>Data</th><th>Descricao</th><th></th></tr></thead>
        <tbody>
          ${recentClosings.map((item) => `
            <tr data-id="${item.id}">
              <td class="cell-strong">${escapeHtml(item.title)}</td>
              <td class="cell-strong">${formatMoney(item.amount)}</td>
              <td class="cell-muted">${escapeHtml(item.closedBy || '—')}</td>
              <td class="cell-muted">${formatDateTime(item.closingDate)}</td>
              <td class="cell-muted">${escapeHtml(item.description || '—')}</td>
              <td class="actions-cell">
                <button class="btn-icon danger delete-closing" data-id="${item.id}">${ICONS.trash}</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>`}
    </div>
  `;

  document.getElementById('new-cash-btn').addEventListener('click', () => openCashClosingModal());
  mainEl().querySelectorAll('.delete-closing').forEach((btn) => btn.addEventListener('click', async () => {
    openPasswordConfirmationModal('Excluir este fechamento de caixa?', async (password) => {
      try {
        await api('DELETE', `/api/cash-closings/${btn.dataset.id}`, { password });
        toast('Fechamento excluido.');
        renderCashClosingPage();
      } catch (e) { toast(e.message, true); }
    });
  }));
}

function openPasswordConfirmationModal(message, onConfirm) {
  const bodyHtml = `
    <form id="password-confirm-form">
      <div class="form-field"><label>${escapeHtml(message)}</label><input type="password" name="password" required autocomplete="current-password" /></div>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" id="cancel-password">Cancelar</button>
        <button type="submit" class="btn btn-danger">Confirmar</button>
      </div>
    </form>
  `;
  showModal('Confirmacao de Exclusao', bodyHtml, (overlay) => {
    overlay.querySelector('#cancel-password').addEventListener('click', closeModal);
    overlay.querySelector('#password-confirm-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const password = fd.get('password');
      if (!password) {
        return toast('Senha obrigatoria.', true);
      }
      try {
        await onConfirm(password);
        closeModal();
      } catch (err) {
        toast(err.message, true);
      }
    });
  });
}

function openCashClosingModal() {
  const bodyHtml = `
    <form id="cash-form">
      <div class="form-field"><label>Titulo *</label><input type="text" name="title" required /></div>
      <div class="form-field">
        <label>Valor *</label>
        <div style="display:flex; gap:8px; align-items:flex-end;">
          <input type="number" step="0.01" name="amount" required style="flex:1;" />
          <button type="button" class="btn btn-secondary" id="fetch-total-btn" style="height:38px; white-space:nowrap;">${ICONS.dollar} Buscar Total Concluídos</button>
        </div>
      </div>
      <div class="form-field"><label>Responsavel</label><input type="text" name="closedBy" /></div>
      <div class="form-field"><label>Data do Fechamento</label><input type="datetime-local" name="closingDate" value="${toDateTimeLocalValue(new Date().toISOString())}" /></div>
      <div class="form-field"><label>Descricao</label><textarea name="description"></textarea></div>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" id="cancel-cash">Cancelar</button>
        <button type="submit" class="btn btn-primary">Salvar Fechamento</button>
      </div>
    </form>
  `;
  showModal('Registrar Fechamento de Caixa', bodyHtml, (overlay) => {
    overlay.querySelector('#cancel-cash').addEventListener('click', closeModal);
    overlay.querySelector('#fetch-total-btn').addEventListener('click', async () => {
      const btn = overlay.querySelector('#fetch-total-btn');
      const amountInput = overlay.querySelector('input[name="amount"]');
      btn.disabled = true;
      btn.textContent = 'Buscando...';
      try {
        const res = await api('GET', '/api/cash-closings/completed-orders-total');
        amountInput.value = res.total.toFixed(2);
        toast(`${res.count} pedidos concluidos - Total: ${formatMoney(res.total)}`);
      } catch (err) {
        toast(err.message, true);
      } finally {
        btn.disabled = false;
        btn.innerHTML = `${ICONS.dollar} Buscar Total Concluídos`;
      }
    });
    overlay.querySelector('#cash-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const payload = {
        title: fd.get('title'),
        amount: fd.get('amount'),
        closedBy: fd.get('closedBy'),
        closingDate: fd.get('closingDate'),
        description: fd.get('description')
      };
      try {
        await api('POST', '/api/cash-closings', payload);
        closeModal();
        toast('Fechamento salvo.');
        renderCashClosingPage();
      } catch (err) { toast(err.message, true); }
    });
  });
}

function openServiceModal(svc) {
  const isEdit = !!svc;
  const defaultItemType = isEdit
    ? (svc?.itemType === 'Produto' ? 'Produto' : 'Servico')
    : (currentEstablishment && currentEstablishment.niche === 'Pizzaria' ? 'Produto' : 'Servico');
  const isProduct = defaultItemType === 'Produto';
  let photoDataUrl = svc?.photoDataUrl || '';
  const bodyHtml = `
    <form id="svc-form">
      <div class="logo-upload-row">
        <div class="logo-preview" id="svc-logo-preview">${photoDataUrl ? `<img src="${photoDataUrl}"/>` : ICONS.scissors}</div>
        <label class="btn btn-secondary file-label">
          ${ICONS.upload} Carregar foto
          <input type="file" accept="image/*" id="svc-logo-input" class="file-input-hidden" />
        </label>
      </div>
      <div class="form-grid">
        <div class="form-field">
          <label>Tipo *</label>
          <select name="itemType" id="svc-type-select">
            <option value="Servico" ${isProduct ? '' : 'selected'}>Serviço (agendamento)</option>
            <option value="Produto" ${isProduct ? 'selected' : ''}>Produto (entrega)</option>
          </select>
        </div>
        <div class="form-field"><label>Categoria</label><input type="text" name="category" placeholder="Ex: Cabelo, Barba..." value="${svc ? escapeHtml(svc.category) : ''}" /></div>
      </div>
      <div class="form-field"><label>Nome *</label><input type="text" name="name" value="${svc ? escapeHtml(svc.name) : ''}" required /></div>
      <div class="form-field"><label>Descricao</label><textarea name="description">${svc ? escapeHtml(svc.description) : ''}</textarea></div>
      <div class="form-grid">
        <div class="form-field"><label>Preco (R$)</label><input type="number" step="0.01" name="price" value="${svc ? svc.price : ''}" /></div>
        <div class="form-field" id="svc-duration-field"><label>Duracao (min) <span class="optional">(opcional)</span></label><input type="number" name="durationMinutes" value="${svc ? svc.durationMinutes : ''}" /></div>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" id="cancel-svc">Cancelar</button>
        <button type="submit" class="btn btn-primary">${isEdit ? 'Salvar Alteracoes' : 'Criar Servico'}</button>
      </div>
    </form>
  `;
  showModal(isEdit ? 'Editar Item' : 'Novo Item', bodyHtml, (overlay) => {
    overlay.querySelector('#cancel-svc').addEventListener('click', closeModal);
    const typeSelect = overlay.querySelector('#svc-type-select');
    const durationField = overlay.querySelector('#svc-duration-field');
    const syncType = () => { durationField.style.display = typeSelect.value === 'Produto' ? 'none' : ''; };
    typeSelect.addEventListener('change', syncType);
    syncType();
    overlay.querySelector('#svc-logo-input').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        compressImage(reader.result, (compressed) => {
          photoDataUrl = compressed;
          overlay.querySelector('#svc-logo-preview').innerHTML = `<img src="${photoDataUrl}"/>`;
        });
      };
      reader.readAsDataURL(file);
    });
    overlay.querySelector('#svc-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const payload = {
        itemType: fd.get('itemType'), category: fd.get('category'), name: fd.get('name'), description: fd.get('description'),
        price: fd.get('price'), durationMinutes: fd.get('durationMinutes'), photoDataUrl
      };
      try {
        if (isEdit) await api('PUT', `/api/services/${svc.id}`, payload);
        else await api('POST', '/api/services', payload);
        closeModal();
        toast(isEdit ? 'Item atualizado.' : 'Item criado.');
        renderServicosPage();
      } catch (err) { toast(err.message, true); }
    });
  });
}

// ---------- Configuracoes ----------
async function renderConfiguracoesPage() {
  // Recarrega o estabelecimento p/ pegar campos novos (theme, accentOverride, plan, themePalette).
  // Evita dados stale se a loja mudou desde o login.
  try {
    const fresh = await api('GET', '/api/establishments/current');
    if (fresh) currentEstablishment = { ...currentEstablishment, ...fresh };
    est = currentEstablishment;
  } catch (e) { /* mantem o que tem */ }
  let est = currentEstablishment;
  const portalUrl = `${location.origin}/${slugifyStoreName(est.name)}/${est.id}`;
  const DAY_NAMES = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  const hours = est.businessHours || {};
  const currentTheme = est.theme || (est.niche ? NICHE_TO_THEME_LEGACY[est.niche] : 'generico');
  const defaultTheme = est.niche ? (NICHE_TO_THEME_LEGACY[est.niche] || 'generico') : 'generico';
  const isCustomTheme = currentTheme !== defaultTheme;
  const currentAccent = est.accentOverride || null;
  const currentPlan = est.plan || 'free';
  const isPro = currentPlan === 'pro';
  const palette = Array.isArray(est.themePalette) && est.themePalette.length > 0
    ? est.themePalette
    : await (async () => { try { const r = await api('GET', `/api/establishments/themes/${encodeURIComponent(currentTheme)}/palette`); return r.palette || []; } catch (e) { return []; } })();
  // Hex atual: se accentOverride é cor livre (#RRGGBB) usa direto; senão busca na paleta.
  const currentAccentHex = /^#[0-9a-fA-F]{6}$/.test(currentAccent || '')
    ? currentAccent
    : (palette.find((p) => p.name === currentAccent)?.color || '');

  mainEl().innerHTML = `
    <div class="page-header">
      <div><h1>Configuracoes</h1><p>Gerencie as informacoes de ${escapeHtml(est.name)}</p></div>
    </div>
    <div class="settings-banner">
      <div class="brand-icon">${est.logoDataUrl ? `<img src="${est.logoDataUrl}"/>` : nicheIcon(est.niche)}</div>
      <div>
        <h2>${escapeHtml(est.name)}</h2>
        <p>
          ${escapeHtml(est.niche)} · Tema <strong>${escapeHtml(currentTheme)}</strong>
          · Plano <span class="plan-badge ${isPro ? 'plan-pro' : 'plan-free'}">${isPro ? 'PRO' : 'FREE'}</span>
          ${est.paused ? ' · <span class="paused-badge" style="color:#ef4444;font-weight:600;">' + ICONS.pause + ' Pausada</span>' : ''}
        </p>
      </div>
      ${currentUser && currentUser.role === 'admin' && (currentUser.allowedEstablishmentIds === null || currentUser.allowedEstablishmentIds === undefined) ? `
        <div style="margin-left:auto;display:flex;gap:8px;align-items:center;">
          ${est.paused
            ? `<button type="button" class="btn btn-secondary" id="btn-resume-settings" style="display:flex;align-items:center;gap:6px;">${ICONS.play} Reativar</button>`
            : `<button type="button" class="btn btn-warning" id="btn-pause-settings" style="display:flex;align-items:center;gap:6px;">${ICONS.pause} Pausar loja</button>`
          }
        </div>
      ` : ''}
    </div>
    <div class="card settings-card">
      <form id="settings-form">
        <div class="form-field"><label>Nome do Estabelecimento</label><input type="text" name="name" value="${escapeHtml(est.name)}" /></div>
        <div class="form-field"><label>Descricao</label><textarea name="description">${escapeHtml(est.description)}</textarea></div>
        <div class="form-grid">
          <div class="form-field"><label>${ICONS.phone} Telefone</label><input type="text" name="phone" value="${escapeHtml(est.phone)}" /></div>
          <div class="form-field">
            <label>Endereco</label>
            <input type="text" name="address" id="settings-address-input" value="${escapeHtml(est.address)}" placeholder="Rua, numero, cidade" />
            ${est.address ? `<a class="maps-link-inline" href="${toMapsLink(est.address)}" target="_blank" rel="noopener" title="Abrir no Google Maps">${ICONS.globe} Ver no Maps</a>` : ''}
          </div>
        </div>
        <div style="text-align:right;">
          <button type="submit" class="btn btn-primary">Salvar Alteracoes</button>
        </div>
      </form>
    </div>
    <div class="card settings-card">
      <h3 style="margin:0 0 4px 0;font-size:17px;">Aparência</h3>
      <p style="color:var(--text-muted);font-size:13px;margin:0 0 18px 0;">Personalize a identidade visual do seu site. As cores disponíveis já foram validadas para manter o acabamento premium.</p>
      <div class="appearance-row">
        <div class="appearance-label">
          <strong>Tema do site</strong>
          <span class="hint">Escolha o visual do seu portal. Livre para todos os planos.</span>
        </div>
        <div class="theme-picker">
          ${THEME_OPTIONS.map((t) => `
            <button type="button"
                    class="theme-option ${currentTheme === t.slug ? 'selected' : ''}"
                    data-theme="${t.slug}"
                    title="Tema ${escapeHtml(t.label)}">
              <span class="theme-option-name">${escapeHtml(t.label)}</span>
              <span class="theme-option-dot" data-dot-for="${t.slug}"></span>
            </button>
          `).join('')}
          <button type="button"
                  class="theme-reset ${!isCustomTheme ? 'is-default' : ''}"
                  id="theme-reset-btn"
                  title="Voltar para o tema padrão (${escapeHtml(defaultTheme)})">
            ${ICONS.rotateCw || ''} Tema padrão (${escapeHtml(defaultTheme)})
          </button>
        </div>
      </div>
      <div class="appearance-row">
        <div class="appearance-label">
          <strong>Cor de destaque</strong>
          <span class="hint">Escolha uma cor da paleta que combina com o tema ou personalize com uma cor livre.</span>
        </div>
        <div class="accent-editor">
          <div class="palette-grid" id="palette-grid">
            ${palette.length === 0 ? '<span class="hint">Paleta indisponível.</span>' : palette.map((p) => `
              <button type="button"
                      class="palette-swatch ${currentAccent === p.name ? 'selected' : ''}"
                      data-name="${escapeHtml(p.name)}"
                      data-color="${escapeHtml(p.color)}"
                      title="${escapeHtml(p.name)} (${escapeHtml(p.color)})">
                <span class="swatch-color" style="background:${escapeHtml(p.color)};"></span>
                <span class="swatch-label">${escapeHtml(p.name)}</span>
              </button>
            `).join('')}
          </div>
          <div class="custom-color-row">
            <div class="custom-color-head">
              <span class="custom-color-title">Cor livre</span>
              <span class="hint">Escolha qualquer tom — com aviso de contraste.</span>
            </div>
            <div class="custom-color-controls">
              <label class="color-input-wrap" title="Escolher cor">
                <input type="color" id="accent-custom-color" value="${escapeHtml(currentAccentHex || '#0d9488')}" />
                <span class="color-input-dot" id="accent-custom-dot" style="background:${escapeHtml(currentAccentHex || '#0d9488')};"></span>
              </label>
              <input type="text" id="accent-custom-hex" value="${escapeHtml(currentAccentHex || '#0d9488')}" placeholder="#RRGGBB" maxlength="7" spellcheck="false" />
              <button type="button" class="btn btn-secondary" id="accent-custom-apply">Aplicar</button>
            </div>
            <div class="contrast-note" id="accent-contrast-note"></div>
          </div>
        </div>
      </div>
      <div class="appearance-row">
        <div class="appearance-label">
          <strong>Pré-visualização</strong>
          <span class="hint">Veja como fica no seu portal público.</span>
        </div>
        <a href="${portalUrl}" target="_blank" rel="noopener" class="btn btn-secondary">${ICONS.globe} Abrir portal</a>
      </div>
    </div>
    <div class="card settings-card">
      <h3 style="margin:0 0 16px 0;font-size:17px;">Horario de Funcionamento</h3>
      <div id="business-hours-grid">
        ${DAY_NAMES.map((day, idx) => {
          const dayHours = hours[day] || { active: idx > 0 && idx < 6, open: '09:00', close: '18:00' };
          return `
            <div class="bh-row" data-day="${day}">
              <label class="bh-day-label">
                <input type="checkbox" class="bh-active" ${dayHours.active ? 'checked' : ''} />
                <span>${escapeHtml(day.charAt(0).toUpperCase() + day.slice(1))}</span>
              </label>
              <div class="bh-times">
                <input type="time" class="bh-open" value="${dayHours.open}" ${dayHours.active ? '' : 'disabled'} />
                <span class="bh-sep">ate</span>
                <input type="time" class="bh-close" value="${dayHours.close}" ${dayHours.active ? '' : 'disabled'} />
              </div>
            </div>
          `;
        }).join('')}
      </div>
      <div style="text-align:right;margin-top:16px;">
        <button type="button" class="btn btn-primary" id="save-hours-btn">Salvar Horarios</button>
      </div>
    </div>
    <div class="card settings-card">
      <div class="portal-row">
        <div class="portal-icon">${ICONS.globe}</div>
        <div>
          <strong>Portal do Cliente</strong>
          <p style="margin:2px 0 0 0;color:var(--text-muted);font-size:13.5px;">Compartilhe este link com seus clientes para que possam agendar e fazer pedidos online.</p>
        </div>
      </div>
      <div class="portal-link-box">
        <input type="text" readonly value="${portalUrl}" id="portal-url-input" />
        <button class="btn btn-secondary" id="open-portal-btn">${ICONS.globe} Abrir</button>
      </div>
    </div>
    <div class="card settings-card">
      <h3 style="margin:0 0 4px 0;font-size:17px;">${ICONS.creditCard} Pagamentos (PIX & Cartão)</h3>
      <p style="color:var(--text-muted);font-size:13px;margin:0 0 18px 0;">Configure o provedor de pagamentos para cobrar clientes via PIX e cartão diretamente nos agendamentos.</p>
      <form id="payment-config-form">
        <div class="form-field">
          <label>Provedor de Pagamento</label>
          <select name="provider" id="payment-provider-select">
            <option value="abacatepay">AbacatePay</option>
            <option value="mercadopago">Mercado Pago</option>
            <option value="asaas">Asaas</option>
            <option value="generic">PIX Genérico (API Própria / Outra Instituição)</option>
          </select>
        </div>
        <div class="form-field" id="provider-api-key-field">
          <label>API Key / Access Token</label>
          <input type="password" name="apiKey" id="payment-api-key-input" placeholder="Cole sua chave de API aqui" />
        </div>
        <div class="form-field" id="provider-base-url-field" style="display:none;">
          <label>URL Base da API</label>
          <input type="url" name="baseUrl" id="payment-base-url-input" placeholder="https://api.exemplo.com/v1" />
          <small>Obrigatório apenas para provedor "PIX Genérico"</small>
        </div>
        <div class="form-field" id="provider-extra-headers-field" style="display:none;">
          <label>Headers Extras (JSON)</label>
          <textarea name="extraHeaders" id="payment-extra-headers-input" placeholder='{ "X-Custom-Header": "valor" }' rows="3"></textarea>
          <small>Headers adicionais para autenticação customizada (apenas PIX Genérico)</small>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <button type="submit" class="btn btn-primary">Salvar Configuração</button>
          <button type="button" class="btn btn-secondary" id="payment-remove-btn">Remover Configuração</button>
          <span id="payment-status" style="font-size:13px;color:var(--text-muted);"></span>
        </div>
      </form>
      <p style="margin-top:12px;font-size:12px;color:var(--text-muted);">
        Provedores suportados: 
        <a href="https://abacatepay.com" target="_blank" rel="noopener">AbacatePay</a>, 
        <a href="https://mercadopago.com.br/developers" target="_blank" rel="noopener">Mercado Pago</a>, 
        <a href="https://asaas.com/documentacao-api" target="_blank" rel="noopener">Asaas</a>, 
        ou qualquer API PIX compatível (Genérico).
      </p>
    </div>
    <div class="card settings-card">
      <div class="page-header" style="align-items:flex-start;gap:12px;flex-wrap:wrap;">
        <div><h2>Cupons de Desconto</h2><p>Crie cupons para oferecer descontos percentuais ou fixos no portal do cliente</p></div>
        <button class="btn btn-primary" id="new-coupon-btn">${ICONS.plus} Novo Cupom</button>
      </div>
      <div id="coupons-table-container"><div class="loading-state">Carregando cupons...</div></div>
    </div>
    ${currentUser && currentUser.role === 'admin' ? `
    <div class="card settings-card">
      <div class="page-header" style="align-items:flex-start;gap:12px;flex-wrap:wrap;">
        <div><h2>Usuarios do Estabelecimento</h2><p>Gerencie contas de acesso para este tenant</p></div>
        <button class="btn btn-primary" id="new-user-btn">${ICONS.plus} Novo Usuario</button>
      </div>
      <div id="users-table-container"><div class="loading-state">Carregando usuarios...</div></div>
    </div>
    ` : ''}
  `;
  document.getElementById('open-portal-btn').addEventListener('click', () => window.open(portalUrl, '_blank'));
  
  // Load payment providers for select
  loadPaymentProviders();
  
  // Load payment config
  loadPaymentConfig();

  document.getElementById('payment-config-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const provider = fd.get('provider');
    const apiKey = fd.get('apiKey');
    const baseUrl = fd.get('baseUrl');
    const extraHeaders = fd.get('extraHeaders');
    
    if (!apiKey) return toast('Informe a chave da API.', true);
    if (provider === 'generic' && !baseUrl) return toast('URL base é obrigatória para provedor genérico.', true);
    
    try {
      const payload = { provider, apiKey };
      if (provider === 'generic') {
        payload.baseUrl = baseUrl;
        if (extraHeaders) payload.extraHeaders = extraHeaders;
      }
      await api('PUT', '/api/payments/config', payload);
      toast('Configuração de pagamento salva.');
      loadPaymentConfig();
      document.getElementById('payment-api-key-input').value = '';
    } catch (err) { toast(err.message, true); }
  });

  document.getElementById('payment-remove-btn').addEventListener('click', async () => {
    if (!confirm('Remover a configuração de pagamento? O pagamento PIX/cartão será desativado no portal.')) return;
    try {
      await api('DELETE', '/api/payments/config');
      toast('Configuração removida.');
      loadPaymentConfig();
      document.getElementById('payment-api-key-input').value = '';
      document.getElementById('payment-base-url-input').value = '';
      document.getElementById('payment-extra-headers-input').value = '';
    } catch (err) { toast(err.message, true); }
  });

  // Provider select change handler
  document.getElementById('payment-provider-select').addEventListener('change', (e) => {
    const provider = e.target.value;
    const baseUrlField = document.getElementById('provider-base-url-field');
    const extraHeadersField = document.getElementById('provider-extra-headers-field');
    if (provider === 'generic') {
      baseUrlField.style.display = '';
      extraHeadersField.style.display = '';
    } else {
      baseUrlField.style.display = 'none';
      extraHeadersField.style.display = 'none';
    }
  });

  // Pausar / Reativar (somente admin da plataforma)
  const btnPause = document.getElementById('btn-pause-settings');
  const btnResume = document.getElementById('btn-resume-settings');
  if (btnPause) {
    btnPause.addEventListener('click', async () => {
      const ok = window.confirm(
        `Pausar "${est.name}"?\n\n` +
        `O portal publico de clientes ficara offline imediatamente, e nenhum cliente podera agendar. ` +
        `Os dados (agendamentos, clientes, servicos) nao sao apagados. ` +
        `Para reabrir, use o botao "Reativar" aqui ou no seletor de lojas.\n\n` +
        `Continuar?`
      );
      if (!ok) return;
      try {
        await api('PUT', `/api/establishments/${est.id}/pause`);
        currentEstablishment.paused = true;
        currentEstablishment.pausedAt = new Date().toISOString();
        toast('Loja "' + est.name + '" pausada. Portal publico offline.');
        renderConfiguracoesPage();
      } catch (err) { toast(err.message, true); }
    });
  }
  if (btnResume) {
    btnResume.addEventListener('click', async () => {
      try {
        await api('PUT', `/api/establishments/${est.id}/resume`);
        currentEstablishment.paused = false;
        currentEstablishment.pausedAt = null;
        toast('Loja "' + est.name + '" reativada. Portal publico volta a aceitar agendamentos.');
        renderConfiguracoesPage();
      } catch (err) { toast(err.message, true); }
    });
  }
  document.getElementById('settings-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      currentEstablishment = await api('PUT', `/api/establishments/${est.id}`, {
        name: fd.get('name'), description: fd.get('description'), phone: fd.get('phone'), address: fd.get('address')
      });
      toast('Alteracoes salvas.');
      renderAppShell();
    } catch (err) { toast(err.message, true); }
  });
  document.getElementById('save-hours-btn').addEventListener('click', saveBusinessHours);
  // Secao de usuarios so existe para admins (operadores nao a veem).
  const newUserBtn = document.getElementById('new-user-btn');
  if (newUserBtn) {
    newUserBtn.addEventListener('click', openNewUserModal);
    loadEstablishmentUsers();
  }
  document.getElementById('new-coupon-btn').addEventListener('click', openNewCouponModal);
  setupAppearanceUI();
  setupBusinessHoursUI();
  loadCoupons();
}

// ---------- Pagamentos (Provedores) ----------
async function loadPaymentProviders() {
  try {
    const res = await api('GET', '/api/payments/providers');
    const select = document.getElementById('payment-provider-select');
    if (select && res.providers) {
      const currentValue = select.value;
      select.innerHTML = res.providers.map(p => 
        `<option value="${p.id}" ${p.id === currentValue ? 'selected' : ''}>${p.name}</option>`
      ).join('');
      // Trigger change to show/hide fields
      select.dispatchEvent(new Event('change'));
    }
  } catch (err) {
    console.error('Erro ao carregar provedores de pagamento:', err);
  }
}

async function loadPaymentConfig() {
  try {
    const config = await api('GET', '/api/payments/config');
    const statusEl = document.getElementById('payment-status');
    const apiKeyInput = document.getElementById('payment-api-key-input');
    const baseUrlInput = document.getElementById('payment-base-url-input');
    const extraHeadersInput = document.getElementById('payment-extra-headers-input');
    const providerSelect = document.getElementById('payment-provider-select');
    
    if (statusEl) {
      statusEl.textContent = config.configured 
        ? `Configurado (${config.provider}) - ${config.masked}` 
        : 'Não configurado';
      statusEl.style.color = config.configured ? '#10b981' : 'var(--text-muted)';
    }
    if (providerSelect && config.provider) {
      providerSelect.value = config.provider;
      providerSelect.dispatchEvent(new Event('change'));
    }
  } catch (err) {
    console.error('Erro ao carregar config de pagamento:', err);
  }
}

// ---------- Cupons ----------
async function loadCoupons() {
  const container = document.getElementById('coupons-table-container');
  if (!container) return;
  container.innerHTML = '<div class="loading-state">Carregando cupons...</div>';
  try {
    const coupons = await api('GET', '/api/coupons');
    renderCouponsTable(coupons);
  } catch (err) {
    container.innerHTML = `<div class="empty-state">Erro ao carregar cupons: ${escapeHtml(err.message)}</div>`;
  }
}

function renderCouponsTable(coupons) {
  const container = document.getElementById('coupons-table-container');
  if (!container) return;

  if (coupons.length === 0) {
    container.innerHTML = '<div class="empty-state">Nenhum cupom cadastrado. Clique em "Novo Cupom" para criar o primeiro.</div>';
    return;
  }

  const typeLabel = { percent: 'Porcentagem (%)', fixed: 'Valor fixo (R$)' };
  const statusLabel = { active: 'Ativo', inactive: 'Inativo', expired: 'Expirado' };
  const statusClass = { active: 'pill-concluido', inactive: 'pill-cancelado', expired: 'pill-pendente' };

  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Código</th>
          <th>Tipo</th>
          <th>Valor</th>
          <th>Máx. Desconto</th>
          <th>Mín. Total</th>
          <th>Válido de</th>
          <th>Válido até</th>
          <th>Limite Usos</th>
          <th>Usos</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${coupons.map((c) => {
          const valueDisplay = c.type === 'percent' ? `${c.value}%` : formatMoney(c.value);
          const maxDiscountDisplay = c.maxDiscount ? formatMoney(c.maxDiscount) : '—';
          const minTotalDisplay = c.minTotal ? formatMoney(c.minTotal) : '—';
          const startsAt = c.startsAt ? new Date(c.startsAt).toLocaleDateString('pt-BR') : '—';
          const endsAt = c.endsAt ? new Date(c.endsAt).toLocaleDateString('pt-BR') : '—';
          const usageLimit = c.usageLimit ? c.usageLimit : 'Ilimitado';
          const usedCount = c.usedCount || 0;
          return `
            <tr data-id="${c.id}">
              <td class="cell-strong">${escapeHtml(c.code)}</td>
              <td>${typeLabel[c.type]}</td>
              <td>${valueDisplay}</td>
              <td>${maxDiscountDisplay}</td>
              <td>${minTotalDisplay}</td>
              <td>${startsAt}</td>
              <td>${endsAt}</td>
              <td>${usageLimit}</td>
              <td>${usedCount}</td>
              <td><span class="pill ${statusClass[c.status] || 'pill-pendente'}">${statusLabel[c.status]}</span></td>
              <td>
                <div class="table-actions">
                  <button type="button" class="btn-icon edit-coupon-btn" title="Editar">${ICONS.pencil}</button>
                  <button type="button" class="btn-icon delete-coupon-btn" title="Excluir">${ICONS.trash}</button>
                </div>
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;

  container.querySelectorAll('.edit-coupon-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const row = btn.closest('tr');
      const couponId = row.dataset.id;
      const coupon = coupons.find((c) => c.id === couponId);
      if (coupon) openEditCouponModal(coupon);
    });
  });

  container.querySelectorAll('.delete-coupon-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const row = btn.closest('tr');
      const couponId = row.dataset.id;
      const coupon = coupons.find((c) => c.id === couponId);
      if (!coupon) return;
      const confirmed = window.confirm(`Excluir o cupom "${coupon.code}"?`);
      if (!confirmed) return;
      try {
        await api('DELETE', `/api/coupons/${couponId}`);
        toast('Cupom excluido.');
        loadCoupons();
      } catch (err) {
        toast(err.message, true);
      }
    });
  });
}

function openNewCouponModal() {
  const servicesPromise = api('GET', '/api/services').catch(() => []);
  servicesPromise.then((services) => {
    const bodyHtml = buildCouponModalHtml(services);
    showModal('Novo Cupom', bodyHtml, (overlay) => {
      setupCouponModal(overlay, null);
    });
  });
}

function openEditCouponModal(coupon) {
  const servicesPromise = api('GET', '/api/services').catch(() => []);
  servicesPromise.then((services) => {
    const bodyHtml = buildCouponModalHtml(services, coupon);
    showModal('Editar Cupom', bodyHtml, (overlay) => {
      setupCouponModal(overlay, coupon);
    });
  });
}

function buildCouponModalHtml(services, coupon) {
  const isEdit = !!coupon;
  const typeOptions = ['percent', 'fixed'];
  const statusOptions = ['active', 'inactive'];
  const serviceOptions = services.map((s) => `<option value="${s.id}">${escapeHtml(s.name)} (${formatMoney(s.price)})</option>`).join('');

  return `
    <form id="coupon-form">
      <div class="form-grid">
        <div class="form-field">
          <label>Código *</label>
          <input type="text" name="code" value="${escapeHtml(coupon?.code || '')}" ${isEdit ? 'readonly' : ''} placeholder="EX: VERAO20" style="text-transform:uppercase;" />
          <small>Use apenas letras maiúsculas, números, _ e -</small>
        </div>
        <div class="form-field">
          <label>Tipo *</label>
          <select name="type">
            ${typeOptions.map((t) => `<option value="${t}" ${coupon?.type === t ? 'selected' : ''}>${t === 'percent' ? 'Porcentagem (%)' : 'Valor fixo (R$)'}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-grid">
        <div class="form-field">
          <label>Valor *</label>
          <input type="number" name="value" step="0.01" min="0.01" value="${coupon?.value || ''}" required placeholder="${coupon?.type === 'percent' ? 'Ex: 10 para 10%' : 'Ex: 25.00 para R$ 25,00'}" />
        </div>
        <div class="form-field">
          <label>Máx. Desconto (opcional)</label>
          <input type="number" name="maxDiscount" step="0.01" min="0" value="${coupon?.maxDiscount || ''}" placeholder="Apenas para % - ex: 50.00" />
        </div>
      </div>
      <div class="form-grid">
        <div class="form-field">
          <label>Mín. Total (opcional)</label>
          <input type="number" name="minTotal" step="0.01" min="0" value="${coupon?.minTotal || ''}" placeholder="Ex: 100.00" />
        </div>
        <div class="form-field">
          <label>Status</label>
          <select name="status">
            ${statusOptions.map((s) => `<option value="${s}" ${coupon?.status === s ? 'selected' : ''}>${s === 'active' ? 'Ativo' : 'Inativo'}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-grid">
        <div class="form-field">
          <label>Início (opcional)</label>
          <input type="datetime-local" name="startsAt" value="${coupon?.startsAt ? coupon.startsAt.substring(0, 16) : ''}" />
        </div>
        <div class="form-field">
          <label>Fim (opcional)</label>
          <input type="datetime-local" name="endsAt" value="${coupon?.endsAt ? coupon.endsAt.substring(0, 16) : ''}" />
        </div>
      </div>
      <div class="form-grid">
        <div class="form-field">
          <label>Limite de Usos (opcional)</label>
          <input type="number" name="usageLimit" min="1" value="${coupon?.usageLimit || ''}" placeholder="Deixe vazio para ilimitado" />
        </div>
      </div>
      <div class="form-field">
        <label>Serviços Aplicáveis (opcional)</label>
        <select name="applicableServices" multiple style="min-height:100px;">
          ${serviceOptions}
        </select>
        <small>Selecione quais serviços o cupom se aplica. Vazio = todos os serviços.</small>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" id="cancel-coupon">Cancelar</button>
        <button type="submit" class="btn btn-primary">${isEdit ? 'Salvar Alteracoes' : 'Criar Cupom'}</button>
      </div>
    </form>
  `;
}

function setupCouponModal(overlay, coupon) {
  const isEdit = !!coupon;
  overlay.querySelector('#cancel-coupon').addEventListener('click', closeModal);

  const typeSelect = overlay.querySelector('select[name="type"]');
  const valueInput = overlay.querySelector('input[name="value"]');
  const maxDiscountInput = overlay.querySelector('input[name="maxDiscount"]');

  if (typeSelect && valueInput) {
    typeSelect.addEventListener('change', () => {
      if (typeSelect.value === 'percent') {
        valueInput.placeholder = 'Ex: 10 para 10%';
        maxDiscountInput.style.display = '';
      } else {
        valueInput.placeholder = 'Ex: 25.00 para R$ 25,00';
        maxDiscountInput.style.display = 'none';
      }
    });
    // Trigger initial state
    typeSelect.dispatchEvent(new Event('change'));
  }

  if (coupon && coupon.applicableServices) {
    const multiSelect = overlay.querySelector('select[name="applicableServices"]');
    if (multiSelect) {
      Array.from(multiSelect.options).forEach((opt) => {
        if (coupon.applicableServices.includes(opt.value)) opt.selected = true;
      });
    }
  }

  overlay.querySelector('#coupon-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {
      code: fd.get('code').toUpperCase(),
      type: fd.get('type'),
      value: Number(fd.get('value')),
      status: fd.get('status')
    };
    if (fd.get('maxDiscount')) payload.maxDiscount = Number(fd.get('maxDiscount'));
    if (fd.get('minTotal')) payload.minTotal = Number(fd.get('minTotal'));
    if (fd.get('startsAt')) payload.startsAt = new Date(fd.get('startsAt')).toISOString();
    if (fd.get('endsAt')) payload.endsAt = new Date(fd.get('endsAt')).toISOString();
    if (fd.get('usageLimit')) payload.usageLimit = Number(fd.get('usageLimit'));
    const applicableServices = Array.from(overlay.querySelector('select[name="applicableServices"]').selectedOptions).map((o) => o.value);
    if (applicableServices.length > 0) payload.applicableServices = applicableServices;

    try {
      if (isEdit) {
        await api('PUT', `/api/coupons/${coupon.id}`, payload);
        toast('Cupom atualizado.');
      } else {
        await api('POST', '/api/coupons', payload);
        toast('Cupom criado.');
      }
      closeModal();
      loadCoupons();
    } catch (err) {
      toast(err.message, true);
    }
  });
}

// ---------- Aparência (seletor de cor de destaque) ----------
function setupAppearanceUI() {
  const paletteGrid = document.getElementById('palette-grid');
  if (paletteGrid) {
    paletteGrid.querySelectorAll('.palette-swatch').forEach((sw) => {
      sw.addEventListener('click', async () => {
        const name = sw.dataset.name;
        const color = sw.dataset.color;
        // Marca visualmente
        paletteGrid.querySelectorAll('.palette-swatch').forEach((s) => s.classList.remove('selected'));
        sw.classList.add('selected');
        // Sincroniza o picker de cor livre com a cor escolhida
        syncCustomColorUI(color);
        // Aplica no preview imediato (atualiza a CSS var --accent, etc.)
        applyAccentColor(color);
        // Persiste no backend
        try {
          currentEstablishment = await api('PUT', `/api/establishments/${currentEstablishment.id}`, { accentOverride: name });
          toast('Cor de destaque atualizada.');
        } catch (err) {
          toast(err.message, true);
          // Reverte seleção visual
          paletteGrid.querySelectorAll('.palette-swatch').forEach((s) => s.classList.remove('selected'));
          const original = currentEstablishment.accentOverride;
          if (original) paletteGrid.querySelector(`.palette-swatch[data-name="${original}"]`)?.classList.add('selected');
        }
      });
    });
  }

  // --- Cor livre ---
  const customColor = document.getElementById('accent-custom-color');
  const customHex = document.getElementById('accent-custom-hex');
  const customDot = document.getElementById('accent-custom-dot');
  const customApply = document.getElementById('accent-custom-apply');
  const contrastNote = document.getElementById('accent-contrast-note');

  function syncCustomColorUI(hex) {
    if (!hex) return;
    if (customColor) customColor.value = hex;
    if (customHex) customHex.value = hex;
    if (customDot) customDot.style.background = hex;
    updateContrastNote(hex);
  }

  function updateContrastNote(hex) {
    if (!contrastNote) return;
    const rgb = hexToRgb(hex);
    if (!rgb) { contrastNote.innerHTML = ''; contrastNote.className = 'contrast-note'; return; }
    const [r, g, b] = rgb.split(',').map(Number);
    // Luminância relativa (WCAG)
    const lum = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
    const L = 0.2126 * lum(r) + 0.7152 * lum(g) + 0.0722 * lum(b);
    const contrast = (L + 0.05) / 0.05; // vs fundo claro (#fff)
    const good = contrast >= 3;
    contrastNote.innerHTML = good
      ? 'Contraste OK para textos e botões.'
      : 'Tom claro — cuidado com contraste de texto branco. Prefira tons mais escuros.';
    contrastNote.className = 'contrast-note ' + (good ? 'ok' : 'warn');
  }

  if (customColor) {
    customColor.addEventListener('input', () => {
      syncCustomColorUI(customColor.value);
    });
  }
  if (customHex) {
    customHex.addEventListener('input', () => {
      if (customDot && /^#[0-9a-fA-F]{6}$/.test(customHex.value)) {
        customDot.style.background = customHex.value;
        updateContrastNote(customHex.value);
      }
    });
    customHex.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); customApply && customApply.click(); }
    });
  }
  if (customApply) {
    customApply.addEventListener('click', async () => {
      let hex = (customHex ? customHex.value : '').trim().toLowerCase();
      if (!/^#[0-9a-fA-F]{6}$/.test(hex)) {
        toast('Cor invalida. Use o formato #RRGGBB (ex.: #ff6b35).', true);
        return;
      }
      hex = hex.toLowerCase();
      // Desmarca seleção da paleta e marca o picker como ativo
      paletteGrid && paletteGrid.querySelectorAll('.palette-swatch').forEach((s) => s.classList.remove('selected'));
      applyAccentColor(hex);
      syncCustomColorUI(hex);
      try {
        currentEstablishment = await api('PUT', `/api/establishments/${currentEstablishment.id}`, { accentOverride: hex });
        toast('Cor de destaque personalizada aplicada.');
      } catch (err) {
        toast(err.message, true);
      }
    });
  }

  // --- Seletor de tema do site (livre para todos) ---
  const themeOptions = document.querySelectorAll('.theme-option');
  const themeResetBtn = document.getElementById('theme-reset-btn');

  function saveTheme(slug) {
    return api('PUT', `/api/establishments/${currentEstablishment.id}`, { theme: slug });
  }
  function markThemeSelected(slug) {
    themeOptions.forEach((opt) => opt.classList.toggle('selected', opt.dataset.theme === slug));
  }

  themeOptions.forEach((opt) => {
    opt.addEventListener('click', async () => {
      const slug = opt.dataset.theme;
      markThemeSelected(slug);
      try {
        currentEstablishment = await saveTheme(slug);
        applyEstablishmentTheme(currentEstablishment);
        toast('Tema atualizado.');
        // Re-renderiza p/ atualizar paleta de cores conforme o novo tema.
        renderConfiguracoesPage();
      } catch (err) {
        toast(err.message, true);
        renderConfiguracoesPage();
      }
    });
  });

  if (themeResetBtn) {
    themeResetBtn.addEventListener('click', async () => {
      // Tema padrão = derivado do nicho (pode mudar se o nicho mudou).
      const defaultSlug = (currentEstablishment && currentEstablishment.niche
        ? (NICHE_TO_THEME_LEGACY[currentEstablishment.niche] || 'generico')
        : 'generico');
      try {
        currentEstablishment = await saveTheme(defaultSlug);
        markThemeSelected(defaultSlug);
        applyEstablishmentTheme(currentEstablishment);
        toast(`Tema padrão (${defaultSlug}) restaurado.`);
      } catch (err) {
        toast(err.message, true);
      }
    });
  }

  }

function setupBusinessHoursUI() {
  const grid = document.getElementById('business-hours-grid');
  if (!grid) return;
  grid.querySelectorAll('.bh-active').forEach((cb) => {
    cb.addEventListener('change', () => {
      const row = cb.closest('.bh-row');
      const times = row.querySelectorAll('input[type="time"]');
      times.forEach((t) => t.disabled = !cb.checked);
    });
  });
}

async function saveBusinessHours() {
  const grid = document.getElementById('business-hours-grid');
  if (!grid) return;
  const DAY_NAMES = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  const businessHours = {};
  grid.querySelectorAll('.bh-row').forEach((row) => {
    const day = row.dataset.day;
    const active = row.querySelector('.bh-active').checked;
    const open = row.querySelector('.bh-open').value || '09:00';
    const close = row.querySelector('.bh-close').value || '18:00';
    businessHours[day] = { active, open, close };
  });
  try {
    currentEstablishment = await api('PUT', `/api/establishments/${currentEstablishment.id}`, { businessHours });
    toast('Horarios salvos com sucesso.');
  } catch (err) {
    toast(err.message, true);
  }
}

async function loadEstablishmentUsers() {
  const container = document.getElementById('users-table-container');
  if (!container) return;
  container.innerHTML = '<div class="loading-state">Carregando usuarios...</div>';
  try {
    const users = await api('GET', '/api/users');
    if (!users || users.length === 0) {
      container.innerHTML = '<div class="empty-state">Nenhum usuario cadastrado para este estabelecimento.</div>';
      return;
    }
    container.innerHTML = `
      <table class="mini-table">
        <thead><tr><th>Nome</th><th>Email</th><th>Perfil</th><th>2FA</th><th>Acesso</th><th></th></tr></thead>
        <tbody>
          ${users.map((user) => {
            const isGlobal = user.role === 'admin' && (user.allowedEstablishmentIds === null || user.allowedEstablishmentIds === undefined);
            const accessBadge = isGlobal
              ? '<span class="access-badge access-global" title="Acesso a todos os estabelecimentos">Global</span>'
              : '<span class="access-badge access-local" title="Acesso somente a este estabelecimento">Este estab.</span>';
            const twoFactorBadge = user.twoFactorEnabled
              ? '<span class="pill pill-concluido" style="font-size:11px;">Ativo</span>'
              : '<span class="pill pill-pendente" style="font-size:11px;">Inativo</span>';
            const canDelete = currentUser && currentUser.role === 'admin' && user.id !== currentUser.id && !isGlobal;
            const isSelf = user.id === currentUser.id;
            return `
            <tr>
              <td>${escapeHtml(user.name)}${isSelf ? ' <span class="tag">Voce</span>' : ''}</td>
              <td>${escapeHtml(user.email)}</td>
              <td><span class="role-badge ${user.role === 'admin' ? '' : 'func'}">${escapeHtml(user.role || 'operator')}</span></td>
              <td>${twoFactorBadge}</td>
              <td>${accessBadge}</td>
              <td>
                ${isSelf ? `
                  <button class="btn-icon" id="my-2fa-btn" title="Configurar meu 2FA">${ICONS.shield}</button>
                ` : canDelete ? `
                  <button class="btn-icon danger delete-user-btn" data-id="${user.id}" title="Remover deste estabelecimento">${ICONS.trash}</button>
                ` : ''}
              </td>
            </tr>
          `;
          }).join('')}
        </tbody>
      </table>
    `;
    
    // Botão do próprio usuário para configurar 2FA
    const my2faBtn = container.querySelector('#my-2fa-btn');
    if (my2faBtn) {
      my2faBtn.addEventListener('click', () => openMyTwoFactorModal());
    }
    
    container.querySelectorAll('.delete-user-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Remover este usuario do estabelecimento?')) return;
        try {
          await api('DELETE', `/api/users/${btn.dataset.id}`);
          toast('Usuario removido.');
          loadEstablishmentUsers();
        } catch (err) { toast(err.message, true); }
      });
    });
  } catch (err) {
    container.innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`;
  }
}

function openMyTwoFactorModal() {
  api('GET', '/api/2fa/status').then(status => {
    const isEnabled = status.enabled;
    const backupCount = status.backupCodesCount || 0;
    
    let bodyHtml;
    if (!isEnabled) {
      bodyHtml = `
        <div class="twofactor-setup">
          <p style="color:var(--text-muted);margin-bottom:20px;">Adicione uma camada extra de segurança à sua conta usando um autenticador (Google Authenticator, Authy, Microsoft Authenticator, etc.).</p>
          <button type="button" class="btn btn-primary" id="enable-2fa-btn">${ICONS.shield} Ativar 2FA</button>
        </div>
      `;
    } else {
      bodyHtml = `
        <div class="twofactor-enabled">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;padding:16px;background:rgba(34,197,94,0.1);border-radius:10px;border:1px solid #bbf7d0;">
            <div style="font-size:28px;">${ICONS.shield}</div>
            <div>
              <strong style="color:#15803d;">2FA Ativo</strong>
              <div style="color:var(--text-muted);font-size:13px;margin-top:2px;">Ativado em ${status.enabledAt ? new Date(status.enabledAt).toLocaleDateString('pt-BR') : 'data desconhecida'}</div>
            </div>
          </div>
          <div style="margin-bottom:16px;padding:12px;background:var(--bg-muted);border-radius:8px;">
            <strong>Códigos de backup restantes: ${backupCount}</strong>
            <div style="color:var(--text-muted);font-size:12px;margin-top:4px;">Use se perder acesso ao autenticador. Cada código funciona uma única vez.</div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button type="button" class="btn btn-secondary" id="regenerate-backup-btn">${ICONS.rotateCw} Gerar novos códigos</button>
            <button type="button" class="btn btn-warning" id="disable-2fa-btn">${ICONS.lock} Desativar 2FA</button>
          </div>
        </div>
      `;
    }
    
    showModal('Autenticação de Dois Fatores', bodyHtml, (overlay) => {
      if (!isEnabled) {
        overlay.querySelector('#enable-2fa-btn').addEventListener('click', () => {
          closeModal();
          startTwoFactorSetup();
        });
      } else {
        overlay.querySelector('#regenerate-backup-btn').addEventListener('click', () => {
          closeModal();
          regenerateBackupCodes();
        });
        overlay.querySelector('#disable-2fa-btn').addEventListener('click', () => {
          closeModal();
          disableMyTwoFactor();
        });
      }
    });
  }).catch(err => toast(err.message, true));
}

function startTwoFactorSetup() {
  api('POST', '/api/2fa/setup').then(data => {
    const bodyHtml = `
      <div class="twofactor-setup">
        <h3 style="margin:0 0 8px 0;">1. Escaneie o QR Code</h3>
        <p style="color:var(--text-muted);font-size:13px;margin-bottom:16px;">Use Google Authenticator, Authy, Microsoft Authenticator ou similar.</p>
        <div style="text-align:center;margin:20px 0;">
          <img src="${data.qrCode}" alt="QR Code 2FA" style="max-width:200px;border-radius:8px;box-shadow:var(--shadow);" />
        </div>
        <div style="margin:16px 0;padding:12px;background:var(--bg-muted);border-radius:8px;font-family:monospace;font-size:13px;word-break:break-all;">
          <strong>Chave manual:</strong> ${data.secret}
        </div>
        <h3 style="margin:20px 0 8px 0;">2. Códigos de Backup (guarde em local seguro!)</h3>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:16px;">
          ${data.backupCodes.map(code => `<code style="background:var(--bg-muted);padding:8px;border-radius:6px;font-size:13px;">${code}</code>`).join('')}
        </div>
        <p style="color:#ef4444;font-size:12px;margin-bottom:16px;">⚠️ Estes códigos aparecem apenas uma vez. Salve-os agora!</p>
        <h3 style="margin:8px 0;">3. Confirme com o código do autenticador</h3>
        <div class="form-field">
          <label>Código de 6 dígitos</label>
          <input type="text" name="totpToken" id="totp-confirm-input" required autocomplete="one-time-code" placeholder="123456" style="text-align:center;letter-spacing:4px;font-size:18px;" maxlength="6" />
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" id="cancel-2fa-setup">Cancelar</button>
          <button type="button" class="btn btn-primary" id="confirm-2fa-setup">Ativar 2FA</button>
        </div>
      </div>
    `;
    showModal('Configurar 2FA', bodyHtml, (overlay) => {
      overlay.querySelector('#cancel-2fa-setup').addEventListener('click', closeModal);
      overlay.querySelector('#confirm-2fa-setup').addEventListener('click', async () => {
        const token = overlay.querySelector('#totp-confirm-input').value.trim();
        if (!token || token.length !== 6) {
          toast('Digite o código de 6 dígitos.', true);
          return;
        }
        try {
          await api('POST', '/api/2fa/enable', { token });
          toast('Autenticação de dois fatores ativada com sucesso!');
          closeModal();
          loadEstablishmentUsers();
        } catch (err) {
          toast(err.message, true);
        }
      });
    });
  }).catch(err => toast(err.message, true));
}

function regenerateBackupCodes() {
  const bodyHtml = `
    <form id="regen-backup-form">
      <p style="color:var(--text-muted);margin-bottom:16px;">Para gerar novos códigos de backup, confirme sua senha e o código do autenticador.</p>
      <div class="form-field"><label>Senha atual</label><input type="password" name="password" required /></div>
      <div class="form-field"><label>Código do autenticador</label><input type="text" name="token" required autocomplete="one-time-code" placeholder="123456" style="text-align:center;letter-spacing:4px;font-size:18px;" maxlength="6" /></div>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" id="cancel-regen">Cancelar</button>
        <button type="submit" class="btn btn-primary">Gerar novos códigos</button>
      </div>
    </form>
  `;
  showModal('Gerar novos códigos de backup', bodyHtml, (overlay) => {
    overlay.querySelector('#cancel-regen').addEventListener('click', closeModal);
    overlay.querySelector('#regen-backup-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        const res = await api('POST', '/api/2fa/regenerate-backup-codes', {
          password: fd.get('password'),
          token: fd.get('token')
        });
        closeModal();
        const codesHtml = `
          <div class="twofactor-setup">
            <h3 style="margin:0 0 8px 0;">Novos códigos de backup gerados!</h3>
            <p style="color:var(--text-muted);font-size:13px;margin-bottom:16px;">Salve em local seguro. Os códigos anteriores foram invalidados.</p>
            <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;">
              ${res.backupCodes.map(code => `<code style="background:var(--bg-muted);padding:8px;border-radius:6px;font-size:13px;">${code}</code>`).join('')}
            </div>
            <div class="modal-actions" style="justify-content:center;margin-top:20px;">
              <button type="button" class="btn btn-primary" id="close-backup-modal">Entendi, salvei</button>
            </div>
          </div>
        `;
        showModal('Códigos de Backup', codesHtml, (o2) => {
          o2.querySelector('#close-backup-modal').addEventListener('click', closeModal);
        });
      } catch (err) {
        toast(err.message, true);
      }
    });
  });
}

function disableMyTwoFactor() {
  const bodyHtml = `
    <form id="disable-2fa-form">
      <div style="padding:16px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;margin-bottom:16px;color:#b91c1c;">
        <strong>⚠️ Atenção:</strong> Desativar 2FA remove a proteção extra da sua conta. Apenas a senha será necessária para login.
      </div>
      <p style="color:var(--text-muted);margin-bottom:16px;">Confirme sua senha e o código do autenticador para desativar.</p>
      <div class="form-field"><label>Senha atual</label><input type="password" name="password" required /></div>
      <div class="form-field"><label>Código do autenticador</label><input type="text" name="token" required autocomplete="one-time-code" placeholder="123456" style="text-align:center;letter-spacing:4px;font-size:18px;" maxlength="6" /></div>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" id="cancel-disable">Cancelar</button>
        <button type="submit" class="btn btn-danger">Desativar 2FA</button>
      </div>
    </form>
  `;
  showModal('Desativar 2FA', bodyHtml, (overlay) => {
    overlay.querySelector('#cancel-disable').addEventListener('click', closeModal);
    overlay.querySelector('#disable-2fa-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await api('POST', '/api/2fa/disable', {
          password: fd.get('password'),
          token: fd.get('token')
        });
        toast('Autenticação de dois fatores desativada.');
        closeModal();
        loadEstablishmentUsers();
      } catch (err) {
        toast(err.message, true);
      }
    });
  });
}

function openNewUserModal() {
  // So o admin da plataforma pode conceder perfil Administrador.
  const roleOptions = isGlobalAdmin(currentUser)
    ? `<option value="operator" selected>Operador</option>
       <option value="admin">Administrador</option>`
    : `<option value="operator" selected>Operador</option>`;
  const bodyHtml = `
    <form id="new-user-form">
      <div class="form-field"><label>Nome *</label><input type="text" name="name" required /></div>
      <div class="form-field"><label>Email *</label><input type="email" name="email" required /></div>
      <div class="form-field"><label>Senha *</label><input type="password" name="password" required /></div>
      <div class="form-field"><label>Perfil</label>
        <select name="role">
          ${roleOptions}
        </select>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" id="cancel-new-user">Cancelar</button>
        <button type="submit" class="btn btn-primary">Criar Usuario</button>
      </div>
    </form>
  `;
  showModal('Novo Usuario', bodyHtml, (overlay) => {
    overlay.querySelector('#cancel-new-user').addEventListener('click', closeModal);
    overlay.querySelector('#new-user-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await api('POST', `/api/users/by-establishment/${currentEstablishment.id}`, {
          name: fd.get('name'),
          email: fd.get('email'),
          password: fd.get('password'),
          role: fd.get('role')
        });
        closeModal();
        toast('Usuario criado com sucesso.');
        loadEstablishmentUsers();
      } catch (err) {
        toast(err.message, true);
      }
    });
  });
}

// ================= Pagina de Backups (site inteiro em .zip) =================
function formatFileSize(bytes) {
  const n = Number(bytes) || 0;
  if (n >= 1024 * 1024 * 1024) return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  if (n >= 1024 * 1024) return (n / (1024 * 1024)).toFixed(2) + ' MB';
  if (n >= 1024) return (n / 1024).toFixed(1) + ' KB';
  return n + ' B';
}

const BACKUP_TYPE_LABEL = { manual: 'Manual', auto: 'Automatico', 'pre-restore': 'Pre-restauro', upload: 'Enviado' };
let backupConfigCache = null;
const BACKUP_INTERVAL_OPTIONS = [1, 2, 4, 6, 12, 24, 48];

async function uploadBackupFile(file) {
  const csrfToken = getCsrfToken();
  const res = await fetch('/api/backups/upload', {
    method: 'POST',
    credentials: 'same-origin',
    headers: Object.assign({ 'Content-Type': 'application/zip' }, csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
    body: file
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error((data && data.error) || 'Falha no envio.');
  return data;
}

// Barra de acoes exibida apos escolher um arquivo no seletor:
// [Enviar e Restaurar] [Somente Enviar] [Cancelar]
function renderUploadStrip(file) {
  const strip = document.getElementById('backup-upload-strip');
  if (!strip) return;
  if (!file) { strip.innerHTML = ''; return; }
  if (!/\.zip$/i.test(file.name)) {
    strip.innerHTML = '';
    return toast('Selecione um arquivo .zip de backup.', true);
  }
  strip.innerHTML = `
    <div class="card settings-card" style="border:2px dashed var(--accent,#6366f1); display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
      <strong>${escapeHtml(file.name)}</strong>
      <span class="cell-muted">${formatFileSize(file.size)}</span>
      <button class="btn btn-primary" id="upload-restore-btn">${ICONS.rotateCw} Enviar e Restaurar</button>
      <button class="btn btn-secondary" id="upload-only-btn">${ICONS.upload} Somente Enviar</button>
      <button class="btn btn-secondary" id="upload-cancel-btn">${ICONS.close} Cancelar</button>
    </div>
  `;
  document.getElementById('upload-cancel-btn').addEventListener('click', () => renderUploadStrip(null));
  document.getElementById('upload-only-btn').addEventListener('click', async (e) => {
    e.currentTarget.disabled = true;
    try {
      await uploadBackupFile(file);
      toast(`Backup "${file.name}" recebido e adicionado a lista.`);
    } catch (err) {
      toast(err.message, true);
    }
    renderUploadStrip(null);
    loadBackupsList();
  });
  document.getElementById('upload-restore-btn').addEventListener('click', async (e) => {
    e.currentTarget.disabled = true;
    try {
      const data = await uploadBackupFile(file);
      await api('POST', `/api/backups/${encodeURIComponent(data.filename)}/restore`);
      toast(`"${file.name}" enviado e restaurado! Reinicie o servidor para aplicar todo o codigo restaurado.`);
    } catch (err) {
      toast(err.message, true);
    }
    renderUploadStrip(null);
    loadBackupsList();
  });
}

function renderBackupsControls() {
  const statusEl = document.getElementById('backups-status');
  if (!statusEl || !backupConfigCache) return;
  const cfg = backupConfigCache;
  const options = [...new Set([...BACKUP_INTERVAL_OPTIONS, cfg.intervalHours])].sort((a, b) => a - b);
  statusEl.innerHTML = `
    <span class="pill ${cfg.autoEnabled ? 'pill-concluido' : 'pill-pendente'}">${cfg.autoEnabled ? `${ICONS.clock} Automatico a cada ${cfg.intervalHours}h` : `${ICONS.pause} Automatico PAUSADO`}</span>
    <label style="display:flex;align-items:center;gap:6px;">Intervalo
      <select id="backup-interval-select" class="form-input" style="width:auto;padding:4px 8px;">
        ${options.map((h) => `<option value="${h}" ${h === cfg.intervalHours ? 'selected' : ''}>${h >= 24 ? (h / 24) + ' dia(s)' : h + ' h'}</option>`).join('')}
      </select>
    </label>
    <button class="btn btn-secondary" id="backup-save-settings">Salvar</button>
    <button class="btn ${cfg.autoEnabled ? 'btn-danger' : 'btn-primary'}" id="backup-toggle-auto">${cfg.autoEnabled ? ICONS.pause : ICONS.play} ${cfg.autoEnabled ? 'Pausar Automatico' : 'Reativar Automatico'}</button>
    <span class="cell-muted">Retencao automatica: ate ${cfg.maxFiles} backups &middot; Total: <strong id="backups-total-label">${formatFileSize(0)}</strong></span>
  `;

  document.getElementById('backup-save-settings').addEventListener('click', async () => {
    const hours = Number(document.getElementById('backup-interval-select').value);
    try {
      await api('PUT', '/api/backups/settings', { intervalHours: hours });
      toast(`Backup automatico configurado para rodar a cada ${hours}h.`);
    } catch (err) { toast(err.message, true); }
    loadBackupsList();
  });

  document.getElementById('backup-toggle-auto').addEventListener('click', async () => {
    const novoEstado = !backupConfigCache.autoEnabled;
    try {
      await api('PUT', '/api/backups/settings', { autoEnabled: novoEstado });
      toast(novoEstado ? 'Backup automatico reativado.' : 'Backup automatico pausado. Voce ainda pode criar backups manuais.');
    } catch (err) { toast(err.message, true); }
    loadBackupsList();
  });
}

async function loadBackupsList() {
  const container = document.getElementById('backups-list-container');
  if (!container) return;
  container.innerHTML = '<div class="loading-state">Carregando backups...</div>';
  try {
    const data = await api('GET', '/api/backups');
    backupConfigCache = data.config;
    renderBackupsControls();
    const totalLabel = document.getElementById('backups-total-label');
    if (totalLabel) totalLabel.textContent = formatFileSize(data.totalSize);
    if (!data.backups.length) {
      container.innerHTML = '<div class="empty-state">Nenhum backup ainda. Clique em "Criar Backup Agora".</div>';
      return;
    }
    container.innerHTML = `
      <div class="users-table-wrap">
        <table class="mini-table users-table">
          <thead>
            <tr>
              <th>Arquivo</th>
              <th>Tipo</th>
              <th>Tamanho</th>
              <th>Criado em</th>
              <th class="col-actions">Acoes</th>
            </tr>
          </thead>
          <tbody>
            ${data.backups.map((b) => `
              <tr>
                <td class="backup-filename" title="${escapeHtml(b.filename)}">${escapeHtml(b.filename)}</td>
                <td><span class="role-badge ${b.type === 'manual' ? '' : 'func'}">${BACKUP_TYPE_LABEL[b.type] || b.type}</span></td>
                <td>${formatFileSize(b.sizeBytes)}</td>
                <td class="cell-muted">${formatDateTime(b.createdAt)}</td>
                <td class="col-actions">
                  <div class="row-actions">
                    <button class="action-btn action-btn-blue restore-backup-btn" data-file="${escapeHtml(b.filename)}" title="Restaurar este backup">${ICONS.rotateCw}</button>
                    <a class="action-btn action-btn-violet" href="/api/backups/${encodeURIComponent(b.filename)}/download" title="Baixar .zip">${ICONS.download}</a>
                    <button class="action-btn action-btn-red delete-backup-btn" data-file="${escapeHtml(b.filename)}" title="Excluir backup">${ICONS.trash}</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    container.querySelectorAll('.restore-backup-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm(`Restaurar "${btn.dataset.file}"? Os dados e arquivos atuais serao substituidos pelo conteudo do zip (um pre-restauro sera criado automaticamente). Recomenda-se reiniciar o servidor depois.`)) return;
        btn.disabled = true;
        try {
          await api('POST', `/api/backups/${encodeURIComponent(btn.dataset.file)}/restore`);
          toast('Backup restaurado com sucesso! Reinicie o servidor para garantir que todo o codigo restaurado entre em vigor.');
        } catch (err) {
          toast(err.message, true);
        }
        btn.disabled = false;
        loadBackupsList();
      });
    });
    container.querySelectorAll('.delete-backup-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm(`Excluir o backup "${btn.dataset.file}"?`)) return;
        try {
          await api('DELETE', `/api/backups/${encodeURIComponent(btn.dataset.file)}`);
          toast('Backup excluido.');
        } catch (err) {
          toast(err.message, true);
        }
        loadBackupsList();
      });
    });
  } catch (err) {
    container.innerHTML = `<div class="empty-state">${escapeHtml(err.message)}</div>`;
  }
}

async function renderBackupsPage() {
  // Backups sao da plataforma inteira: so admin global.
  if (!isGlobalAdmin(currentUser)) {
    return renderSelector();
  }
  const isGlobal = !currentEstablishment;
  let targetContainer;

  if (isGlobal) {
    root.innerHTML = `
      <div class="selector-screen" style="max-width:1000px; padding:20px; margin:0 auto;">
        <div style="margin-bottom:20px;">
          <a href="#" class="btn btn-secondary" style="text-decoration:none;">${ICONS.arrowLeft} Voltar para Seleção</a>
        </div>
        <div id="global-backups-content"></div>
      </div>
    `;
    targetContainer = document.getElementById('global-backups-content');
  } else {
    mainEl().innerHTML = `<div id="global-backups-content"></div>`;
    targetContainer = document.getElementById('global-backups-content');
  }

  targetContainer.innerHTML = `
    <div class="page-header">
      <div>
        <h1>${ICONS.archive} Backups</h1>
        <p>Site inteiro (.zip): codigo, configuracoes e banco de dados</p>
      </div>
      <button class="btn btn-secondary" id="upload-backup-btn">${ICONS.upload} Enviar Backup (.zip)</button>
      <button class="btn btn-primary" id="create-backup-btn">${ICONS.archive} Criar Backup Agora</button>
    </div>
    <div id="backup-upload-strip"></div>
    <div class="card settings-card" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
      <div id="backups-status" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;"><span class="cell-muted">Carregando status...</span></div>
    </div>
    <div class="hint-box">O backup automatico roda sozinho no intervalo escolhido e mantem os mais recentes — use "Pausar" para interromper (os backups manuais continuam disponiveis). Pode tambem ENVIAR um .zip de backup salvo em outro lugar e restaura-lo aqui. Restaurar substitui os arquivos atuais pelos do zip: um "Pre-restauro" e criado automaticamente antes, e reiniciar o servidor depois garante que o codigo restaurado entre em vigor.</div>
    <div class="card settings-card" id="backups-list-container"></div>
  `;

  // Seletor de arquivo criado via JS e escondido por CSSOM (nao depende de
  // style inline no HTML) — evita o input visivel "Nenhum arquivo escolhido".
  document.getElementById('upload-backup-btn').addEventListener('click', () => {
    let picker = document.getElementById('backup-file-picker');
    if (!picker) {
      picker = document.createElement('input');
      picker.type = 'file';
      picker.accept = '.zip,application/zip';
      picker.id = 'backup-file-picker';
      picker.style.display = 'none';
      document.body.appendChild(picker);
    }
    picker.onchange = () => {
      const file = picker.files && picker.files[0];
      picker.value = '';
      renderUploadStrip(file || null);
    };
    picker.click();
  });

  const createBtn = document.getElementById('create-backup-btn');
  createBtn.addEventListener('click', async () => {
    createBtn.disabled = true;
    createBtn.innerHTML = `${ICONS.archive} Criando...`;
    try {
      await api('POST', '/api/backups');
      toast('Backup criado com sucesso!');
    } catch (err) {
      toast(err.message, true);
    }
    createBtn.disabled = false;
    createBtn.innerHTML = `${ICONS.archive} Criar Backup Agora`;
    loadBackupsList();
  });

  loadBackupsList();
}

// ================= Central de Manutencao (sala de maquinas) =================
// Pagina separada, so para o admin da plataforma: tudo que e operacao em um
// so lugar, com explicacao em cada card. Nada aqui quebra nada sozinho:
// toda acao destrutiva pede confirmacao antes.
function formatUptime(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}min`;
  if (m > 0) return `${m}min`;
  return `${s}s`;
}

function copyCmd(text, btn) {
  const done = () => {
    const original = btn.innerHTML;
    btn.innerHTML = 'Copiado!';
    setTimeout(() => { btn.innerHTML = original; }, 1500);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => toast('Nao foi possivel copiar.', true));
  } else {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); } catch (e) { toast('Nao foi possivel copiar.', true); }
    document.body.removeChild(ta);
  }
}

// ================= Workflow visual da Manutencao (estilo n8n) =================
// Monta o mapa vivo Internet -> Porta -> App -> Bancos a partir do status real.
// Nos arrastaveis (pointer), arestas recalculadas, zoom e clique = detalhes.
const MAINT_FLOW_W = 180;
const MAINT_FLOW_H = 68;

function maintFlowColor(kind) {
  return { net: '#38bdf8', entry: '#a78bfa', app: '#22c55e', db: '#f59e0b', ops: '#ec4899' }[kind] || '#6366f1';
}

function maintFlowModel(st) {
  const c = st.counts || {};
  const nodes = [
    { id: 'internet', kind: 'net', title: 'Internet', sub: 'você + clientes', x: 10, y: 246,
      lines: ['De onde chegam os acessos: navegador, celular, Google.'] },
    { id: 'entry', kind: 'entry', title: 'Porta ' + st.env.port, sub: st.env.port === 80 ? 'HTTP sem :porta' : 'acesso com :' + st.env.port, x: 228, y: 246,
      lines: ['Porta onde o sistema escuta.', st.env.port === 80 ? 'Na VPS com Nginx, ele repassa para o App.' : 'Local: abra http://localhost:' + st.env.port] },
    { id: 'app', kind: 'app', title: 'App Node v' + st.version, sub: 'no ar há ' + formatUptime(st.uptimeSeconds), x: 446, y: 246,
      lines: ['Processo Node ' + st.node + ' (' + st.platform + ').', 'Memória heap: ' + st.memory.heapUsedMB + ' MB.', 'Ambiente: ' + st.env.nodeEnv + '.'] },
    { id: 'pg', kind: 'db', title: 'PostgreSQL', sub: (c.establishments || 0) + ' lojas · ' + (c.appointments || 0) + ' agend.', x: 664, y: 246,
      lines: ['Banco compartilhado: todas as lojas sem banco dedicado moram aqui.', 'Isolamento RLS: ' + (st.env.rlsEnabled ? 'ATIVO (segunda barreira no banco).' : 'DESLIGADO — só em diagnóstico.')] },
    { id: 'backups', kind: 'ops', title: 'Backups .zip', sub: st.backups.total + ' guardados', x: 446, y: 60,
      lines: ['Cópia do site inteiro (código + banco).', st.backups.autoEnabled ? 'Automático a cada ' + st.backups.intervalHours + 'h.' : 'Automático PAUSADO — crie manualmente.',
        st.backups.latest ? 'Último: ' + st.backups.latest.filename : 'Nenhum backup ainda.'] }
  ];
  const edges = [
    { from: 'internet', fa: 'R', to: 'entry', ta: 'L', label: ':' + st.env.port },
    { from: 'entry', fa: 'R', to: 'app', ta: 'L', label: 'localhost:' + st.env.port },
    { from: 'app', fa: 'R', to: 'pg', ta: 'L', label: 'DATABASE_URL · RLS' },
    { from: 'app', fa: 'T', to: 'backups', ta: 'B', label: 'zip' }
  ];
  // Uma coluna de bancos dedicados abaixo (até 3 por linha).
  const dedicated = (st.tenants || []).filter((t) => t.dedicated);
  dedicated.forEach((t, i) => {
    const col = i % 3;
    nodes.push({
      id: 'db-' + t.establishmentId, kind: 'db', title: t.name, sub: (t.dbName || 'dedicado') + ' · ' + t.appointments + ' agend.',
      x: 300 + col * 220, y: 430 + Math.floor(i / 3) * 100, tenantId: t.establishmentId,
      lines: ['Banco exclusivo desta loja (isolamento físico).', 'Nome no servidor: ' + (t.dbName || '?') + '.', 'Agendamentos: ' + t.appointments + '.']
    });
    edges.push({ from: 'app', fa: 'B', to: 'db-' + t.establishmentId, ta: 'T', label: 'dedicado' });
  });
  return { nodes, edges, height: dedicated.length ? 430 + Math.ceil(dedicated.length / 3) * 100 + 20 : 400 };
}

function maintFlowAnchor(n, side) {
  if (side === 'L') return [n.x, n.y + MAINT_FLOW_H / 2];
  if (side === 'R') return [n.x + MAINT_FLOW_W, n.y + MAINT_FLOW_H / 2];
  if (side === 'T') return [n.x + MAINT_FLOW_W / 2, n.y];
  return [n.x + MAINT_FLOW_W / 2, n.y + MAINT_FLOW_H];
}

function maintFlowEdgeD(byId, e) {
  const a = byId[e.from];
  const b = byId[e.to];
  const p1 = maintFlowAnchor(a, e.fa);
  const p2 = maintFlowAnchor(b, e.ta);
  const horiz = (e.fa === 'L' || e.fa === 'R') && (e.ta === 'L' || e.ta === 'R');
  const dx = horiz ? Math.max(30, Math.abs(p2[0] - p1[0]) / 2) : 0;
  const dy = horiz ? 0 : Math.max(30, Math.abs(p2[1] - p1[1]) / 2);
  return `M ${p1[0]} ${p1[1]} C ${p1[0] + dx} ${p1[1] + dy}, ${p2[0] - dx} ${p2[1] - dy}, ${p2[0]} ${p2[1]}`;
}

function maintFlowNodeSvg(n) {
  const color = maintFlowColor(n.kind);
  return `<g class="mnode" data-node="${n.id}" transform="translate(${n.x},${n.y})" style="cursor:grab;user-select:none;-webkit-user-select:none;">
    <rect width="${MAINT_FLOW_W}" height="${MAINT_FLOW_H}" rx="12" style="fill:var(--card-bg);stroke:var(--border);stroke-width:1.5;filter:drop-shadow(0 2px 4px rgba(0,0,0,.15));"></rect>
    <rect x="0" y="10" width="5" height="${MAINT_FLOW_H - 20}" rx="2.5" style="fill:${color};"></rect>
    <circle cx="20" cy="22" r="5" style="fill:${color};"></circle>
    <text x="34" y="27" font-size="13" font-weight="700" style="fill:var(--text);">${escapeHtml(n.title)}</text>
    <text x="20" y="48" font-size="11" style="fill:var(--text-muted);">${escapeHtml(n.sub)}</text>
  </g>`;
}

function maintFlowEdgeSvg(byId, e, i) {
  const a = byId[e.from];
  const b = byId[e.to];
  const p1 = maintFlowAnchor(a, e.fa);
  const p2 = maintFlowAnchor(b, e.ta);
  const mx = (p1[0] + p2[0]) / 2;
  const my = (p1[1] + p2[1]) / 2;
  return `<g>
    <path id="medge-${i}" d="${maintFlowEdgeD(byId, e)}" fill="none" style="stroke:var(--text-muted);stroke-width:1.8;" marker-end="url(#marrow)"></path>
    <text x="${mx}" y="${my - 6}" font-size="11" text-anchor="middle" style="fill:var(--text-muted);paint-order:stroke;stroke:var(--card-bg);stroke-width:4px;">${escapeHtml(e.label)}</text>
  </g>`;
}

function maintFlowRender(svg, model) {
  const byId = {};
  model.nodes.forEach((n) => { byId[n.id] = n; });
  svg.setAttribute('viewBox', `0 0 1040 ${model.height}`);
  svg.innerHTML = `<defs>
      <marker id="marrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0 0L10 5L0 10z" style="fill:var(--text-muted);"></path>
      </marker>
    </defs>`
    + model.edges.map((e, i) => maintFlowEdgeSvg(byId, e, i)).join('')
    + model.nodes.map(maintFlowNodeSvg).join('');
  return byId;
}

function maintFlowDetailHtml(n, st) {
  const rows = (n.lines || []).map((l) => `<div>· ${escapeHtml(l)}</div>`).join('');
  let actions = '';
  if (n.id === 'backups') {
    actions = `<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">
      <button class="btn btn-primary" data-flow="backup-now">Criar backup agora</button>
      <a href="#/backups" class="btn btn-secondary" style="text-decoration:none;">Abrir backups</a></div>`;
  } else if (n.id === 'app') {
    actions = `<div style="margin-top:10px;"><button class="btn btn-secondary" data-flow="restart">Reiniciar serviço</button></div>`;
  } else if (n.tenantId) {
    actions = `<div style="margin-top:10px;"><button class="btn btn-secondary" data-flow="moveback" data-id="${n.tenantId}">Voltar ao compartilhado</button></div>`;
  } else if (n.id === 'pg') {
    const shared = (st.tenants || []).filter((t) => !t.dedicated);
    actions = shared.length
      ? `<div style="margin-top:10px;" class="cell-muted">Para isolar uma loja, use a tabela "Bancos das lojas" abaixo.</div>`
      : `<div style="margin-top:10px;" class="cell-muted">Nenhuma loja no compartilhado.</div>`;
  }
  return `<strong>${escapeHtml(n.title)}</strong> <span class="cell-muted">— ${escapeHtml(n.sub)}</span><div class="cell-muted" style="margin-top:6px;">${rows}</div>${actions}`;
}

// Liga arrastar, clique-detalhe e zoom no svg do workflow.
function maintFlowBind(svg, detailEl, model, st) {
  let byId = maintFlowRender(svg, model);
  let drag = null;

  const pt = (evt) => {
    const p = svg.createSVGPoint();
    p.x = evt.clientX;
    p.y = evt.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };

  svg.addEventListener('pointerdown', (evt) => {
    const g = evt.target.closest('.mnode');
    if (!g) return;
    const n = byId[g.dataset.node];
    if (!n) return;
    const m = pt(evt);
    drag = { n, g, dx: m.x - n.x, dy: m.y - n.y, moved: false, sx: evt.clientX, sy: evt.clientY };
    svg.style.cursor = 'grabbing';
    svg.setPointerCapture(evt.pointerId);
  });
  svg.addEventListener('pointermove', (evt) => {
    if (!drag) return;
    if (Math.hypot(evt.clientX - drag.sx, evt.clientY - drag.sy) > 5) drag.moved = true;
    if (!drag.moved) return;
    const m = pt(evt);
    drag.n.x = Math.max(0, Math.min(1040 - MAINT_FLOW_W, m.x - drag.dx));
    drag.n.y = Math.max(0, m.y - drag.dy);
    drag.g.setAttribute('transform', `translate(${drag.n.x},${drag.n.y})`);
    model.edges.forEach((e, i) => {
      const path = svg.querySelector('#medge-' + i);
      if (path) path.setAttribute('d', maintFlowEdgeD(byId, e));
    });
  });
  const endDrag = (evt) => {
    if (!drag) return;
    const wasClick = !drag.moved;
    const n = drag.n;
    drag = null;
    svg.style.cursor = 'grab';
    if (wasClick) {
      detailEl.innerHTML = maintFlowDetailHtml(n, st);
      maintFlowBindDetail(detailEl);
    }
  };
  svg.addEventListener('pointerup', endDrag);
  svg.addEventListener('pointercancel', () => { drag = null; svg.style.cursor = 'grab'; });

  // Zoom (0.6x–1.6x) em torno do centro.
  let zoom = 1;
  const applyZoom = () => {
    const w = 1040 / zoom;
    const h = model.height / zoom;
    svg.setAttribute('viewBox', `${(1040 - w) / 2} ${(model.height - h) / 2} ${w} ${h}`);
  };
  document.getElementById('flow-zoom-in').addEventListener('click', () => { zoom = Math.min(1.6, +(zoom + 0.2).toFixed(2)); applyZoom(); });
  document.getElementById('flow-zoom-out').addEventListener('click', () => { zoom = Math.max(0.6, +(zoom - 0.2).toFixed(2)); applyZoom(); });
  document.getElementById('flow-zoom-reset').addEventListener('click', () => { zoom = 1; applyZoom(); });
}

// Botoes dentro do painel de detalhes do no clicado.
function maintFlowBindDetail(detailEl) {
  const backupBtn = detailEl.querySelector('[data-flow="backup-now"]');
  if (backupBtn) backupBtn.addEventListener('click', async () => {
    backupBtn.disabled = true;
    try {
      await api('POST', '/api/backups');
      toast('Backup criado com sucesso!');
      renderManutencaoPage();
    } catch (err) { toast(err.message, true); backupBtn.disabled = false; }
  });
  const restartBtn = detailEl.querySelector('[data-flow="restart"]');
  if (restartBtn) restartBtn.addEventListener('click', async () => {
    if (!window.confirm('Reiniciar o servidor agora?\n\nNa VPS ele sobe sozinho. No Windows, reabra o run-server.bat.')) return;
    restartBtn.disabled = true;
    try {
      const r = await api('POST', '/api/maintenance/restart', {});
      toast(r.message);
    } catch (err) { toast('Servidor reiniciando... aguarde e recarregue a página.'); }
  });
  const backBtn = detailEl.querySelector('[data-flow="moveback"]');
  if (backBtn) backBtn.addEventListener('click', async () => {
    if (!window.confirm('Voltar esta loja ao banco COMPARTILHADO?\n\nContinuar?')) return;
    backBtn.disabled = true;
    try {
      await api('POST', `/api/tenant-databases/${backBtn.dataset.id}/move-back`, {});
      toast('Loja no banco compartilhado.');
      renderManutencaoPage();
    } catch (err) { toast(err.message, true); backBtn.disabled = false; }
  });
}

async function renderManutencaoPage() {
  if (!isGlobalAdmin(currentUser)) {
    return renderSelector();
  }
  const isGlobal = !currentEstablishment;
  let targetContainer;
  if (isGlobal) {
    root.innerHTML = `
      <div class="selector-screen" style="max-width:1000px; padding:20px; margin:0 auto;">
        <div style="margin-bottom:20px;">
          <a href="#" class="btn btn-secondary" style="text-decoration:none;">${ICONS.arrowLeft} Voltar para Seleção</a>
        </div>
        <div id="global-maint-content"></div>
      </div>
    `;
    targetContainer = document.getElementById('global-maint-content');
  } else {
    mainEl().innerHTML = `<div id="global-maint-content"></div>`;
    targetContainer = document.getElementById('global-maint-content');
  }
  targetContainer.innerHTML = `<div class="loading-state">Lendo a sala de maquinas...</div>`;

  let st;
  try {
    st = await api('GET', '/api/maintenance/status');
  } catch (err) {
    targetContainer.innerHTML = `<div class="empty-state">${escapeHtml(err.message)}</div>`;
    return;
  }

  const dot = (on, label) =>
    `<span title="${escapeHtml(label)}" style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${on ? '#22c55e' : '#ef4444'};margin-right:6px;vertical-align:baseline;"></span>`;
  const tenantRows = (st.tenants || []).map((t) => `
    <tr>
      <td>${escapeHtml(t.name)}</td>
      <td>${t.dedicated
        ? `<span class="cell-muted">${ICONS.database} Dedicado <span class="cell-muted">(${escapeHtml(t.dbName || '')})</span></span>`
        : `<span class="cell-muted">Compartilhado</span>`}</td>
      <td style="text-align:right;">${t.appointments}</td>
      <td style="text-align:right;">
        ${t.dedicated
          ? `<button class="action-btn" data-maint="moveback" data-id="${t.establishmentId}" title="Voltar ao banco compartilhado">Voltar</button>`
          : `<button class="action-btn action-btn-violet" data-maint="migrate" data-id="${t.establishmentId}" title="Criar banco dedicado e migrar sozinho">Migrar</button>`}
      </td>
    </tr>`).join('');

  const vpsCmds = 'cd ~/gestor-multi-tenant\ngit pull\nsudo bash scripts/update.sh';
  const winCmds = 'bash scripts/update.sh';

  targetContainer.innerHTML = `
    <div class="page-header">
      <div>
        <h1>${ICONS.wrench} Manutenção</h1>
        <p>Sala de máquinas do sistema — tudo explicado, nada quebra sozinho</p>
      </div>
      <button class="btn btn-secondary" id="maint-refresh">${ICONS.rotateCw} Atualizar leitura</button>
    </div>

    <div class="hint-box">Como ler esta página: <strong>verde = saudável</strong>. Cada card diz <strong>o que é, para que serve e o que acontece quando você clica</strong>. Ações com efeito real sempre pedem confirmação antes.</div>

    <div class="card settings-card">
      <h3>${dot(true, 'Servidor respondendo')} Saúde do sistema</h3>
      <p class="cell-muted">Se esta página abriu, o app está no ar. Abaixo, o mapa vivo do sistema — <strong>arraste os nós, use o zoom e clique em cada um</strong> para ver detalhes e ações:</p>
      <div style="display:flex;gap:8px;align-items:center;margin:8px 0;flex-wrap:wrap;">
        <button class="btn btn-secondary" id="flow-zoom-out" title="Afastar">−</button>
        <button class="btn btn-secondary" id="flow-zoom-in" title="Aproximar">+</button>
        <button class="btn btn-secondary" id="flow-zoom-reset" title="Voltar ao tamanho normal">1:1</button>
        <span class="cell-muted">Arraste os nós para organizar · clique num nó para inspecionar</span>
      </div>
      <div style="border:1px solid var(--border);border-radius:12px;overflow:hidden;">
        <svg id="maint-flow" viewBox="0 0 1040 560" style="width:100%;height:auto;display:block;background:var(--card-bg);cursor:grab;"></svg>
      </div>
      <div id="maint-flow-detail" class="hint-box" style="margin-top:10px;">Clique em um nó do mapa para ver detalhes e ações.</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-top:8px;">
        <div><div class="cell-muted">No ar há</div><strong>${escapeHtml(formatUptime(st.uptimeSeconds))}</strong></div>
        <div><div class="cell-muted">Versão</div><strong>v${escapeHtml(st.version)}${st.gitCommit ? ' · ' + escapeHtml(st.gitCommit) : ''}</strong></div>
        <div><div class="cell-muted">Node.js</div><strong>${escapeHtml(st.node)} (${escapeHtml(st.platform)})</strong></div>
        <div><div class="cell-muted">Memória</div><strong>${st.memory.heapUsedMB} MB</strong></div>
        <div><div class="cell-muted">Ambiente</div><strong>${escapeHtml(st.env.nodeEnv)}</strong></div>
        <div><div class="cell-muted">Isolamento RLS</div><strong>${dot(st.env.rlsEnabled, 'Row-Level Security')} ${st.env.rlsEnabled ? 'Ativo' : 'DESLIGADO'}</strong></div>
      </div>
      ${!st.env.rlsEnabled ? '<div class="hint-box" style="margin-top:10px;">Atenção: o RLS (segunda barreira no banco) está desligado via RLS_ENABLED=false. Só use assim em diagnóstico emergencial.</div>' : ''}
      ${st.env.seedDemoData ? '<div class="hint-box" style="margin-top:10px;">Atenção: dados de demonstração ligados (SEED_DEMO_DATA=true). Em produção deixe false.</div>' : ''}
    </div>

    <div class="card settings-card">
      <h3>${ICONS.store} Dados guardados</h3>
      <p class="cell-muted">Quantidade de registros por tipo, somando todos os bancos (compartilhado + dedicados).</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-top:8px;">
        <div><div class="cell-muted">Lojas</div><strong>${st.counts.establishments || 0}</strong></div>
        <div><div class="cell-muted">Clientes</div><strong>${st.counts.clients || 0}</strong></div>
        <div><div class="cell-muted">Agendamentos</div><strong>${st.counts.appointments || 0}</strong></div>
        <div><div class="cell-muted">Serviços</div><strong>${st.counts.services || 0}</strong></div>
        <div><div class="cell-muted">Funcionários</div><strong>${st.counts.employees || 0}</strong></div>
        <div><div class="cell-muted">Usuários</div><strong>${st.counts.users || 0}</strong></div>
      </div>
    </div>

    <div class="card settings-card">
      <h3>${ICONS.lock} Senhas dos usuários</h3>
      <p class="cell-muted">Por segurança as senhas são guardadas como hash e <strong>não podem ser vistas</strong> — nem pelo administrador.
        Aqui você vê o <strong>status de login</strong> de cada usuário e pode <strong>definir uma nova senha</strong> para qualquer um.
        <a href="#/senhas">Abrir gerenciamento completo</a></p>
      <div id="maint-users"><div class="loading-state">Carregando usuários...</div></div>
    </div>

    <div class="card settings-card">
      <h3>${ICONS.archive} Backups</h3>
      <p class="cell-muted">Cópia do site inteiro (.zip com código + banco). O automático roda sozinho
        ${st.backups.autoEnabled ? `a cada ${st.backups.intervalHours}h` : '<strong>pausado</strong>'}
        — antes de qualquer mudança grande, crie um manual aqui.</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px;align-items:center;">
        <button class="btn btn-primary" id="maint-backup-now">${ICONS.archive} Criar backup agora</button>
        <a href="#/backups" class="btn btn-secondary" style="text-decoration:none;">Abrir página de backups</a>
        <span class="cell-muted">${st.backups.total} backup(s) guardados${st.backups.latest ? ` · último: ${escapeHtml(st.backups.latest.filename)} (${formatFileSize(st.backups.latest.sizeBytes)})` : ''}</span>
      </div>
    </div>

    <div class="card settings-card">
      <h3>${ICONS.database} Bancos das lojas ${st.dedicatedCount ? `(${st.dedicatedCount} dedicado(s))` : ''}</h3>
      <p class="cell-muted"><strong>Compartilhado:</strong> todas as lojas no mesmo banco (padrão, mais simples).
        <strong>Dedicado:</strong> a loja ganha um banco só dela — isolamento físico, ideal para loja gigante.
        <strong>Migrar</strong> cria o banco e move os dados sozinho, sem editar nada e sem reiniciar.</p>
      <div style="overflow-x:auto;margin-top:8px;">
        <table style="width:100%;border-collapse:collapse;">
          <thead><tr style="text-align:left;">
            <th>Loja</th><th>Banco</th><th style="text-align:right;">Agend.</th><th style="text-align:right;">Ação</th>
          </tr></thead>
          <tbody>${tenantRows || '<tr><td colspan="4" class="cell-muted">Nenhuma loja ainda.</td></tr>'}</tbody>
        </table>
      </div>
    </div>

    <div class="card settings-card">
      <h3>${ICONS.download} Atualização do sistema</h3>
      <p class="cell-muted">Atualizar = trazer o código novo do GitHub e reinstalar. Seus dados e o <span class="cell-muted">.env</span> são preservados. Passo a passo:</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;margin-top:8px;">
        <div>
          <strong>Na VPS (Ubuntu)</strong>
          <ol class="cell-muted">
            <li>Conecte via SSH</li>
            <li>Rode os 3 comandos ao lado</li>
            <li>Confira o status no final</li>
          </ol>
          <pre style="background:var(--code-bg, #0f172a);color:#e2e8f0;padding:10px;border-radius:8px;white-space:pre-wrap;">${escapeHtml(vpsCmds)}</pre>
          <button class="btn btn-secondary" id="maint-copy-vps">Copiar comandos</button>
        </div>
        <div>
          <strong>No Windows (esta máquina)</strong>
          <ol class="cell-muted">
            <li>Abra o Git Bash na pasta do projeto</li>
            <li>Rode o comando ao lado</li>
            <li>Reinicie o run-server.bat</li>
          </ol>
          <pre style="background:var(--code-bg, #0f172a);color:#e2e8f0;padding:10px;border-radius:8px;white-space:pre-wrap;">${escapeHtml(winCmds)}</pre>
          <button class="btn btn-secondary" id="maint-copy-win">Copiar comando</button>
        </div>
      </div>
    </div>

    <div class="card settings-card">
      <h3>${ICONS.shield} Segurança do servidor</h3>
      <p class="cell-muted">Diagnóstico da VPS (somente leitura), exceto <strong>Atualizar sistema</strong>, que altera a máquina e pede confirmação.
        Cada botão roda o comando real e mostra a saída abaixo como num terminal. No Windows, os botões mostram o comando para rodar na VPS.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin:8px 0;">
        <button class="btn btn-secondary" data-sec="ssh">SSH suspeitas</button>
        <button class="btn btn-secondary" data-sec="ports">Portas abertas</button>
        <button class="btn btn-secondary" data-sec="firewall">Firewall</button>
        <button class="btn btn-secondary" data-sec="updates">Atualizações</button>
        <button class="btn btn-primary" data-sec="upgrade">Atualizar sistema</button>
      </div>
      <pre id="sec-term" tabindex="0" aria-label="Terminal de segurança">Clique numa ação acima — a saída aparece aqui como num terminal.</pre>
    </div>

    <div class="card settings-card" style="border-color:#f59e0b;">
      <h3>Zona de atenção: reiniciar</h3>
      <p class="cell-muted">Use quando o painel pedir (ex.: depois de restaurar um backup).
        <strong>Na VPS</strong> o serviço sobe sozinho em segundos.
        <strong>No Windows</strong> o processo morre e você precisa reabrir o run-server.bat.</p>
      <button class="btn btn-secondary" id="maint-restart">Reiniciar agora</button>
    </div>
  `;

  // Mapa vivo estilo n8n a partir do status real.
  try {
    const flowSvg = document.getElementById('maint-flow');
    const flowDetail = document.getElementById('maint-flow-detail');
    if (flowSvg && flowDetail) {
      maintFlowBind(flowSvg, flowDetail, maintFlowModel(st), st);
    }
  } catch (err) { /* mapa e decorativo: cards continuam funcionando */ }

  document.getElementById('maint-refresh').addEventListener('click', renderManutencaoPage);
  loadMaintUsers();
  bindSecTerminal();
  document.getElementById('maint-copy-vps').addEventListener('click', (e) => copyCmd(vpsCmds, e.currentTarget));
  document.getElementById('maint-copy-win').addEventListener('click', (e) => copyCmd(winCmds, e.currentTarget));

  document.getElementById('maint-backup-now').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    try {
      await api('POST', '/api/backups');
      toast('Backup criado com sucesso!');
      renderManutencaoPage();
    } catch (err) {
      toast(err.message, true);
      btn.disabled = false;
    }
  });

  targetContainer.querySelectorAll('[data-maint="migrate"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const row = (st.tenants || []).find((t) => t.establishmentId === id);
      if (!window.confirm(`Migrar "${row ? row.name : id}" para BANCO DEDICADO?\n\nO sistema cria o banco e move os dados sozinho, sem reiniciar.\n\nContinuar?`)) return;
      btn.disabled = true;
      try {
        toast('Migrando loja, aguarde...');
        await api('POST', `/api/tenant-databases/${id}/provision`, {});
        toast('Loja em banco dedicado!');
        renderManutencaoPage();
      } catch (err) {
        toast(err.message, true);
        btn.disabled = false;
      }
    });
  });
  targetContainer.querySelectorAll('[data-maint="moveback"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const row = (st.tenants || []).find((t) => t.establishmentId === id);
      if (!window.confirm(`Voltar "${row ? row.name : id}" ao banco COMPARTILHADO?\n\nContinuar?`)) return;
      btn.disabled = true;
      try {
        await api('POST', `/api/tenant-databases/${id}/move-back`, {});
        toast('Loja no banco compartilhado.');
        renderManutencaoPage();
      } catch (err) {
        toast(err.message, true);
        btn.disabled = false;
      }
    });
  });

  document.getElementById('maint-restart').addEventListener('click', async (e) => {
    if (!window.confirm('Reiniciar o servidor agora?\n\nNa VPS ele sobe sozinho. No Windows, reabra o run-server.bat.')) return;
    const btn = e.currentTarget;
    btn.disabled = true;
    try {
      const r = await api('POST', '/api/maintenance/restart', {});
      toast(r.message);
    } catch (err) {
      toast('Servidor reiniciando... aguarde e recarregue a página.');
    }
  });
}

// ===== Terminal de segurança da Manutenção =====
// Cada botão roda o diagnóstico real no servidor e revela a saída como num
// terminal (efeito de digitação). O upgrade roda em background: o terminal
// acompanha o log com polling até terminar.
let secUpgradeTimer = null;
let secOSInfo = null;
async function secLoadOS() {
  try {
    secOSInfo = await api('GET', '/api/maintenance/security/os');
  } catch (e) { secOSInfo = null; }
  return secOSInfo;
}
function secOSLabel() {
  if (!secOSInfo) return 'SO: não detectado';
  return 'SO detectado: ' + (secOSInfo.name || secOSInfo.platform)
    + (secOSInfo.version ? ' ' + secOSInfo.version : '')
    + (secOSInfo.pkg ? ' · pacotes via ' + secOSInfo.pkg : '')
    + (secOSInfo.sshLog ? ' · log SSH: ' + secOSInfo.sshLog : '');
}
function secTerm() { return document.getElementById('sec-term'); }
function secScroll() {
  const t = secTerm();
  if (t) t.scrollTop = t.scrollHeight;
}
function secPrint(text) {
  const t = secTerm();
  if (!t) return;
  t.textContent += text;
  secScroll();
}
function secReveal(fullText) {
  const t = secTerm();
  if (!t) return;
  const start = t.textContent.length;
  t.textContent += fullText;
  // revela em fatias para dar a sensação de terminal em tempo real
  let shown = 0;
  const step = Math.max(400, Math.ceil(fullText.length / 40));
  const timer = setInterval(() => {
    shown += step;
    if (shown >= fullText.length) {
      clearInterval(timer);
      t.textContent = t.textContent.slice(0, start) + fullText;
    } else {
      t.textContent = t.textContent.slice(0, start) + fullText.slice(0, shown) + '▌';
    }
    secScroll();
  }, 30);
}
async function secRun(kind) {
  const labels = {
    ssh: 'Tentativas de login SSH suspeitas',
    ports: 'Portas abertas (ss)',
    firewall: 'Regras de firewall (UFW/iptables)',
    updates: 'Atualizações pendentes do SO'
  };
  secPrint('\n$ ' + (labels[kind] || kind) + '\n');
  try {
    const r = await api('GET', '/api/maintenance/security/' + kind);
    if (!r || typeof r.cmd === 'undefined' || typeof r.output === 'undefined') {
      throw new Error('Backend desatualizado: rode git pull + update.sh na VPS e recarregue.');
    }
    secPrint('$ ' + (r.cmd || '') + '\n');
    secReveal((r.output || '(sem saída)') + '\n');
  } catch (err) {
    secPrint('ERRO: ' + err.message + '\n');
  }
}
async function secUpgrade() {
  if (!window.confirm('Atualizar o sistema operacional agora?\n\n'
      + 'SO: ' + (secOSInfo && secOSInfo.name ? secOSInfo.name : 'detectando...')
      + '\nRoda o upgrade do gerenciador (' + (secOSInfo && secOSInfo.pkg ? secOSInfo.pkg : 'apt/dnf/pacman/apk conforme a distro') + ') na VPS em segundo plano. '
      + 'Pode levar minutos — não feche esta página até terminar.')) return;
  if (secUpgradeTimer) return;
  secPrint('\n$ Atualização do sistema (apt update + upgrade)\n');
  try {
    const r = await api('POST', '/api/maintenance/security/upgrade', {});
    secPrint(r.message + '\n');
  } catch (err) {
    secPrint('ERRO: ' + err.message + '\n');
    return;
  }
  let printed = -1;
  secUpgradeTimer = setInterval(async () => {
    try {
      const s = await api('GET', '/api/maintenance/security/upgrade-log');
      const log = s.log || '';
      if (printed === -1) {
        secPrint('--- log ao vivo ---\n');
        printed = 0;
      }
      if (log.length > printed) {
        secPrint(log.slice(printed));
        printed = log.length;
      }
      if (!s.running) {
        clearInterval(secUpgradeTimer);
        secUpgradeTimer = null;
        secPrint('--- fim (serviço do painel não foi reiniciado; se o kernel atualizou, agende um reboot) ---\n');
        toast('Atualização do sistema concluída.');
      }
    } catch (err) {
      secPrint('ERRO no polling: ' + err.message + '\n');
      clearInterval(secUpgradeTimer);
      secUpgradeTimer = null;
    }
  }, 2500);
}
function bindSecTerminal() {
  const t = secTerm();
  if (!t) return;
  t.textContent = 'Detectando sistema operacional...\n';
  secLoadOS().then(() => {
    const term = secTerm();
    if (term) {
      term.textContent = secOSLabel() + '\nClique numa ação acima — a saída aparece aqui como num terminal.\n';
    }
  });
  document.querySelectorAll('[data-sec]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const kind = btn.dataset.sec;
      if (kind === 'upgrade') secUpgrade();
      else secRun(kind);
    });
  });
}

// Lista compacta de logins na Manutenção: status + definir nova senha inline.
// (o campo de nova senha ganha o "olhinho" automaticamente via enhancePasswordFields)
async function loadMaintUsers() {
  const box = document.getElementById('maint-users');
  if (!box) return;
  box.innerHTML = '<div class="loading-state">Carregando usuários...</div>';
  let users;
  try {
    users = await api('GET', '/api/password/admin-users');
  } catch (err) {
    box.innerHTML = `<div class="empty-state">${escapeHtml(err.message)}</div>`;
    return;
  }
  box.innerHTML = `
    <div style="overflow-x:auto;margin-top:8px;">
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="text-align:left;">
          <th>Usuário</th><th>Login</th><th>2FA</th><th>Última troca</th><th style="text-align:right;">Ação</th>
        </tr></thead>
        <tbody>
          ${users.map((u) => `
            <tr data-user-row="${u.id}">
              <td><strong>${escapeHtml(u.name || '')}</strong><br><span class="cell-muted">${escapeHtml(u.email || '')}</span></td>
              <td>${u.googleLinked ? '<span class="pill pill-concluido" style="font-size:11px;" title="Entra com o botão Google">Google</span> ' : ''}<span class="pill" style="font-size:11px;" title="Entra com email + senha">Senha</span></td>
              <td>${u.twoFactorEnabled ? '<span class="pill pill-concluido" style="font-size:11px;">Ativo</span>' : '<span class="cell-muted">—</span>'}</td>
              <td class="cell-muted">${u.passwordChangedAt ? escapeHtml(formatDateTime(u.passwordChangedAt)) : 'Nunca'}</td>
              <td style="text-align:right;">
                <button class="action-btn action-btn-blue" data-maint-pwd="${u.id}" title="Definir nova senha para ${escapeHtml(u.name || u.email || '')}">${ICONS.lock} Nova senha</button>
              </td>
            </tr>`).join('') || '<tr><td colspan="5" class="cell-muted">Nenhum usuário.</td></tr>'}
        </tbody>
      </table>
    </div>`;
  box.querySelectorAll('[data-maint-pwd]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.maintPwd;
      const row = box.querySelector(`[data-user-row="${id}"]`);
      if (!row || row.querySelector('.maint-pwd-form')) return;
      const cell = row.lastElementChild;
      cell.innerHTML = `
        <form class="maint-pwd-form" style="display:flex;gap:6px;justify-content:flex-end;align-items:center;flex-wrap:wrap;">
          <input type="password" name="npwd" required minlength="8" autocomplete="new-password"
            placeholder="Nova senha (min. 8)" style="max-width:190px;border:1.5px solid var(--input-border);border-radius:8px;padding:7px 10px;font-size:13px;" />
          <button type="submit" class="action-btn action-btn-blue">Salvar</button>
          <button type="button" class="action-btn" data-maint-pwd-cancel>X</button>
        </form>
        <div class="cell-muted" style="font-size:11px;margin-top:4px;">Min. 8 + maiúscula, minúscula, número e especial</div>`;
      cell.querySelector('[data-maint-pwd-cancel]').addEventListener('click', loadMaintUsers);
      cell.querySelector('.maint-pwd-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPassword = new FormData(e.target).get('npwd');
        try {
          await api('PUT', `/api/password/admin-reset/${id}`, { newPassword });
          toast('Senha definida com sucesso!');
          loadMaintUsers();
        } catch (err) {
          toast(err.message, true);
        }
      });
    });
  });
}

// ================= Pagina de Senhas (Gerenciamento de Senhas) =================
async function renderSenhasPage() {
  // Pagina de gerenciamento de usuarios do sistema: so admin da plataforma.
  if (!isGlobalAdmin(currentUser)) {
    return renderSelector();
  }
  const isGlobal = !currentEstablishment;
  let targetContainer;
  let backButtonHtml = '';

  if (isGlobal) {
    backButtonHtml = `
      <div style="margin-bottom:20px;">
        <a href="#" class="btn btn-secondary" style="text-decoration:none;">${ICONS.arrowLeft} Voltar para Seleção</a>
      </div>
    `;
    root.innerHTML = `
      <div class="selector-screen" style="max-width:900px; padding:20px; margin:0 auto;">
        ${backButtonHtml}
        <div id="global-senhas-content"></div>
      </div>
    `;
    targetContainer = document.getElementById('global-senhas-content');
  } else {
    mainEl().innerHTML = `
      <div id="global-senhas-content"></div>
    `;
    targetContainer = document.getElementById('global-senhas-content');
  }

  targetContainer.innerHTML = `
    <div class="page-header">
      <div>
        <h1>Gerenciamento de Senhas</h1>
        <p>Altere sua senha ou gerencie senhas de usuarios</p>
      </div>
    </div>
    <div class="card settings-card">
      <h2 style="margin:0 0 16px 0;font-size:18px;">${ICONS.lock} Alterar Minha Senha</h2>
      <form id="change-password-form">
        <div class="form-field">
          <label>Senha Atual *</label>
          <input type="password" name="currentPassword" required autocomplete="current-password" />
        </div>
        <div class="form-field">
          <label>Nova Senha *</label>
          <input type="password" name="newPassword" required minlength="8" autocomplete="new-password" />
          <div class="password-requirements">
            <small>Requisitos: minimo 8 caracteres, 1 maiuscula, 1 minuscula, 1 numero, 1 caractere especial</small>
          </div>
        </div>
        <div class="form-field">
          <label>Confirmar Nova Senha *</label>
          <input type="password" name="confirmPassword" required minlength="8" autocomplete="new-password" />
        </div>
        <div style="text-align:right;">
          <button type="submit" class="btn btn-primary">Alterar Senha</button>
        </div>
      </form>
    </div>
    ${currentUser && currentUser.role === 'admin' ? `
    <div id="pending-users-section"></div>
    <div class="card settings-card">
      <div class="page-header" style="align-items:flex-start;gap:12px;flex-wrap:wrap;">
        <div>
          <h2>${ICONS.users} Gerenciar Usuarios do Sistema</h2>
          <p>Administre todos os usuarios cadastrados (apenas admin)</p>
        </div>
        <button class="btn btn-primary" id="new-system-user-btn">${ICONS.plus} Novo Usuario</button>
      </div>
      <div id="admin-users-container"><div class="loading-state">Carregando usuarios...</div></div>
    </div>
    ` : ''}
  `;

  document.getElementById('change-password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const newPassword = fd.get('newPassword');
    const confirmPassword = fd.get('confirmPassword');

    if (newPassword !== confirmPassword) {
      return toast('As senhas nao conferem.', true);
    }

    try {
      await api('PUT', '/api/password/change', {
        currentPassword: fd.get('currentPassword'),
        newPassword: newPassword
      });
      toast('Senha alterada com sucesso!');
      e.target.reset();
    } catch (err) {
      toast(err.message, true);
    }
  });

  if (currentUser && currentUser.role === 'admin') {
    const newUserBtn = document.getElementById('new-system-user-btn');
    if (newUserBtn) newUserBtn.addEventListener('click', openCreateSystemUserModal);
    loadAdminUsers();
  }
}

function openCreateSystemUserModal() {
  api('GET', '/api/establishments').then((ests) => {
    const bodyHtml = `
      <form id="create-system-user-form">
        <div class="form-field"><label>Nome *</label><input type="text" name="name" required autocomplete="name" /></div>
        <div class="form-field"><label>Email *</label><input type="email" name="email" required autocomplete="email" /></div>
        <div class="form-grid">
          <div class="form-field">
            <label>Senha *</label>
            <input type="password" name="password" required minlength="8" autocomplete="new-password" />
          </div>
          <div class="form-field">
            <label>Perfil</label>
            <select name="role" id="new-user-role">
              <option value="operator" selected>Operador</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
        </div>
        <div class="password-requirements" style="margin-bottom:12px;">
          <small>Requisitos: minimo 8 caracteres, 1 maiuscula, 1 minuscula, 1 numero, 1 caractere especial</small>
        </div>
        <div id="new-user-global-wrap">
          <label class="associate-global-toggle">
            <input type="checkbox" id="new-user-global-chk" />
            <span class="associate-global-track"><span class="associate-global-thumb"></span></span>
            <span class="associate-global-text">
              <strong>Acesso Global</strong>
              <em>Disponivel apenas para administradores. Operadores precisam de ao menos 1 loja.</em>
            </span>
          </label>
        </div>
        <div class="associate-divider"></div>
        <div id="new-user-est-container" class="associate-checklist-wrap">
          <div class="associate-checklist-header">
            <span>Estabelecimentos permitidos</span>
            <div class="associate-checklist-actions">
              <button type="button" class="link-btn" id="new-user-select-all">Selecionar todos</button>
              <button type="button" class="link-btn" id="new-user-clear-all">Limpar</button>
            </div>
          </div>
          <div class="associate-checklist">
            ${ests.length === 0 ? '<div class="empty-state">Nenhum estabelecimento cadastrado.</div>' : ests.map((est) => `
              <label class="associate-est-item">
                <input type="checkbox" class="est-chk" value="${est.id}" />
                <div class="associate-est-icon">${est.logoDataUrl ? `<img src="${est.logoDataUrl}"/>` : nicheIcon(est.niche)}</div>
                <div class="associate-est-info">
                  <div class="associate-est-name">${escapeHtml(est.name)}</div>
                  <div class="associate-est-niche">${escapeHtml(est.niche)}</div>
                </div>
              </label>
            `).join('')}
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" id="cancel-create-user">Cancelar</button>
          <button type="submit" class="btn btn-primary">Criar Usuario</button>
        </div>
      </form>
    `;
    showModal('Novo Usuario do Sistema', bodyHtml, (overlay) => {
      const roleSelect = overlay.querySelector('#new-user-role');
      const globalChk = overlay.querySelector('#new-user-global-chk');
      const globalWrap = overlay.querySelector('#new-user-global-wrap');
      const estContainer = overlay.querySelector('#new-user-est-container');

      function refreshVisibility() {
        const isAdmin = roleSelect.value === 'admin';
        globalWrap.style.display = isAdmin ? 'block' : 'none';
        if (!isAdmin && globalChk) globalChk.checked = false;
        estContainer.style.display = (isAdmin && globalChk && globalChk.checked) ? 'none' : 'block';
      }
      function refreshItemStates() {
        overlay.querySelectorAll('.associate-est-item').forEach((item) => {
          const chk = item.querySelector('.est-chk');
          item.classList.toggle('checked', chk.checked);
        });
      }
      roleSelect.addEventListener('change', refreshVisibility);
      if (globalChk) globalChk.addEventListener('change', refreshVisibility);
      overlay.querySelector('#new-user-select-all').addEventListener('click', () => {
        overlay.querySelectorAll('.est-chk').forEach((c) => { c.checked = true; });
        refreshItemStates();
      });
      overlay.querySelector('#new-user-clear-all').addEventListener('click', () => {
        overlay.querySelectorAll('.est-chk').forEach((c) => { c.checked = false; });
        refreshItemStates();
      });
      overlay.querySelectorAll('.est-chk').forEach((c) => c.addEventListener('change', refreshItemStates));
      refreshVisibility();

      overlay.querySelector('#cancel-create-user').addEventListener('click', closeModal);
      overlay.querySelector('#create-system-user-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const role = fd.get('role') === 'admin' ? 'admin' : 'operator';
        const isGlobal = role === 'admin' && globalChk && globalChk.checked;
        const allowedEstablishmentIds = isGlobal
          ? null
          : Array.from(overlay.querySelectorAll('.est-chk:checked')).map((el) => el.value);
        if (!isGlobal && (!allowedEstablishmentIds || allowedEstablishmentIds.length === 0)) {
          toast('Selecione ao menos 1 estabelecimento (ou ative Acesso Global para admin).', true);
          return;
        }
        try {
          await api('POST', '/api/password/admin-create', {
            name: fd.get('name'),
            email: fd.get('email'),
            password: fd.get('password'),
            role,
            allowedEstablishmentIds
          });
          closeModal();
          toast('Usuario criado com sucesso!');
          loadAdminUsers();
        } catch (err) {
          toast(err.message, true);
        }
      });
    });
  }).catch((err) => toast('Erro ao carregar estabelecimentos: ' + err.message, true));
}

// Renderiza o card de cadastros pendentes de aprovacao (usuarios que se
// cadastraram via Google e aguardam o admin associar a uma loja).
function renderPendingUsers(pendingUsers) {
  const section = document.getElementById('pending-users-section');
  if (!section) return;
  if (!pendingUsers || pendingUsers.length === 0) {
    section.innerHTML = '';
    return;
  }
  section.innerHTML = `
    <div class="card settings-card pending-users-card">
      <div class="page-header" style="align-items:flex-start;gap:12px;flex-wrap:wrap;">
        <div>
          <h2>${ICONS.clock} Cadastros Pendentes <span class="pending-count-badge">${pendingUsers.length}</span></h2>
          <p>Usuarios que se cadastraram (ex: via Google) e aguardam associacao a uma loja</p>
        </div>
      </div>
      <div class="pending-users-list">
        ${pendingUsers.map((user) => {
          const initials = (user.name || user.email || '?').trim().charAt(0).toUpperCase();
          return `
          <div class="pending-user-item">
            <div class="user-cell">
              <div class="user-avatar">${escapeHtml(initials)}</div>
              <div class="user-meta">
                <div class="user-name">${escapeHtml(user.name)}</div>
                <div class="user-email">${escapeHtml(user.email)}</div>
              </div>
            </div>
            <div class="pending-user-actions">
              <span class="pill pill-pendente">Aguardando</span>
              <button class="btn btn-primary btn-sm approve-user-btn" data-id="${user.id}" data-name="${escapeHtml(user.name)}" data-role="${escapeHtml(user.role)}" data-allowed='${JSON.stringify(user.allowedEstablishmentIds)}'>
                ${ICONS.globe} Associar a uma loja
              </button>
            </div>
          </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
  section.querySelectorAll('.approve-user-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const allowed = JSON.parse(btn.dataset.allowed);
      openAssociateModal(btn.dataset.id, btn.dataset.name, allowed, btn.dataset.role);
    });
  });
}

async function loadAdminUsers() {
  const container = document.getElementById('admin-users-container');
  if (!container) return;
  container.innerHTML = '<div class="loading-state">Carregando usuarios...</div>';
  try {
    const [users, ests] = await Promise.all([
      api('GET', '/api/password/admin-users'),
      api('GET', '/api/establishments')
    ]);

    const isGlobal = (u) => u.role === 'admin' && (u.allowedEstablishmentIds === null || u.allowedEstablishmentIds === undefined);

    // Cadastros pendentes: operadores sem nenhum estabelecimento associado
    // (criados via login Google, aguardando o admin associar a uma loja).
    const pendingUsers = users.filter((u) => !isGlobal(u) &&
      (!Array.isArray(u.allowedEstablishmentIds) || u.allowedEstablishmentIds.length === 0));
    renderPendingUsers(pendingUsers);

    container.innerHTML = `
      <div class="users-table-wrap">
        <table class="mini-table users-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Perfil</th>
              <th>Acesso</th>
              <th>2FA</th>
              <th>Ultima troca de senha</th>
              <th class="col-actions">Acoes</th>
            </tr>
          </thead>
          <tbody>
            ${users.map((user) => {
              const initials = (user.name || user.email || '?').trim().charAt(0).toUpperCase();
              const globalUser = isGlobal(user);
              let accessCell;
              if (globalUser) {
                accessCell = '<span class="access-badge access-global" title="Acesso a todos os estabelecimentos">Global</span>';
              } else {
                const allowedIds = Array.isArray(user.allowedEstablishmentIds) ? user.allowedEstablishmentIds : [];
                const matchedNames = ests
                  .filter((est) => allowedIds.includes(est.id))
                  .map((est) => est.name);
                accessCell = matchedNames.length > 0
                  ? `<div class="access-chips">${matchedNames.map(name => `<span class="access-chip" title="${escapeHtml(name)}">${escapeHtml(name)}</span>`).join('')}</div>`
                  : '<span class="access-badge access-none" title="Sem acesso a estabelecimentos">Nenhum</span>';
              }

              return `
              <tr>
                <td>
                  <div class="user-cell">
                    <div class="user-avatar">${escapeHtml(initials)}</div>
                    <div class="user-meta">
                      <div class="user-name">${escapeHtml(user.name)}${user.id === currentUser.id ? ' <span class="tag">Voce</span>' : ''}</div>
                      <div class="user-email">${escapeHtml(user.email)}</div>
                    </div>
                  </div>
                </td>
                <td><span class="role-badge ${user.role === 'admin' ? '' : 'func'}">${escapeHtml(user.role)}</span></td>
                <td>${accessCell}</td>
                <td>${user.twoFactorEnabled
                  ? '<span class="pill pill-concluido" style="font-size:11px;">Ativo</span>'
                  : '<span class="pill pill-pendente" style="font-size:11px;">Inativo</span>'}</td>
                <td class="cell-muted">${user.passwordChangedAt ? formatDateTime(user.passwordChangedAt) : '<span class="pill pill-pendente">Nunca</span>'}</td>
                <td class="col-actions">
                  <div class="row-actions">
                    <button class="action-btn action-btn-blue reset-pwd-btn" data-id="${user.id}" data-name="${escapeHtml(user.name)}" title="Resetar senha">
                      ${ICONS.lock}
                    </button>
                    ${user.twoFactorEnabled && user.id !== currentUser.id ? `
                    <button class="action-btn action-btn-orange reset-2fa-btn" data-id="${user.id}" data-name="${escapeHtml(user.name)}" title="Resetar 2FA (desativar autenticacao de dois fatores)">
                      ${ICONS.shield}
                    </button>
                    ` : ''}
                    <button class="action-btn action-btn-violet associate-btn" data-id="${user.id}" data-name="${escapeHtml(user.name)}" data-role="${escapeHtml(user.role)}" data-allowed='${JSON.stringify(user.allowedEstablishmentIds)}' title="Associar estabelecimentos">
                      ${ICONS.globe}
                    </button>
                    ${user.id === currentUser.id ? '<span class="action-btn-placeholder" title="Voce nao pode excluir a si mesmo"></span>' : `
                      <button class="action-btn action-btn-red delete-user-btn" data-id="${user.id}" data-name="${escapeHtml(user.name)}" title="Excluir usuario">
                        ${ICONS.trash}
                      </button>
                    `}
                  </div>
                </td>
              </tr>
            `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    container.querySelectorAll('.reset-pwd-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        openResetPasswordModal(btn.dataset.id, btn.dataset.name);
      });
    });

    container.querySelectorAll('.reset-2fa-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const ok = window.confirm(
          `Resetar o 2FA de "${btn.dataset.name}"?\n\n` +
          `A autenticacao de dois fatores sera DESATIVADA e os codigos de backup apagados. ` +
          `O usuario podera entrar so com email/senha e reativar o 2FA depois.\n\n` +
          `Continuar?`
        );
        if (!ok) return;
        try {
          await api('POST', '/api/2fa/disable', { userId: btn.dataset.id });
          toast('2FA resetado com sucesso.');
          loadAdminUsers();
        } catch (err) {
          toast(err.message, true);
        }
      });
    });

    container.querySelectorAll('.associate-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const allowed = JSON.parse(btn.dataset.allowed);
        openAssociateModal(btn.dataset.id, btn.dataset.name, allowed, btn.dataset.role);
      });
    });

    container.querySelectorAll('.delete-user-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm(`Deseja realmente excluir o usuario "${btn.dataset.name}" do sistema?`)) return;
        try {
          await api('DELETE', `/api/password/admin-delete/${btn.dataset.id}`);
          toast('Usuario excluido com sucesso!');
          loadAdminUsers();
        } catch (err) {
          toast(err.message, true);
        }
      });
    });

  } catch (err) {
    container.innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`;
  }
}

function openAssociateModal(userId, userName, currentAllowedIds, role) {
  api('GET', '/api/establishments').then((ests) => {
    const isGlobal = currentAllowedIds === null || currentAllowedIds === undefined;
    // Acesso Global e exclusivo de administradores. Operadores sempre precisam
    // de lojas especificas (backend rejeita null para nao-admin).
    const canBeGlobal = role === 'admin';
    const globalToggleHtml = canBeGlobal ? `
      <label class="associate-global-toggle">
        <input type="checkbox" id="global-access-chk" ${isGlobal ? 'checked' : ''} />
        <span class="associate-global-track"><span class="associate-global-thumb"></span></span>
        <span class="associate-global-text">
          <strong>Acesso Global</strong>
          <em>Este usuario podera acessar todos os estabelecimentos do sistema.</em>
        </span>
      </label>
    ` : `
      <div class="associate-global-notice">
        ${ICONS.info} <em>Operadores tem acesso somente aos estabelecimentos marcados abaixo.</em>
      </div>
    `;
    const bodyHtml = `
      <form id="associate-form">
        <div class="associate-user-banner">
          <div class="associate-avatar">${escapeHtml((userName || '?').trim().charAt(0).toUpperCase())}</div>
          <div>
            <div class="associate-user-name">${escapeHtml(userName)}</div>
            <div class="associate-user-hint">Defina quais estabelecimentos este usuario podera acessar.</div>
          </div>
        </div>

        ${globalToggleHtml}

        <div class="associate-divider"></div>

        <div id="establishments-checklist-container" class="associate-checklist-wrap" style="${canBeGlobal && isGlobal ? 'display:none;' : ''}">
          <div class="associate-checklist-header">
            <span>Estabelecimentos permitidos</span>
            <div class="associate-checklist-actions">
              <button type="button" class="link-btn" id="select-all-est">Selecionar todos</button>
              <button type="button" class="link-btn" id="clear-all-est">Limpar</button>
            </div>
          </div>
          <div class="associate-checklist">
            ${ests.map((est) => {
              const checked = Array.isArray(currentAllowedIds) && currentAllowedIds.includes(est.id);
              return `
                <label class="associate-est-item ${checked ? 'checked' : ''}">
                  <input type="checkbox" class="est-chk" value="${est.id}" ${checked ? 'checked' : ''} />
                  <div class="associate-est-icon">${est.logoDataUrl ? `<img src="${est.logoDataUrl}"/>` : nicheIcon(est.niche)}</div>
                  <div class="associate-est-info">
                    <div class="associate-est-name">${escapeHtml(est.name)}</div>
                    <div class="associate-est-niche">${escapeHtml(est.niche)}</div>
                  </div>
                </label>
              `;
            }).join('')}
          </div>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" id="cancel-associate">Cancelar</button>
          <button type="submit" class="btn btn-primary">Salvar Associacao</button>
        </div>
      </form>
    `;
    showModal('Associar Estabelecimentos', bodyHtml, (overlay) => {
      const globalChk = canBeGlobal ? overlay.querySelector('#global-access-chk') : null;
      const checklistContainer = overlay.querySelector('#establishments-checklist-container');

      function refreshItemStates() {
        overlay.querySelectorAll('.associate-est-item').forEach((item) => {
          const chk = item.querySelector('.est-chk');
          item.classList.toggle('checked', chk.checked);
        });
      }

      if (globalChk) {
        globalChk.addEventListener('change', () => {
          checklistContainer.style.display = globalChk.checked ? 'none' : 'block';
        });
      }

      overlay.querySelector('#select-all-est').addEventListener('click', () => {
        overlay.querySelectorAll('.est-chk').forEach((c) => { c.checked = true; });
        refreshItemStates();
      });
      overlay.querySelector('#clear-all-est').addEventListener('click', () => {
        overlay.querySelectorAll('.est-chk').forEach((c) => { c.checked = false; });
        refreshItemStates();
      });
      overlay.querySelectorAll('.est-chk').forEach((c) => {
        c.addEventListener('change', refreshItemStates);
      });

      overlay.querySelector('#cancel-associate').addEventListener('click', closeModal);
      overlay.querySelector('#associate-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        let allowedEstablishmentIds = null;
        if (!(canBeGlobal && globalChk && globalChk.checked)) {
          allowedEstablishmentIds = Array.from(overlay.querySelectorAll('.est-chk:checked')).map((el) => el.value);
          // Bloqueia salvar sem selecao (evita lockout do operador)
          if (allowedEstablishmentIds.length === 0) {
            toast('Selecione ao menos 1 estabelecimento. Senao o usuario nao conseguira fazer login.', true);
            return;
          }
        }

        try {
          await api('PUT', `/api/password/admin-associate/${userId}`, { allowedEstablishmentIds });
          closeModal();
          toast('Associacao atualizada com sucesso!');
          loadAdminUsers();
        } catch (err) {
          toast(err.message, true);
        }
      });
    });
  }).catch((err) => toast('Erro ao carregar estabelecimentos: ' + err.message, true));
}

function openResetPasswordModal(userId, userName) {
  const bodyHtml = `
    <form id="reset-pwd-form">
      <p>Resetando senha para: <strong>${escapeHtml(userName)}</strong></p>
      <div class="form-field">
        <label>Nova Senha *</label>
        <input type="password" name="newPassword" required minlength="8" />
      </div>
      <div class="form-field">
        <label>Confirmar Nova Senha *</label>
        <input type="password" name="confirmPassword" required minlength="8" />
      </div>
      <div class="password-requirements">
        <small>Requisitos: minimo 8 caracteres, 1 maiuscula, 1 minuscula, 1 numero, 1 caractere especial</small>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" id="cancel-reset-pwd">Cancelar</button>
        <button type="submit" class="btn btn-danger">Resetar Senha</button>
      </div>
    </form>
  `;
  showModal('Resetar Senha do Usuario', bodyHtml, (overlay) => {
    overlay.querySelector('#cancel-reset-pwd').addEventListener('click', closeModal);
    overlay.querySelector('#reset-pwd-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const newPassword = fd.get('newPassword');
      const confirmPassword = fd.get('confirmPassword');

      if (newPassword !== confirmPassword) {
        return toast('As senhas nao conferem.', true);
      }

      try {
        await api('PUT', `/api/password/admin-reset/${userId}`, { newPassword });
        closeModal();
        toast('Senha resetada com sucesso!');
        loadAdminUsers();
      } catch (err) {
        toast(err.message, true);
      }
    });
  });
}

// ================= Pagina de Seguranca (Inspecao) =================
async function renderSegurancaPage() {
  // Pagina de inspecao de seguranca: so admin da plataforma.
  if (!isGlobalAdmin(currentUser)) {
    return renderSelector();
  }
  const isGlobal = !currentEstablishment;
  let targetContainer;
  let backButtonHtml = '';

  if (isGlobal) {
    backButtonHtml = `
      <div style="margin-bottom:20px;">
        <a href="#" class="btn btn-secondary" style="text-decoration:none;">${ICONS.arrowLeft} Voltar para Seleção</a>
      </div>
    `;
    root.innerHTML = `
      <div class="selector-screen" style="max-width:900px; padding:20px; margin:0 auto;">
        ${backButtonHtml}
        <div id="global-seguranca-content"></div>
      </div>
    `;
    targetContainer = document.getElementById('global-seguranca-content');
  } else {
    mainEl().innerHTML = `
      <div id="global-seguranca-content"></div>
    `;
    targetContainer = document.getElementById('global-seguranca-content');
  }

  targetContainer.innerHTML = `
    <div class="page-header">
      <div>
        <h1>${ICONS.shield} Inspecao de Seguranca</h1>
        <p>Diagnostico de seguranca do sistema</p>
      </div>
      <button class="btn btn-primary" id="refresh-security-btn">${ICONS.shield} Atualizar Inspecao</button>
    </div>
    <div id="security-results"><div class="loading-state">Realizando inspecao de seguranca...</div></div>
  `;

  document.getElementById('refresh-security-btn').addEventListener('click', loadSecurityInspection);
  loadSecurityInspection();
}

async function loadSecurityInspection() {
  const container = document.getElementById('security-results');
  if (!container) return;

  try {
    const result = await api('GET', '/api/security/inspect');
    const issues = result.issues || [];

    // Separar por severidade
    const critical = issues.filter((i) => i.severity === 'critical');
    const high = issues.filter((i) => i.severity === 'high');
    const medium = issues.filter((i) => i.severity === 'medium');
    const info = issues.filter((i) => i.severity === 'info');

    container.innerHTML = `
      <div class="security-summary">
        <div class="stat-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:24px;">
          <div class="stat-card" style="border-left:3px solid #e53935;">
            <div class="stat-value" style="color:#e53935;">${critical.length}</div>
            <div class="stat-label">Criticos</div>
          </div>
          <div class="stat-card" style="border-left:3px solid #fb8c00;">
            <div class="stat-value" style="color:#fb8c00;">${high.length}</div>
            <div class="stat-label">Altos</div>
          </div>
          <div class="stat-card" style="border-left:3px solid #fdd835;">
            <div class="stat-value" style="color:#fdd835;">${medium.length}</div>
            <div class="stat-label">Medios</div>
          </div>
          <div class="stat-card" style="border-left:3px solid #43a047;">
            <div class="stat-value" style="color:#43a047;">${info.length}</div>
            <div class="stat-label">Informativos</div>
          </div>
        </div>
        <p class="cell-muted" style="text-align:right;">Inspecao realizada em: ${formatDateTime(result.inspectedAt)}</p>
      </div>
      <div class="security-issues-list">
        ${issues.length === 0 ? '<div class="empty-state">Nenhum problema de seguranca encontrado. Parabens!</div>' : `
          ${issues.map((issue) => `
            <div class="security-issue-card severity-${issue.severity}">
              <div class="issue-header">
                <span class="severity-badge ${issue.severity}">${issue.severity.toUpperCase()}</span>
                <strong>${escapeHtml(issue.category)}</strong>
              </div>
              <p>${escapeHtml(issue.description)}</p>
              ${issue.details && issue.details.length > 0 ? `
                <ul class="issue-details">
                  ${issue.details.map((d) => `<li>${escapeHtml(d.issue || d.email || '')} ${d.name ? '- ' + escapeHtml(d.name) : ''}</li>`).join('')}
                </ul>
              ` : ''}
            </div>
          `).join('')}
        `}
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`;
  }
}

// ===== Mostrar/ocultar senha (botao "olhinho") =====
// Aplica automaticamente a TODOS os campos type="password" — os que ja estao
// na tela e os renderizados depois via innerHTML (login, setup, trocar senha,
// novo usuario, 2FA, API keys). Nao precisa mexer nos formularios: o
// MutationObserver envolve cada campo novo num .pw-wrap com botao toggle.
const PW_EYE_OPEN = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12c1-2.5 5-7 10-7s9 4.5 10 7c-1 2.5-5 7-10 7s-9-4.5-10-7z"/><circle cx="12" cy="12" r="3"/></svg>';
const PW_EYE_CLOSED = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.5 10.5 0 0112 19c-5 0-9-4.5-10-7 1-2.2 3.7-5 7-6.2M9.9 5.2A10.4 10.4 0 0112 5c5 0 9 4.5 10 7a13.6 13.6 0 01-2.2 3.1M9.9 9.9a3 3 0 004.2 4.2"/><path d="M2 2l20 20"/></svg>';
function enhanceOnePassword(input) {
  if (input.dataset.pwToggleDone) return;
  input.dataset.pwToggleDone = '1';
  const wrap = document.createElement('span');
  wrap.className = 'pw-wrap';
  input.parentNode.insertBefore(wrap, input);
  wrap.appendChild(input);
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'pw-toggle';
  btn.tabIndex = -1;
  btn.setAttribute('aria-label', 'Mostrar senha');
  btn.title = 'Mostrar senha';
  btn.innerHTML = PW_EYE_CLOSED;
  btn.addEventListener('click', () => {
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.innerHTML = show ? PW_EYE_OPEN : PW_EYE_CLOSED;
    btn.setAttribute('aria-label', show ? 'Ocultar senha' : 'Mostrar senha');
    btn.title = show ? 'Ocultar senha' : 'Mostrar senha';
    input.focus();
  });
  wrap.appendChild(btn);
}
function enhancePasswordFields(scope) {
  const rootEl = scope && scope.querySelectorAll ? scope : document;
  if (rootEl.matches && rootEl.matches('input[type="password"]')) enhanceOnePassword(rootEl);
  rootEl.querySelectorAll('input[type="password"]').forEach(enhanceOnePassword);
}
enhancePasswordFields(document);
new MutationObserver((mutations) => {
  for (const m of mutations) {
    m.addedNodes.forEach((n) => {
      if (n && n.nodeType === 1) enhancePasswordFields(n);
    });
  }
}).observe(document.documentElement, { childList: true, subtree: true });

boot();
