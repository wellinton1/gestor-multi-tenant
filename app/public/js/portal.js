/* Portal do Cliente - pagina publica de agendamento (sem login) */

const root = document.getElementById('portal-root');

// CSRF token helper
function getCsrfToken() {
  const match = document.cookie.match(/(?:^|;\s*)gestor\.csrf=([^;]*)/);
  return match ? match[1] : null;
}

const NICHE_ICON = {
  'Barbearia': '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><path d="M8.5 8l11 8M8.5 16l11-8"/></svg>',
  'Pizzaria': '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 5l9-3 9 3-9 16z"/><circle cx="12" cy="9" r="1" fill="currentColor"/><circle cx="9" cy="13" r="1" fill="currentColor"/><circle cx="15" cy="13" r="1" fill="currentColor"/></svg>',
  'Lava Jato': '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 13l1.5-5A2 2 0 016.4 6.5h11.2A2 2 0 0119.5 8L21 13v5a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1H6v1a1 1 0 01-1 1H4a1 1 0 01-1-1z"/><circle cx="7" cy="16.5" r="1.4"/><circle cx="17" cy="16.5" r="1.4"/></svg>',
  'Salao de Beleza': '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/><path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8z"/></svg>',
  'Doces e Salgados': '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 21h16v-7H4z"/><path d="M4 14c0-3 2-5 8-5s8 2 8 5"/><path d="M9 5c0-1 1-2 3-2s3 1 3 2"/><path d="M12 5v3"/></svg>',
  'Oficina': '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a4 4 0 00-5.4 5l-6 6 2.4 2.4 6-6a4 4 0 005-5.4l-2.6 2.6-2-2z"/></svg>',
  'Petshop': '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="5.5" cy="11" r="2"/><circle cx="9" cy="7" r="2"/><circle cx="15" cy="7" r="2"/><circle cx="18.5" cy="11" r="2"/><path d="M8 16c0-2 1.8-3.5 4-3.5s4 1.5 4 3.5-1.8 4-4 4-4-2-4-4z"/></svg>'
};
const DEFAULT_ICON = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l1-5h16l1 5"/><path d="M4 9h16v10H4z"/><path d="M9 19v-5h6v5"/></svg>';
const PHONE_ICON = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h4l2 5-2.5 1.5a11 11 0 005 5L14 13l5 2v4a2 2 0 01-2 2A16 16 0 014 6a2 2 0 012-2z"/></svg>';
const PIN_ICON = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7-6.5-7-11a7 7 0 0114 0c0 4.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.3"/></svg>';
const CLOCK_ICON = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>';
const CHECK_ICON = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M20 6L9 17l-5-5"/></svg>';
const PIX_ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M6 15h4"/></svg>';
const CARD_ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 9h20"/><path d="M6 14h4"/><path d="M14 14h4"/></svg>';

