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
  download: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v12M7 11l5 5 5-5"/><path d="M4 20h16"/></svg>'
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
    return renderLogin();
  }

  if (!currentEstablishment) {
    return renderRouteWithoutEstablishment();
  }

  return renderAppShell();
}

// Paginas globais acessiveis sem estabelecimento selecionado (so admin da plataforma).
function renderRouteWithoutEstablishment() {
  const globalPages = {
    '#/senhas': renderSenhasPage,
    '#/seguranca': renderSegurancaPage
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
          <button type="submit" class="btn btn-primary">Entrar</button>
        </form>
        <div class="hint-box">Credenciais padrao configuradas no arquivo .env do servidor (ADMIN_EMAIL / ADMIN_PASSWORD).</div>
      </div>
    </div>
  `;
  document.getElementById('login-theme-toggle').addEventListener('click', toggleTheme);
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      currentUser = await api('POST', '/api/auth/login', {
        email: fd.get('email'),
        password: fd.get('password')
      });
      if (currentUser.establishmentId) {
        currentEstablishment = await api('GET', '/api/establishments/current');
      }
      render();
    } catch (err) {
      renderLogin(err.message);
    }
  });
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
          <a href="#/senhas" class="btn btn-secondary">${ICONS.lock} Usuarios e Senhas</a>
          <a href="#/seguranca" class="btn btn-secondary">${ICONS.shield} Inspecao de Seguranca</a>
        ` : ''}
        <button class="btn btn-secondary" id="selector-logout">${ICONS.arrowRight} Sair</button>
      </div>
    </div>
  `;

  const grid = document.getElementById('selector-grid');
  const canPause = currentUser && currentUser.role === 'admin' &&
    (currentUser.allowedEstablishmentIds === null || currentUser.allowedEstablishmentIds === undefined);
  grid.innerHTML = establishments.map((est) => `
    <div class="tenant-card ${est.paused ? 'tenant-paused' : ''}">
      ${est.paused ? '<div class="paused-overlay-badge" title="Loja pausada pelo administrador da plataforma">' + ICONS.pause + ' Pausada</div>' : ''}
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
        </div>
      </div>
      ${currentUser && currentUser.role === 'admin' ? `<a class="create-user-link" data-id="${est.id}" href="#">Criar acesso</a>` : ''}
    </div>
  `).join('') + `
    ${currentUser && currentUser.role === 'admin' ? `
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
  document.getElementById('new-tenant-card').addEventListener('click', openNewEstablishmentModal);
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
  const bodyHtml = `
    <form id="tenant-login-form">
      <div class="form-field"><label>Email *</label><input type="email" name="email" required /></div>
      <div class="form-field"><label>Senha *</label><input type="password" name="password" required /></div>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" id="cancel-tenant-login">Cancelar</button>
        <button type="submit" class="btn btn-primary">Entrar em ${escapeHtml(establishment.name)}</button>
      </div>
    </form>
  `;
  showModal(`Login para ${escapeHtml(establishment.name)}`, bodyHtml, (overlay) => {
    overlay.querySelector('#cancel-tenant-login').addEventListener('click', closeModal);
    overlay.querySelector('#tenant-login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        currentUser = await api('POST', '/api/auth/login', {
          email: fd.get('email'),
          password: fd.get('password'),
          establishmentId: establishment.id
        });
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

function openNewEstablishmentModal() {
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
        await api('POST', '/api/establishments', {
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
        renderSelector();
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
  { hash: '#/seguranca', label: 'Inspecao de Seguranca', icon: ICONS.shield, adminOnly: true }
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
    '#/seguranca': renderSegurancaPage
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
            return `
            <tr data-id="${a.id}">
              <td class="cell-strong">${escapeHtml(a.clientName)}</td>
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
        <thead><tr><th>Nome</th><th>Contato</th><th>Observacoes</th><th></th></tr></thead>
        <tbody>
          ${clients.map((c) => `
            <tr data-id="${c.id}">
              <td><div class="name-cell"><span class="avatar-dot">${ICONS.users}</span>${escapeHtml(c.name)}</div></td>
              <td>
                ${c.email ? `<div class="contact-line">${ICONS.mail}${escapeHtml(c.email)}</div>` : ''}
                ${c.phone ? `<div class="contact-line">${ICONS.phone}${escapeHtml(c.phone)}</div>` : ''}
              </td>
              <td class="cell-muted">${escapeHtml(c.notes) || '&mdash;'}</td>
              <td class="actions-cell">
                <button class="btn-icon edit-client" data-id="${c.id}">${ICONS.pencil}</button>
                <button class="btn-icon danger delete-client" data-id="${c.id}">${ICONS.trash}</button>
              </td>
            </tr>
          `).join('')}
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
  const bodyHtml = `
    <form id="client-form">
      <div class="form-field"><label>Nome *</label><input type="text" name="name" value="${client ? escapeHtml(client.name) : ''}" required /></div>
      <div class="form-grid">
        <div class="form-field"><label>Email</label><input type="email" name="email" value="${client ? escapeHtml(client.email) : ''}" /></div>
        <div class="form-field"><label>Telefone</label><input type="text" name="phone" value="${client ? escapeHtml(client.phone) : ''}" /></div>
      </div>
      <div class="form-field"><label>Observacoes</label><textarea name="notes">${client ? escapeHtml(client.notes) : ''}</textarea></div>
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
      const payload = { name: fd.get('name'), email: fd.get('email'), phone: fd.get('phone'), notes: fd.get('notes') };
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
      <div><h1>Servicos</h1><p>Gerencie os servicos oferecidos</p></div>
      <button class="btn btn-primary" id="new-svc-btn">${ICONS.plus} Novo Servico</button>
    </div>
    ${services.length === 0 ? `<div class="card"><div class="empty-state">Nenhum servico cadastrado.</div></div>` : `
    <div class="services-grid">
      ${services.map((s) => `
        <div class="service-card" data-id="${s.id}">
          ${s.photoDataUrl ? `<div class="service-img-wrap"><img src="${escapeHtml(s.photoDataUrl)}" alt="${escapeHtml(s.name)}" class="service-img"/></div>` : ''}
          <span class="category-tag">${escapeHtml(s.category)}</span>
          <h3>${escapeHtml(s.name)}</h3>
          <p>${escapeHtml(s.description)}</p>
          <div class="service-footer">
            <span class="service-price">${formatMoney(s.price)}</span>
            <span class="service-duration">${ICONS.clock} ${s.durationMinutes} min</span>
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
    if (!confirm('Excluir este servico?')) return;
    try { await api('DELETE', `/api/services/${btn.dataset.id}`); toast('Servico excluido.'); renderServicosPage(); }
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
        <div class="form-field"><label>Categoria</label><input type="text" name="category" placeholder="Ex: Cabelo, Barba..." value="${svc ? escapeHtml(svc.category) : ''}" /></div>
        <div class="form-field"><label>Nome *</label><input type="text" name="name" value="${svc ? escapeHtml(svc.name) : ''}" required /></div>
      </div>
      <div class="form-field"><label>Descricao</label><textarea name="description">${svc ? escapeHtml(svc.description) : ''}</textarea></div>
      <div class="form-grid">
        <div class="form-field"><label>Preco (R$)</label><input type="number" step="0.01" name="price" value="${svc ? svc.price : ''}" /></div>
        <div class="form-field"><label>Duracao (min) <span class="optional">(opcional)</span></label><input type="number" name="durationMinutes" value="${svc ? svc.durationMinutes : ''}" /></div>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" id="cancel-svc">Cancelar</button>
        <button type="submit" class="btn btn-primary">${isEdit ? 'Salvar Alteracoes' : 'Criar Servico'}</button>
      </div>
    </form>
  `;
  showModal(isEdit ? 'Editar Servico' : 'Novo Servico', bodyHtml, (overlay) => {
    overlay.querySelector('#cancel-svc').addEventListener('click', closeModal);
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
        category: fd.get('category'), name: fd.get('name'), description: fd.get('description'),
        price: fd.get('price'), durationMinutes: fd.get('durationMinutes'), photoDataUrl
      };
      try {
        if (isEdit) await api('PUT', `/api/services/${svc.id}`, payload);
        else await api('POST', '/api/services', payload);
        closeModal();
        toast(isEdit ? 'Servico atualizado.' : 'Servico criado.');
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
  const portalUrl = `${location.origin}/loja/${est.id}`;
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
      <h3 style="margin:0 0 4px 0;font-size:17px;">${ICONS.creditCard} Pagamentos - AbacatePay</h3>
      <p style="color:var(--text-muted);font-size:13px;margin:0 0 18px 0;">Configure sua API key para cobrar clientes via PIX e cartao diretamente nos agendamentos.</p>
      <form id="abacatepay-form">
        <div class="form-field">
          <label>API Key</label>
          <input type="password" name="abacatePayApiKey" id="abacatepay-key-input" placeholder="Cole sua API key aqui" />
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <button type="submit" class="btn btn-primary">Salvar API Key</button>
          <button type="button" class="btn btn-secondary" id="abacatepay-remove-btn">Remover API Key</button>
          <span id="abacatepay-status" style="font-size:13px;color:var(--text-muted);"></span>
        </div>
      </form>
      <p style="margin-top:12px;font-size:12px;color:var(--text-muted);">
        Obtenha sua API key em <a href="https://abacatepay.com" target="_blank" rel="noopener">abacatepay.com</a>
      </p>
    </div>
    <div class="card settings-card">
      <div class="page-header" style="align-items:flex-start;gap:12px;flex-wrap:wrap;">
        <div><h2>Usuarios do Estabelecimento</h2><p>Gerencie contas de acesso para este tenant</p></div>
        <button class="btn btn-primary" id="new-user-btn">${ICONS.plus} Novo Usuario</button>
      </div>
      <div id="users-table-container"><div class="loading-state">Carregando usuarios...</div></div>
    </div>
  `;
  document.getElementById('open-portal-btn').addEventListener('click', () => window.open(portalUrl, '_blank'));
  (async () => {
    try {
      const status = await api('GET', '/api/payments/api-key');
      const statusEl = document.getElementById('abacatepay-status');
      if (statusEl) {
        statusEl.textContent = status.configured ? 'API key configurada (' + status.masked + ')' : 'Nao configurada';
        statusEl.style.color = status.configured ? '#10b981' : 'var(--text-muted)';
      }
    } catch (e) { /* ignore */ }
  })();
  document.getElementById('abacatepay-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const key = fd.get('abacatePayApiKey');
    if (!key) return toast('Informe a API key.', true);
    try {
      await api('PUT', '/api/payments/api-key', { apiKey: key });
      toast('API key do AbacatePay salva.');
      const statusEl = document.getElementById('abacatepay-status');
      if (statusEl) {
        statusEl.textContent = 'API key configurada (...' + key.slice(-6) + ')';
        statusEl.style.color = '#10b981';
      }
      document.getElementById('abacatepay-key-input').value = '';
    } catch (err) { toast(err.message, true); }
  });
  document.getElementById('abacatepay-remove-btn').addEventListener('click', async () => {
    if (!confirm('Remover a API key do AbacatePay? O pagamento PIX sera desativado no portal.')) return;
    try {
      await api('DELETE', '/api/payments/api-key');
      toast('API key removida.');
      const statusEl = document.getElementById('abacatepay-status');
      if (statusEl) {
        statusEl.textContent = 'Nao configurada';
        statusEl.style.color = 'var(--text-muted)';
      }
      document.getElementById('abacatepay-key-input').value = '';
    } catch (err) { toast(err.message, true); }
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
  document.getElementById('new-user-btn').addEventListener('click', openNewUserModal);
  setupAppearanceUI();
  loadEstablishmentUsers();
  setupBusinessHoursUI();
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
        <thead><tr><th>Nome</th><th>Email</th><th>Perfil</th><th>Acesso</th><th></th></tr></thead>
        <tbody>
          ${users.map((user) => {
            const isGlobal = user.role === 'admin' && (user.allowedEstablishmentIds === null || user.allowedEstablishmentIds === undefined);
            const accessBadge = isGlobal
              ? '<span class="access-badge access-global" title="Acesso a todos os estabelecimentos">Global</span>'
              : '<span class="access-badge access-local" title="Acesso somente a este estabelecimento">Este estab.</span>';
            const canDelete = user.id !== currentUser.id && !isGlobal;
            return `
            <tr>
              <td>${escapeHtml(user.name)}${user.id === currentUser.id ? ' <span class="tag">Voce</span>' : ''}</td>
              <td>${escapeHtml(user.email)}</td>
              <td><span class="role-badge ${user.role === 'admin' ? '' : 'func'}">${escapeHtml(user.role || 'operator')}</span></td>
              <td>${accessBadge}</td>
              <td>${canDelete ? `<button class="btn-icon danger delete-user-btn" data-id="${user.id}" title="Remover deste estabelecimento">${ICONS.trash}</button>` : ''}</td>
            </tr>
          `;
          }).join('')}
        </tbody>
      </table>
    `;
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

function openNewUserModal() {
  const bodyHtml = `
    <form id="new-user-form">
      <div class="form-field"><label>Nome *</label><input type="text" name="name" required /></div>
      <div class="form-field"><label>Email *</label><input type="email" name="email" required /></div>
      <div class="form-field"><label>Senha *</label><input type="password" name="password" required /></div>
      <div class="form-field"><label>Perfil</label>
        <select name="role">
          <option value="operator" selected>Operador</option>
          <option value="admin">Administrador</option>
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
        await api('POST', '/api/users', {
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

const BACKUP_TYPE_LABEL = { manual: 'Manual', auto: 'Automatico', 'pre-restore': 'Pre-restauro' };

async function loadBackupsList() {
  const container = document.getElementById('backups-list-container');
  const statusEl = document.getElementById('backups-status');
  if (!container) return;
  container.innerHTML = '<div class="loading-state">Carregando backups...</div>';
  try {
    const data = await api('GET', '/api/backups');
    if (statusEl) {
      statusEl.innerHTML = `
        <span class="pill ${data.config.autoEnabled ? 'pill-pago' : 'pill-pendente'}">${data.config.autoEnabled ? `${ICONS.clock} Automatico a cada ${data.config.intervalHours}h` : 'Automatico desativado'}</span>
        <span class="cell-muted">Retencao automatica: ate ${data.config.maxFiles} backups &middot; Total: <strong>${formatFileSize(data.totalSize)}</strong> em ${data.backups.length} arquivo(s)</span>
      `;
    }
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
      <button class="btn btn-primary" id="create-backup-btn">${ICONS.archive} Criar Backup Agora</button>
    </div>
    <div class="card settings-card" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
      <div id="backups-status" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;"><span class="cell-muted">Carregando status...</span></div>
    </div>
    <div class="hint-box">O backup automatico roda sozinho a cada periodo e mantem os mais recentes. Restaurar substitui os arquivos atuais pelos do zip — um "Pre-restauro" e criado automaticamente antes, e reiniciar o servidor depois garante que o codigo restaurado entre em vigor.</div>
    <div class="card settings-card" id="backups-list-container"></div>
  `;

  document.getElementById('create-backup-btn').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    btn.innerHTML = `${ICONS.archive} Criando...`;
    try {
      await api('POST', '/api/backups');
      toast('Backup criado com sucesso!');
    } catch (err) {
      toast(err.message, true);
    }
    btn.disabled = false;
    btn.innerHTML = `${ICONS.archive} Criar Backup Agora`;
    loadBackupsList();
  });

  loadBackupsList();
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
    <div class="card settings-card">
      <div class="page-header" style="align-items:flex-start;gap:12px;flex-wrap:wrap;">
        <div>
          <h2>${ICONS.users} Gerenciar Usuarios do Sistema</h2>
          <p>Administre todos os usuarios cadastrados (apenas admin)</p>
        </div>
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
    loadAdminUsers();
  }
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

    container.innerHTML = `
      <div class="users-table-wrap">
        <table class="mini-table users-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Perfil</th>
              <th>Acesso</th>
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
                const matchedNames = ests
                  .filter((est) => user.allowedEstablishmentIds.includes(est.id))
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
                <td class="cell-muted">${user.passwordChangedAt ? formatDateTime(user.passwordChangedAt) : '<span class="pill pill-pendente">Nunca</span>'}</td>
                <td class="col-actions">
                  <div class="row-actions">
                    <button class="action-btn action-btn-blue reset-pwd-btn" data-id="${user.id}" data-name="${escapeHtml(user.name)}" title="Resetar senha">
                      ${ICONS.lock}
                    </button>
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

boot();
