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
  upload: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3"/></svg>',
  sun: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4.5"/><path d="M12 1.5v3M12 19.5v3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M1.5 12h3M19.5 12h3M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1"/></svg>',
  moon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A9 9 0 1111.2 3a7 7 0 109.8 9.8z"/></svg>',
  shield: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l9 4v6c0 5.5-4 10.6-9 12-5-1.4-9-6.5-9-12V6z"/><path d="M9 12l2 2 4-4"/></svg>',
  lock: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 118 0v4"/></svg>'
};

const NICHE_ICON = {
  'Barbearia': ICONS.scissors,
  'Pizzaria': ICONS.pizza,
  'Lava Jato': ICONS.car
};
function nicheIcon(niche) { return NICHE_ICON[niche] || ICONS.store; }

// ---------- state ----------
let currentUser = null;
let currentEstablishment = null;
let establishments = [];

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
  render();
}

window.addEventListener('hashchange', () => {
  if (!currentUser) return;
  if (currentEstablishment) return renderAppShell();
  // Sem estabelecimento: renderiza a pagina correta baseada na hash
  const route = currentRoute();
  if (route === '#/senhas') return renderSenhasPage();
  if (route === '#/seguranca') return renderSegurancaPage();
  renderSelector();
});

function render() {
  if (!currentUser) return renderLogin();

  // Paginas que nao precisam de estabelecimento selecionado
  if (!currentEstablishment) {
    const route = currentRoute();
    if (route === '#/senhas') return renderSenhasPage();
    if (route === '#/seguranca') return renderSegurancaPage();
    return renderSelector();
  }

  return renderAppShell();
}

// ================= LOGIN =================
function renderLogin(errorMsg) {
  root.innerHTML = `
    <div class="centered-screen">
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
  // Limpa o hash da URL para evitar acesso a paginas internas
  location.hash = '';
  render();
}

// ================= ESTABLISHMENT SELECTOR =================
async function renderSelector() {
  root.innerHTML = `<div class="loading-state">Carregando estabelecimentos...</div>`;
  try {
    establishments = await api('GET', '/api/establishments');
  } catch (e) {
    return renderLogin('Sessao expirada, entre novamente.');
  }

  root.innerHTML = `
    <div class="selector-screen">
      <div class="selector-top">
        <span class="suite-pill">${ICONS.store} Multi-Tenant SaaS</span>
        <h1>Escolha um estabelecimento</h1>
        <p>Selecione um tenant para acessar o painel de gestao</p>
      </div>
      <div class="selector-grid" id="selector-grid"></div>
      <div class="selector-actions">
        ${currentUser && currentUser.role === 'admin' ? `
          <a href="#/senhas" class="btn btn-secondary">${ICONS.lock} Usuarios e Senhas</a>
          <a href="#/seguranca" class="btn btn-secondary">${ICONS.shield} Inspecao de Seguranca</a>
        ` : ''}
        <button class="btn btn-secondary" id="selector-logout">${ICONS.arrowRight} Sair</button>
      </div>
    </div>
  `;

  const grid = document.getElementById('selector-grid');
  grid.innerHTML = establishments.map((est) => `
    <div class="tenant-card">
      <div class="brand-icon" style="margin-bottom:14px;">${est.logoDataUrl ? `<img src="${est.logoDataUrl}"/>` : nicheIcon(est.niche)}</div>
      <div class="niche-tag">${escapeHtml(est.niche)}</div>
      <h3>${escapeHtml(est.name)}</h3>
      <p class="desc">${escapeHtml(est.description || '')}</p>
      <div class="tenant-footer">
        <span>${escapeHtml(est.phone || '')}</span>
        <div class="tenant-actions">
          ${currentUser && currentUser.role === 'admin' ? `
            <button class="access-link" data-id="${est.id}" data-action="login">Acessar ${ICONS.arrowRight}</button>
          ` : `
            <button class="access-link" data-id="${est.id}">Acessar ${ICONS.arrowRight}</button>
          `}
          <button class="btn-icon danger delete-tenant-btn" data-id="${est.id}" title="Excluir estabelecimento">${ICONS.trash}</button>
        </div>
        ${currentUser && (currentUser.role === 'admin' || currentUser.allowedEstablishmentIds === null) ? `<button class="btn btn-secondary create-user-btn" data-id="${est.id}">Criar acesso</button>` : ''}
      </div>
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
  grid.querySelectorAll('.create-user-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const est = establishments.find((item) => item.id === btn.dataset.id);
      if (!est) return;
      openCreateUserModal(est);
    });
  });
  document.getElementById('new-tenant-card').addEventListener('click', openNewEstablishmentModal);
  document.getElementById('selector-logout').addEventListener('click', logout);
}