function escapeHtml(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}
function hexToRgb(hex) {
  const m = /^#?([a-f\d]{6})$/i.exec(hex);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}
function shade(hex, factor) {
  const m = /^#?([a-f\d]{6})$/i.exec(hex || '');
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const r = Math.max(0, Math.min(255, Math.round(((n >> 16) & 255) * (1 + factor))));
  const g = Math.max(0, Math.min(255, Math.round(((n >> 8) & 255) * (1 + factor))));
  const b = Math.max(0, Math.min(255, Math.round((n & 255) * (1 + factor))));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}
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
function formatMoney(v) {
  const n = Number(v) || 0;
  return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDuration(minutes) {
  const total = Number(minutes) || 0;
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

function getEstablishmentId() {
  const parts = location.pathname.split('/').filter(Boolean);
  // expects /loja/:id
  return parts[1] || parts[0];
}

function captureBookingDraft() {
  const form = document.getElementById('booking-form');
  const draft = {};
  if (!form) return draft;
  form.querySelectorAll('input, textarea').forEach((el) => {
    if (el.name && el.type !== 'hidden') draft[el.name] = el.value;
  });
  return draft;
}

function restoreBookingDraft(draft) {
  const form = document.getElementById('booking-form');
  if (!form || !draft) return;
  form.querySelectorAll('input, textarea').forEach((el) => {
    if (el.name && el.type !== 'hidden' && !el.value && draft[el.name]) el.value = draft[el.name];
  });
}

let establishment = null;
let selectedServices = [];
let bookingCooldown = 0;
let bookingCooldownTimer = null;
let selectedTime = null;
let availableSlots = [];
let loadingSlots = false;
let appliedCoupon = null;

async function boot() {
  const id = getEstablishmentId();
  root.innerHTML = `<div class="loading-state">Carregando...</div>`;
  try {
    const res = await fetch(`/api/portal/${id}`);
    if (!res.ok) throw new Error('nao encontrado');
    establishment = await res.json();
  } catch (e) {
    root.innerHTML = `<div class="empty-state">Estabelecimento nao encontrado.</div>`;
    return;
  }
  applyTheme();
  renderPage();
}

// Aplica o tema premium do nicho da loja. So carrega o CSS daquele tema.
function applyTheme() {
  const theme = establishment && establishment.theme ? establishment.theme : 'generico';
  // tokens-base e sempre carregado primeiro (HTML ja linka).
  // Aqui injetamos so o tema ativo.
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/themes/' + encodeURIComponent(theme) + '.css';
  link.dataset.themeAsset = theme;
  document.head.appendChild(link);
  document.body.dataset.theme = theme;
  // Cor de destaque: o backend já resolveu accentOverride para um hex aplicável.
  if (establishment && establishment.accentColor) {
    applyAccentColor(establishment.accentColor);
  }
}

function renderPage() {
  if (!establishment) return;
  document.body.dataset.niche = establishment.niche || 'Outro';
  const services = Array.isArray(establishment.services) ? establishment.services : [];
  const safeSelectedServices = Array.isArray(selectedServices) ? selectedServices : [];
  const icon = NICHE_ICON[establishment.niche] || DEFAULT_ICON;
  const subtotal = safeSelectedServices.reduce((sum, item) => sum + (item?.price || 0) * (item?.qty || 0), 0);
  const itemCount = safeSelectedServices.reduce((sum, item) => sum + (item?.qty || 0), 0);
  const cooldownActive = bookingCooldown > 0;
  const needsDelivery = safeSelectedServices.some((item) => item?.itemType === 'Produto');
  const draft = captureBookingDraft();

  function safeMap(arr, fn) {
    if (!Array.isArray(arr) || typeof fn !== 'function') return '';
    return arr.map(fn).join('');
  }

  root.innerHTML = `
    <div class="portal-page">
      <div class="portal-hero">
        <div class="hero-badge">${escapeHtml(establishment.niche)}</div>
        <div class="hero-brand">${establishment.logoDataUrl ? `<img src="${establishment.logoDataUrl}"/>` : icon}</div>
        <h1>${escapeHtml(establishment.name)}</h1>
        ${establishment.description ? `<p class="desc">${escapeHtml(establishment.description)}</p>` : ''}
        <div class="portal-contact">
          ${establishment.phone ? `<span>${PHONE_ICON} ${escapeHtml(establishment.phone)}</span>` : ''}
          ${establishment.address ? `<a class="portal-contact-link" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(establishment.address)}" target="_blank" rel="noopener" title="Abrir no Google Maps">${PIN_ICON} ${escapeHtml(establishment.address)}</a>` : ''}
        </div>
      </div>
      <div class="portal-body">
        <div class="portal-columns">
          <section class="portal-card portal-card-main">
            <div class="card-header">1. Escolha os serviços</div>
            <div class="portal-description">Selecione os serviços que deseja agendar e ajuste as quantidades com estilo.</div>
            <div class="portal-services-grid" id="services-list">
              ${safeMap(services, (s) => {
                const selected = selectedServices.find((item) => item.id === s.id);
                const isProduct = s.itemType === 'Produto';
                return `
                  <div class="portal-service-option ${selected ? 'selected' : ''}" data-id="${s.id}">
                    ${s.photoDataUrl ? `<div class="service-image"><img src="${s.photoDataUrl}" alt="${escapeHtml(s.name)}" /></div>` : ''}
                    <div class="service-card-top">
                      <div class="service-badge">${escapeHtml(s.category || 'Serviço')}${isProduct ? ' · Produto' : ''}</div>
                      <strong class="svc-name">${escapeHtml(s.name)}</strong>
                      ${s.description ? `<div class="svc-desc">${escapeHtml(s.description)}</div>` : ''}
                    </div>
                    <div class="service-card-bottom">
                      <div class="svc-meta">
                        <span>${formatMoney(s.price)}</span>
                        <span>${isProduct ? 'Entrega' : formatDuration(s.durationMinutes)}</span>
                      </div>
                      <button type="button" class="service-action-btn">${selected ? 'Remover' : '+ Adicionar'}</button>
                    </div>
                  </div>
                `;
              })}
            </div>
          </section>

          <aside class="portal-card portal-booking-panel" id="booking-card">
            <div class="booking-panel-header">
              <div>
                <div class="portal-summary-title">Seu pedido</div>
                <div class="portal-summary-subtitle">Reveja e confirme o agendamento.</div>
              </div>
              <div class="portal-summary-meta">${itemCount} item${itemCount === 1 ? '' : 's'} · ${formatMoney(subtotal)}</div>
            </div>
            <div class="portal-summary" id="portal-summary">
              ${safeSelectedServices.length === 0 ? '<p style="color:var(--text-muted);font-size:14px;">Escolha um ou mais serviços para ver o resumo aqui.</p>' : safeMap(safeSelectedServices, (item) => `
                <div class="portal-summary-item">
                  <div>
                    <strong>${escapeHtml(item.name)}</strong>
                    <div class="svc-desc">${formatMoney(item.price)} cada</div>
                  </div>
                  <div class="portal-summary-controls">
                    <button type="button" class="qty-btn" data-action="decrease" data-id="${item.id}">−</button>
                    <span>${item.qty}</span>
                    <button type="button" class="qty-btn" data-action="increase" data-id="${item.id}">+</button>
                  </div>
                </div>
              `)}
              ${appliedCoupon ? `
                <div class="portal-discount-row" style="display:flex;justify-content:space-between;margin:8px 0;padding-top:8px;border-top:1px solid var(--border,#e5e5e5);color:#10b981;font-weight:600;">
                  <span>Desconto (${escapeHtml(appliedCoupon.code)}):</span>
                  <span>− ${formatMoney(appliedCoupon.discount)}</span>
                </div>
                <div class="portal-total" style="color:var(--text);">Total: <strong>${formatMoney(subtotal - appliedCoupon.discount)}</strong></div>
              ` : `
                <div class="portal-total">Total: <strong>${formatMoney(subtotal)}</strong></div>
              `}
            </div>
            <form id="booking-form" class="portal-booking-form">
              <div class="form-field"><label>Nome completo *</label><input type="text" name="clientName" required ${cooldownActive ? 'disabled' : ''} /></div>
              <div class="form-grid">
                <div class="form-field"><label>Telefone (WhatsApp) *</label><input type="text" name="clientPhone" required placeholder="(11) 99999-9999" ${cooldownActive ? 'disabled' : ''} /></div>
                <div class="form-field"><label>Email</label><input type="email" name="clientEmail" ${cooldownActive ? 'disabled' : ''} /></div>
              </div>
              ${needsDelivery ? `
              <div class="associate-divider"></div>
              <div class="portal-delivery-title">Endereço de entrega</div>
              <div class="form-field"><label>Logradouro *</label><input type="text" name="addressStreet" placeholder="ex Rua do Ancião" required ${cooldownActive ? 'disabled' : ''} /></div>
              <div class="form-grid">
                <div class="form-field"><label>Cidade *</label><input type="text" name="addressCity" placeholder="ex São Paulo" required ${cooldownActive ? 'disabled' : ''} /></div>
                <div class="form-field"><label>Estado *</label><input type="text" name="addressState" placeholder="ex SP" required ${cooldownActive ? 'disabled' : ''} /></div>
              </div>
              <div class="form-grid">
                <div class="form-field"><label>Número *</label><input type="text" name="addressNumber" required ${cooldownActive ? 'disabled' : ''} /></div>
                <div class="form-field"><label>Complemento</label><input type="text" name="addressComplement" placeholder="Ex. Casa, apartamento" ${cooldownActive ? 'disabled' : ''} /></div>
              </div>
              <div class="form-grid">
                <div class="form-field"><label>Bairro *</label><input type="text" name="addressDistrict" placeholder="ex Chácara Maria Trindade" required ${cooldownActive ? 'disabled' : ''} /></div>
                <div class="form-field"><label>Ponto de referência</label><input type="text" name="addressReference" placeholder="Ex. Perto da padaria" ${cooldownActive ? 'disabled' : ''} /></div>
              </div>
              <div class="form-field"><label>Favoritar como</label><input type="text" name="addressLabel" placeholder="Ex. Minha casa" ${cooldownActive ? 'disabled' : ''} /></div>
              ` : ''}
              <div class="form-field"><label>Data desejada *</label><input type="date" name="bookingDate" id="booking-date" required min="${new Date().toISOString().split('T')[0]}" ${cooldownActive ? 'disabled' : ''} /></div>
              <div class="form-field" id="time-slots-container" style="display:none;">
                <label>Horario disponivel *</label>
                <div class="available-times-grid" id="time-slots-grid"></div>
                <input type="hidden" name="dateTime" id="booking-datetime" />
              </div>
              <div class="form-field">
                <label>Cupom de desconto</label>
                <div style="display:flex;gap:8px;">
                  <input type="text" name="couponCode" id="coupon-code-input" placeholder="Digite o código do cupom" style="flex:1;text-transform:uppercase;" ${cooldownActive ? 'disabled' : ''} />
                  <button type="button" class="btn btn-secondary" id="apply-coupon-btn" ${cooldownActive ? 'disabled' : ''}>Aplicar</button>
                </div>
                <div id="coupon-message" style="margin-top:6px;font-size:13px;"></div>
              </div>
              <div class="form-field"><label>Observacao</label><textarea name="notes" placeholder="Informe detalhes, preferencia ou observacoes para o atendimento" ${cooldownActive ? 'disabled' : ''}></textarea></div>
            </form>
          </aside>
        </div>
      </div>
      <div class="portal-bottom-bar">
        <div class="bottom-summary"><span>${itemCount} item${itemCount === 1 ? '' : 's'}</span><strong>${formatMoney(appliedCoupon ? subtotal - appliedCoupon.discount : subtotal)}</strong></div>
        <button type="button" class="btn btn-primary bottom-book-btn" id="bottom-book-btn" ${cooldownActive ? 'disabled' : ''}>${cooldownActive ? `Aguarde ${bookingCooldown}s` : 'Agendar Horário'}</button>
      </div>
    </div>
  `;

  restoreBookingDraft(draft);

  document.querySelectorAll('.portal-service-option').forEach((el) => {
    el.addEventListener('click', () => {
      const id = el.dataset.id;
      const service = services.find((s) => s.id === id);
      if (!service) return;
      const existing = (selectedServices || []).find((item) => item.id === id);
      if (existing) {
        selectedServices = (selectedServices || []).filter((item) => item.id !== id);
      } else {
        selectedServices = [...(selectedServices || []), { id, name: service.name, price: service.price, qty: 1, itemType: service.itemType || 'Servico' }];
      }
      renderPage();
    });
  });

  document.querySelectorAll('.service-action-btn').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      const serviceCard = btn.closest('.portal-service-option');
      if (!serviceCard) return;
      const id = serviceCard.dataset.id;
      const service = services.find((s) => s.id === id);
      if (!service) return;
      const existing = (selectedServices || []).find((item) => item.id === id);
      if (existing) {
        selectedServices = (selectedServices || []).filter((item) => item.id !== id);
      } else {
        selectedServices = [...(selectedServices || []), { id, name: service.name, price: service.price, qty: 1, itemType: service.itemType || 'Servico' }];
      }
      renderPage();
    });
  });

  document.querySelectorAll('.qty-btn').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      const existing = (selectedServices || []).find((item) => item.id === id);
      if (!existing) return;
      if (action === 'increase') {
        existing.qty += 1;
      } else if (action === 'decrease') {
        existing.qty = Math.max(0, existing.qty - 1);
        if (existing.qty === 0) {
          selectedServices = (selectedServices || []).filter((item) => item.id !== id);
          renderPage();
          return;
        }
      }
      renderPage();
    });
  });

  const form = document.getElementById('booking-form');
  const submitBooking = async () => {
    if (!establishment) {
      alert('Erro: Estabelecimento nao carregado. Recarregue a pagina.');
      return;
    }
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    if (bookingCooldown > 0) {
      return;
    }
    if (selectedServices.length === 0) {
      const selectedOptions = Array.from(document.querySelectorAll('.portal-service-option.selected'));
      const allServices = (establishment && Array.isArray(establishment.services)) ? establishment.services : [];
      if (selectedOptions.length > 0 && allServices.length > 0) {
        selectedServices = selectedOptions.map((el) => {
          const service = allServices.find((s) => s.id === el.dataset.id);
          return service ? { id: service.id, name: service.name, price: service.price, qty: 1, itemType: service.itemType || 'Servico' } : null;
        }).filter(Boolean);
      }
    }
    const safeSelectedServices = Array.isArray(selectedServices) ? selectedServices : [];
    if (safeSelectedServices.filter((item) => item && item.qty > 0).length === 0) {
      alert('Por favor, escolha pelo menos um servico antes de continuar.');
      return;
    }
    const fd = new FormData(form);
    const payload = {
      clientName: fd.get('clientName'),
      clientPhone: fd.get('clientPhone'),
      clientEmail: fd.get('clientEmail'),
      selectedServices: safeSelectedServices.filter((item) => item && item.qty > 0),
      dateTime: fd.get('dateTime'),
      notes: fd.get('notes'),
      couponCode: fd.get('couponCode') || '',
      addressStreet: fd.get('addressStreet') || '',
      addressCity: fd.get('addressCity') || '',
      addressState: fd.get('addressState') || '',
      addressNumber: fd.get('addressNumber') || '',
      addressComplement: fd.get('addressComplement') || '',
      addressDistrict: fd.get('addressDistrict') || '',
      addressReference: fd.get('addressReference') || '',
      addressLabel: fd.get('addressLabel') || ''
    };
    if (!payload.dateTime) {
      alert('Por favor, selecione uma data e horario disponivel.');
      return;
    }
    if (!payload.clientName || !payload.clientPhone) {
      alert('Por favor, preencha nome e telefone.');
      return;
    }
    const bottomBtn = document.getElementById('bottom-book-btn');
    if (bottomBtn) {
      bottomBtn.disabled = true;
      bottomBtn.textContent = 'Enviando...';
    }
    try {
      const csrfToken = getCsrfToken();
      const headers = { 'Content-Type': 'application/json' };
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }
      const res = await fetch(`/api/portal/${establishment.id}/book`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.details || data.error || 'Erro ao agendar.');
      }
      const bookingTotal = data.total || 0;
      const hasPayment = data.hasPayment || false;
      const subtotal = data.subtotal || bookingTotal;
      const discount = data.discount || 0;
      const appliedCoupon = data.appliedCoupon || null;
      selectedServices = [];
      appliedCoupon = null; // reset local state after successful booking
      try {
        renderSuccess({
          total: bookingTotal,
          subtotal,
          discount,
          appliedCoupon,
          hasPayment,
          clientName: payload.clientName,
          clientEmail: payload.clientEmail,
          clientPhone: payload.clientPhone
        });
      } catch (e) {
        console.error('renderSuccess error:', e);
      }
      try {
        startBookingCooldown();
      } catch (e) {
        console.error('startBookingCooldown error:', e);
      }
    } catch (err) {
      alert(err.message);
      if (bottomBtn) {
        bottomBtn.disabled = false;
        bottomBtn.textContent = 'Agendar Horário';
      }
    }
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submitBooking();
  });

  const bottomBtn = document.getElementById('bottom-book-btn');
  if (bottomBtn) {
    bottomBtn.addEventListener('click', submitBooking);
  }

  // Date picker -> load available times
  const dateInput = document.getElementById('booking-date');
  if (dateInput) {
    dateInput.addEventListener('change', async () => {
      const date = dateInput.value;
      if (!date) return;
      const container = document.getElementById('time-slots-container');
      const grid = document.getElementById('time-slots-grid');
      container.style.display = 'block';
      grid.innerHTML = '<div style="color:var(--text-muted);font-size:13px;">Carregando horarios...</div>';
      selectedTime = null;
      document.getElementById('booking-datetime').value = '';
      try {
        const res = await fetch(`/api/portal/${establishment.id}/available-times?date=${date}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        availableSlots = data.slots || [];
        if (availableSlots.length === 0) {
          grid.innerHTML = '<div style="color:var(--text-muted);font-size:13px;">Nenhum horario disponivel nesta data.</div>';
          return;
        }
        grid.innerHTML = safeMap(availableSlots, (slot) => `
          <button type="button" class="time-slot-btn ${slot.available ? '' : 'booked'}" data-time="${slot.time}" ${slot.available ? '' : 'disabled'}>
            ${slot.time}
          </button>
        `);
        grid.querySelectorAll('.time-slot-btn:not(:disabled)').forEach((btn) => {
          btn.addEventListener('click', () => {
            grid.querySelectorAll('.time-slot-btn').forEach((b) => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedTime = btn.dataset.time;
            document.getElementById('booking-datetime').value = `${date}T${selectedTime}`;
          });
        });
} catch (err) {
         grid.innerHTML = '<div style="color:#cf2e2e;font-size:13px;">Erro ao carregar horarios.</div>';
       }
});
    }
    
  const bottomButton = document.querySelector('.bottom-book-btn');
  if (bottomButton) {
    bottomButton.addEventListener('click', () => {
      document.getElementById('booking-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  // Coupon apply button
  const applyCouponBtn = document.getElementById('apply-coupon-btn');
  const couponCodeInput = document.getElementById('coupon-code-input');
  const couponMessage = document.getElementById('coupon-message');
  if (applyCouponBtn && couponCodeInput) {
    applyCouponBtn.addEventListener('click', async () => {
      const code = couponCodeInput.value.trim().toUpperCase();
      if (!code) {
        couponMessage.textContent = 'Digite um código de cupom.';
        couponMessage.style.color = '#ef4444';
        return;
      }
      const serviceIds = (selectedServices || []).map((s) => s.id);
      const subtotal = (selectedServices || []).reduce((sum, item) => sum + (item.price || 0) * (item.qty || 0), 0);
      try {
        const res = await fetch(`/api/coupons/validate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': getCsrfToken()
          },
          body: JSON.stringify({ code, serviceIds, subtotal })
        });
        const data = await res.json();
        if (!res.ok || !data.valid) {
          appliedCoupon = null;
          couponMessage.textContent = data.error || 'Cupom inválido.';
          couponMessage.style.color = '#ef4444';
          renderPage(); // re-render to update summary
          return;
        }
        appliedCoupon = data.coupon;
        couponMessage.textContent = `Cupom aplicado! Desconto de ${formatMoney(data.coupon.discount)}`;
        couponMessage.style.color = '#10b981';
        renderPage(); // re-render to update summary
      } catch (err) {
        appliedCoupon = null;
        couponMessage.textContent = 'Erro ao validar cupom.';
        couponMessage.style.color = '#ef4444';
      }
    });
  }
}
 

function startBookingCooldown() {
  clearInterval(bookingCooldownTimer);
  bookingCooldown = 15;
  bookingCooldownTimer = setInterval(() => {
    bookingCooldown -= 1;
    if (bookingCooldown <= 0) {
      clearInterval(bookingCooldownTimer);
      bookingCooldown = 0;
    }
    renderPage();
  }, 1000);
}

function renderSuccess(bookingInfo) {
  const info = bookingInfo || {};
  const hasPayment = info.hasPayment && info.total > 0;
  const subtotal = info.subtotal || info.total;
  const discount = info.discount || 0;
  const appliedCoupon = info.appliedCoupon || null;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal portal-success-modal">
      <div class="modal-header">
        <div>
          <h2>Agendamento recebido!</h2>
          <p style="margin:6px 0 0 0; color:var(--text-muted); font-size:14px;">Aguarde 15 segundos para um novo agendamento.</p>
        </div>
        <button type="button" class="modal-close" aria-label="Fechar">&times;</button>
      </div>
      <div class="portal-success">
        <div class="check-circle">${CHECK_ICON}</div>
        <p style="margin:0 0 8px 0; font-weight:700;">Sua solicitação foi enviada com sucesso.</p>
        <p style="color:var(--text-muted);font-size:14.5px;">O estabelecimento receberá seu pedido e entrará em contato para confirmar o horário.</p>
        ${discount > 0 && appliedCoupon ? `
          <div style="margin-top:12px;padding:12px;background:rgba(16,185,129,0.1);border-radius:8px;border:1px solid #10b981;">
            <div style="display:flex;justify-content:space-between;color:#10b981;font-weight:600;font-size:13px;">
              <span>Subtotal:</span>
              <span>${formatMoney(subtotal)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;color:#10b981;font-weight:600;font-size:13px;margin-top:4px;">
              <span>Desconto (${escapeHtml(appliedCoupon.code)}):</span>
              <span>− ${formatMoney(discount)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-weight:700;margin-top:4px;">
              <span>Total:</span>
              <span>${formatMoney(info.total)}</span>
            </div>
          </div>
        ` : `
          <p style="font-weight:600;margin:12px 0 0 0;">Total: ${formatMoney(info.total)}</p>
        `}
        ${hasPayment ? `
          <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border,#e5e5e5);">
            <p style="font-weight:600;margin:0 0 4px 0;">Total a pagar: ${formatMoney(info.total)}</p>
            <p style="color:var(--text-muted);font-size:13px;margin:0 0 12px 0;">Pague agora para garantir seu agendamento.</p>
            <div style="display:flex;gap:8px;margin-bottom:12px;">
              <button type="button" class="pay-amount-opt" data-mode="full" style="flex:1;padding:10px 8px;border:2px solid var(--accent);border-radius:8px;background:rgba(var(--accent-rgb),0.08);cursor:pointer;font-size:13px;color:inherit;display:flex;flex-direction:column;gap:2px;align-items:center;">
                Valor total <strong>${formatMoney(info.total)}</strong>
              </button>
              <button type="button" class="pay-amount-opt" data-mode="half" style="flex:1;padding:10px 8px;border:2px solid var(--border,#e5e5e5);border-radius:8px;background:transparent;cursor:pointer;font-size:13px;color:inherit;display:flex;flex-direction:column;gap:2px;align-items:center;">
                Sinal (50%) <strong>${formatMoney(info.total / 2)}</strong>
              </button>
            </div>
            <div style="display:flex;gap:8px;">
              <button type="button" class="btn btn-primary" id="pay-pix-btn" style="flex:1;display:flex;align-items:center;justify-content:center;gap:8px;">
                ${PIX_ICON} Pagar com PIX
              </button>
              <button type="button" class="btn btn-secondary" id="pay-card-btn" style="flex:1;display:flex;align-items:center;justify-content:center;gap:8px;">
                ${CARD_ICON} Cartao de credito
              </button>
            </div>
          </div>
          <div id="pix-result" style="margin-top:16px;"></div>
        ` : ''}
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" id="close-success">Fechar</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  const removeOverlay = () => {
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
  };

  overlay.querySelector('.modal-close').addEventListener('click', removeOverlay);
  overlay.querySelector('#close-success').addEventListener('click', removeOverlay);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) removeOverlay();
  });

  if (hasPayment) {
    const payBtn = overlay.querySelector('#pay-pix-btn');
    const cardBtn = overlay.querySelector('#pay-card-btn');
    const resultEl = overlay.querySelector('#pix-result');
    const amountOpts = overlay.querySelectorAll('.pay-amount-opt');

    let payMode = 'full';
    const selectedAmount = () => payMode === 'half'
      ? Math.round(info.total * 100 / 2) / 100
      : info.total;
    const selectedDescription = () => payMode === 'half'
      ? `Sinal (50%) - Agendamento - ${info.clientName}`
      : `Agendamento - ${info.clientName}`;

    const OPT_BASE = 'flex:1;padding:10px 8px;border-radius:8px;cursor:pointer;font-size:13px;color:inherit;display:flex;flex-direction:column;gap:2px;align-items:center;';
    const OPT_SELECTED = OPT_BASE + 'border:2px solid var(--accent);background:rgba(var(--accent-rgb),0.08);';
    const OPT_UNSELECTED = OPT_BASE + 'border:2px solid var(--border,#e5e5e5);background:transparent;';

    function resetPayButtons() {
      payBtn.disabled = false;
      payBtn.innerHTML = `${PIX_ICON} Pagar com PIX`;
      payBtn.style.display = '';
      cardBtn.disabled = false;
      cardBtn.innerHTML = `${CARD_ICON} Cartao de credito`;
      cardBtn.style.display = '';
    }

    amountOpts.forEach((opt) => {
      opt.addEventListener('click', () => {
        payMode = opt.dataset.mode;
        amountOpts.forEach((o) => { o.style.cssText = o.dataset.mode === payMode ? OPT_SELECTED : OPT_UNSELECTED; });
        resultEl.innerHTML = '';
        resetPayButtons();
      });
    });

    payBtn.addEventListener('click', async () => {
      payBtn.disabled = true;
      payBtn.textContent = 'Gerando PIX...';
      try {
        const csrfToken = getCsrfToken();
        const headers = { 'Content-Type': 'application/json' };
        if (csrfToken) headers['X-CSRF-Token'] = csrfToken;

        const res = await fetch(`/api/portal/${establishment.id}/pay-pix`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            amount: selectedAmount(),
            description: selectedDescription(),
            customerEmail: info.clientEmail || undefined,
            customerName: info.clientName,
            customerPhone: info.clientPhone
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.details || data.error || 'Erro ao gerar PIX.');

        const pixData = data.data || data;
        const brCode = pixData.brCode || '';
        const brCodeBase64 = pixData.brCodeBase64 || '';
        const pixId = pixData.id || '';

        payBtn.style.display = 'none';
        cardBtn.style.display = 'none';

        resultEl.innerHTML = `
          <div style="text-align:center;">
            <p style="font-weight:600;margin:0 0 10px 0;">${formatMoney(selectedAmount())}${payMode === 'half' ? ' <span style="font-weight:400;font-size:12px;color:var(--text-muted);">(sinal - restante no local)</span>' : ''}</p>
            ${brCodeBase64 ? `<img src="${brCodeBase64}" alt="QR Code PIX" style="max-width:200px;margin:0 auto 12px;display:block;border-radius:8px;" />` : ''}
            <div style="background:var(--bg-muted,#f5f5f5);padding:10px;border-radius:6px;word-break:break-all;font-family:monospace;font-size:11px;margin-bottom:10px;max-height:80px;overflow-y:auto;">
              ${escapeHtml(brCode)}
            </div>
            <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
              <button type="button" class="btn btn-secondary" id="copy-pix-btn" style="font-size:13px;">Copiar codigo PIX</button>
              ${pixId ? `<button type="button" class="btn btn-secondary" id="check-pix-btn" data-id="${pixId}" style="font-size:13px;">Verificar pagamento</button>` : ''}
            </div>
            <div id="pix-status" style="margin-top:10px;font-size:13px;"></div>
          </div>
        `;

        const copyBtn = resultEl.querySelector('#copy-pix-btn');
        if (copyBtn) {
          copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(brCode).then(() => {
              copyBtn.textContent = 'Copiado!';
              setTimeout(() => { copyBtn.textContent = 'Copiar codigo PIX'; }, 2000);
            }).catch(() => {
              const ta = document.createElement('textarea');
              ta.value = brCode;
              document.body.appendChild(ta);
              ta.select();
              document.execCommand('copy');
              ta.remove();
              copyBtn.textContent = 'Copiado!';
              setTimeout(() => { copyBtn.textContent = 'Copiar codigo PIX'; }, 2000);
            });
          });
        }

        const checkBtn = resultEl.querySelector('#check-pix-btn');
        if (checkBtn) {
          checkBtn.addEventListener('click', async () => {
            const statusEl = resultEl.querySelector('#pix-status');
            statusEl.textContent = 'Verificando...';
            try {
              const csrfToken2 = getCsrfToken();
              const headers2 = {};
              if (csrfToken2) headers2['X-CSRF-Token'] = csrfToken2;
              const statusRes = await fetch(`/api/portal/${establishment.id}/check-pix/${pixId}`, { headers: headers2 });
              const statusData = await statusRes.json();
              if (!statusRes.ok) throw new Error(statusData.error || 'Erro');
              const s = (statusData.data && statusData.data.status) || statusData.status || 'Desconhecido';
              if (s === 'PAID' || s === 'COMPLETED') {
                statusEl.innerHTML = '<span style="color:#10b981;font-weight:600;">Pagamento confirmado!</span>';
              } else {
                statusEl.innerHTML = `<strong>Status:</strong> ${escapeHtml(s)} <span style="color:var(--text-muted);">(aguardando pagamento)</span>`;
              }
            } catch (e) {
              statusEl.textContent = 'Erro ao verificar: ' + e.message;
            }
          });
        }
      } catch (e) {
        resultEl.innerHTML = `<p style="color:#ef4444;font-size:13px;">${escapeHtml(e.message)}</p>`;
        resetPayButtons();
      }
    });

    cardBtn.addEventListener('click', async () => {
      cardBtn.disabled = true;
      cardBtn.textContent = 'Gerando link...';
      try {
        const csrfToken = getCsrfToken();
        const headers = { 'Content-Type': 'application/json' };
        if (csrfToken) headers['X-CSRF-Token'] = csrfToken;

        const res = await fetch(`/api/portal/${establishment.id}/pay-card`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            amount: selectedAmount(),
            description: selectedDescription(),
            customerEmail: info.clientEmail || undefined,
            customerName: info.clientName,
            customerPhone: info.clientPhone,
            returnUrl: window.location.href,
            completionUrl: window.location.href
          })
        });
        const data = await res.json();
        if (!res.ok) {
          const msg = data.details || data.error || 'Erro ao gerar pagamento.';
          if (msg.includes('CARD is not available')) {
            throw new Error('Pagamento com cartão não está habilitado para esta loja. Use PIX ou configure no AbacatePay.');
          }
          throw new Error(msg);
        }

        const cardUrl = (data.data && data.data.url) || data.url;
        if (!cardUrl) throw new Error('Link de pagamento nao retornado.');

        payBtn.style.display = 'none';
        cardBtn.style.display = 'none';

        resultEl.innerHTML = `
          <div style="text-align:center;">
            <p style="font-weight:600;margin:0 0 12px 0;">${formatMoney(selectedAmount())}${payMode === 'half' ? ' <span style="font-weight:400;font-size:12px;color:var(--text-muted);">(sinal - restante no local)</span>' : ''}</p>
            <a href="${escapeHtml(cardUrl)}" target="_blank" rel="noopener" class="btn btn-primary" style="display:inline-flex;align-items:center;justify-content:center;gap:8px;width:100%;">
              ${CARD_ICON} Pagar ${formatMoney(selectedAmount())} com cartao
            </a>
            <p style="margin-top:8px;font-size:12px;color:var(--text-muted);">Voce sera redirecionado para a pagina segura do AbacatePay</p>
          </div>
        `;
      } catch (e) {
        resultEl.innerHTML = `<p style="color:#ef4444;font-size:13px;">${escapeHtml(e.message)}</p>`;
        resetPayButtons();
      }
    });
  }
}

boot();