function renderSelectorPublic() {
  root.innerHTML = `<div class="loading-state">Carregando estabelecimentos...</div>`;
  return api('GET', '/api/establishments').then((list) => {
    establishments = list;
    root.innerHTML = `
      <div class="selector-screen">
        <div class="selector-top">
          <span class="suite-pill">${ICONS.store} Multi-Tenant SaaS</span>
          <h1>Escolha um estabelecimento</h1>
          <p>Selecione um tenant para acessar o painel de gestao</p>
        </div>
        <div class="selector-grid" id="selector-grid"></div>
      </div>
    `;

    const grid = document.getElementById('selector-grid');
    grid.innerHTML = establishments.map((est) => `
      <div class="tenant-card">
        <div class="brand-icon" style="margin-bottom:14px;">${est.logoDataUrl ? `<img src="${est.logoDataUrl}"/>` : nicheIcon(est.niche)}</div>
        <div class="niche-tag">${escapeHtml(est.niche)}</div>
        <h3>${escapeHtml(est.name)}</h3>
        <p class="desc">${escapeHtml(est.description || '')}</p>
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
        <select name="niche" required>
          <option value="Barbearia">Barbearia</option>
          <option value="Pizzaria">Pizzaria</option>
          <option value="Lava Jato">Lava Jato</option>
          <option value="Salao de Beleza">Salao de Beleza</option>
          <option value="Oficina">Oficina</option>
          <option value="Petshop">Petshop</option>
          <option value="Outro">Outro</option>
        </select>
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
  { hash: '#/senhas', label: 'Senhas', icon: ICONS.lock },
  { hash: '#/seguranca', label: 'Seguranca', icon: ICONS.shield }
];

function currentRoute() {
  return location.hash && location.hash !== '#' ? location.hash : '#/dashboard';
}

function renderAppShell() {
  if (!location.hash) location.hash = '#/dashboard';
  const route = currentRoute();

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
          ${NAV_ITEMS.map((item) => `
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
    '#/senhas': renderSenhasPage,
    '#/seguranca': renderSegurancaPage
  };
  (pageRenderers[route] || renderDashboardPage)();
}

function mainEl() { return document.getElementById('main-content'); }

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
          <span class="category-tag">${escapeHtml(s.category)}</span>
          <h3>${escapeHtml(s.name)}</h3>
          <p>${escapeHtml(s.description)}</p>
          <div class="service-footer">
            <span class="service-price">${formatMoney(s.price)}</span>
            <span class="service-duration">${ICONS.clock} ${s.durationMinutes} min</span>
          </div>
          <div class="actions-cell" style="margin-top:12px;justify-content:flex-start;">
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
        <label class="btn btn-secondary" style="cursor:pointer;">
          ${ICONS.upload} Carregar foto
          <input type="file" accept="image/*" id="svc-logo-input" style="display:none;" />
        </label>
      </div>
      <div class="form-grid">
        <div class="form-field"><label>Categoria</label><input type="text" name="category" placeholder="Ex: Cabelo, Barba..." value="${svc ? escapeHtml(svc.category) : ''}" /></div>
        <div class="form-field"><label>Nome *</label><input type="text" name="name" value="${svc ? escapeHtml(svc.name) : ''}" required /></div>
      </div>
      <div class="form-field"><label>Descricao</label><textarea name="description">${svc ? escapeHtml(svc.description) : ''}</textarea></div>
      <div class="form-grid">
        <div class="form-field"><label>Preco (R$)</label><input type="number" step="0.01" name="price" value="${svc ? svc.price : ''}" /></div>
        <div class="form-field"><label>Duracao (min)</label><input type="number" name="durationMinutes" value="${svc ? svc.durationMinutes : ''}" /></div>
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
        photoDataUrl = reader.result;
        overlay.querySelector('#svc-logo-preview').innerHTML = `<img src="${photoDataUrl}"/>`;
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
function renderConfiguracoesPage() {
  const est = currentEstablishment;
  const portalUrl = `${location.origin}/loja/${est.id}`;
  const DAY_NAMES = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  const hours = est.businessHours || {};
  mainEl().innerHTML = `
    <div class="page-header">
      <div><h1>Configuracoes</h1><p>Gerencie as informacoes de ${escapeHtml(est.name)}</p></div>
    </div>
    <div class="settings-banner">
      <div class="brand-icon">${est.logoDataUrl ? `<img src="${est.logoDataUrl}"/>` : nicheIcon(est.niche)}</div>
      <div><h2>${escapeHtml(est.name)}</h2><p>${escapeHtml(est.niche)}</p></div>
    </div>
    <div class="card settings-card">
      <form id="settings-form">
        <div class="form-field"><label>Nome do Estabelecimento</label><input type="text" name="name" value="${escapeHtml(est.name)}" /></div>
        <div class="form-field"><label>Descricao</label><textarea name="description">${escapeHtml(est.description)}</textarea></div>
        <div class="form-grid">
          <div class="form-field"><label>${ICONS.phone} Telefone</label><input type="text" name="phone" value="${escapeHtml(est.phone)}" /></div>
          <div class="form-field"><label>Endereco</label><input type="text" name="address" value="${escapeHtml(est.address)}" /></div>
        </div>
        <div style="text-align:right;">
          <button type="submit" class="btn btn-primary">Salvar Alteracoes</button>
        </div>
      </form>
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
      <div class="page-header" style="align-items:flex-start;gap:12px;flex-wrap:wrap;">
        <div><h2>Usuarios do Estabelecimento</h2><p>Gerencie contas de acesso para este tenant</p></div>
        <button class="btn btn-primary" id="new-user-btn">${ICONS.plus} Novo Usuario</button>
      </div>
      <div id="users-table-container"><div class="loading-state">Carregando usuarios...</div></div>
    </div>
  `;
  document.getElementById('open-portal-btn').addEventListener('click', () => window.open(portalUrl, '_blank'));
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
  loadEstablishmentUsers();
  setupBusinessHoursUI();
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
        <thead><tr><th>Nome</th><th>Email</th><th>Perfil</th><th></th></tr></thead>
        <tbody>
          ${users.map((user) => `
            <tr>
              <td>${escapeHtml(user.name)}${user.id === currentUser.id ? ' <span class="tag">Voce</span>' : ''}</td>
              <td>${escapeHtml(user.email)}</td>
              <td>${escapeHtml(user.role || 'operator')}</td>
              <td>${user.id === currentUser.id ? '' : `<button class="btn btn-secondary danger delete-user-btn" data-id="${user.id}">${ICONS.trash}</button>`}</td>
            </tr>
          `).join('')}
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

// ================= Pagina de Senhas (Gerenciamento de Senhas) =================
async function renderSenhasPage() {
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

    container.innerHTML = `
      <table class="mini-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Email</th>
            <th>Perfil</th>
            <th>Acesso</th>
            <th>Ultima Troca de Senha</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${users.map((user) => {
            let accessText = '';
            if (user.allowedEstablishmentIds === null) {
              accessText = '<span class="pill" style="background:#e3f2fd;color:#0d47a1;border:none;">Global</span>';
            } else {
              const matchedNames = ests
                .filter((est) => user.allowedEstablishmentIds.includes(est.id))
                .map((est) => est.name);
              accessText = matchedNames.length > 0 
                ? matchedNames.map(name => `<span class="pill" style="background:var(--bg-muted);color:var(--text-color);margin-right:4px;">${escapeHtml(name)}</span>`).join('') 
                : '<span class="pill pill-cancelado">Nenhum</span>';
            }

            return `
              <tr>
                <td class="cell-strong">${escapeHtml(user.name)}</td>
                <td>${escapeHtml(user.email)}</td>
                <td><span class="role-badge ${user.role === 'admin' ? '' : 'func'}">${escapeHtml(user.role)}</span></td>
                <td>${accessText}</td>
                <td class="cell-muted">${user.passwordChangedAt ? formatDateTime(user.passwordChangedAt) : '<span class="pill pill-pendente">Nunca</span>'}</td>
                <td style="display:flex;gap:6px;flex-wrap:wrap;">
                  <button class="btn btn-secondary reset-pwd-btn" data-id="${user.id}" data-name="${escapeHtml(user.name)}">
                    ${ICONS.lock} Resetar
                  </button>
                  <button class="btn btn-secondary associate-btn" data-id="${user.id}" data-name="${escapeHtml(user.name)}" data-allowed='${JSON.stringify(user.allowedEstablishmentIds)}'>
                    ${ICONS.globe} Associar
                  </button>
                  ${user.id === currentUser.id ? '' : `
                    <button class="btn btn-secondary danger delete-user-btn" data-id="${user.id}" data-name="${escapeHtml(user.name)}">
                      ${ICONS.trash} Excluir
                    </button>
                  `}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;

    container.querySelectorAll('.reset-pwd-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        openResetPasswordModal(btn.dataset.id, btn.dataset.name);
      });
    });

    container.querySelectorAll('.associate-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const allowed = JSON.parse(btn.dataset.allowed);
        openAssociateModal(btn.dataset.id, btn.dataset.name, allowed);
      });
    });

    container.querySelectorAll('.delete-user-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm(`Deseja realmente excluir o usuário "${btn.dataset.name}" do sistema?`)) return;
        try {
          await api('DELETE', `/api/password/admin-delete/${btn.dataset.id}`);
          toast('Usuário excluído com sucesso!');
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

function openAssociateModal(userId, userName, currentAllowedIds) {
  api('GET', '/api/establishments').then((ests) => {
    const isGlobal = currentAllowedIds === null;
    const bodyHtml = `
      <form id="associate-form">
        <p>Associar estabelecimentos para: <strong>${escapeHtml(userName)}</strong></p>
        
        <div class="form-field" style="margin-bottom:14px;">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
            <input type="checkbox" id="global-access-chk" ${isGlobal ? 'checked' : ''} />
            <strong>Acesso Global (Todos os estabelecimentos)</strong>
          </label>
        </div>
        
        <div id="establishments-checklist-container" style="${isGlobal ? 'display:none;' : ''}">
          <label style="display:block;margin-bottom:8px;font-weight:600;">Selecione os estabelecimentos permitidos:</label>
          <div style="max-height: 200px; overflow-y: auto; padding: 10px; border: 1px solid var(--border-color); border-radius: 6px; display: flex; flex-direction: column; gap: 8px;">
            ${ests.map((est) => {
              const checked = Array.isArray(currentAllowedIds) && currentAllowedIds.includes(est.id);
              return `
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
                  <input type="checkbox" class="est-chk" value="${est.id}" ${checked ? 'checked' : ''} />
                  <span>${escapeHtml(est.name)} (${escapeHtml(est.niche)})</span>
                </label>
              `;
            }).join('')}
          </div>
        </div>
        
        <div class="modal-actions" style="margin-top:20px;">
          <button type="button" class="btn btn-secondary" id="cancel-associate">Cancelar</button>
          <button type="submit" class="btn btn-primary">Salvar Associação</button>
        </div>
      </form>
    `;
    showModal('Associar Estabelecimentos', bodyHtml, (overlay) => {
      const globalChk = overlay.querySelector('#global-access-chk');
      const checklistContainer = overlay.querySelector('#establishments-checklist-container');
      
      globalChk.addEventListener('change', () => {
        checklistContainer.style.display = globalChk.checked ? 'none' : 'block';
      });
      
      overlay.querySelector('#cancel-associate').addEventListener('click', closeModal);
      overlay.querySelector('#associate-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        let allowedEstablishmentIds = null;
        if (!globalChk.checked) {
          allowedEstablishmentIds = Array.from(overlay.querySelectorAll('.est-chk:checked')).map((el) => el.value);
        }
        
        try {
          await api('PUT', `/api/password/admin-associate/${userId}`, { allowedEstablishmentIds });
          closeModal();
          toast('Associação atualizada com sucesso!');
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
