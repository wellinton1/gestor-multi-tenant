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

function escapeHtml(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
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

let establishment = null;
let selectedServices = [];
let bookingCooldown = 0;
let bookingCooldownTimer = null;
let selectedTime = null;
let availableSlots = [];
let loadingSlots = false;

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
  renderPage();
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
          ${establishment.address ? `<span>${PIN_ICON} ${escapeHtml(establishment.address)}</span>` : ''}
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
                return `
                  <div class="portal-service-option ${selected ? 'selected' : ''}" data-id="${s.id}">
                    ${s.photoDataUrl ? `<div class="service-image"><img src="${s.photoDataUrl}" alt="${escapeHtml(s.name)}" /></div>` : ''}
                    <div class="service-card-top">
                      <div class="service-badge">${escapeHtml(s.category || 'Serviço')}</div>
                      <strong class="svc-name">${escapeHtml(s.name)}</strong>
                      ${s.description ? `<div class="svc-desc">${escapeHtml(s.description)}</div>` : ''}
                    </div>
                    <div class="service-card-bottom">
                      <div class="svc-meta">
                        <span>${formatMoney(s.price)}</span>
                        <span>${formatDuration(s.durationMinutes)}</span>
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
              <div class="portal-total">Total: <strong>${formatMoney(subtotal)}</strong></div>
            </div>
            <form id="booking-form" class="portal-booking-form">
              <div class="form-field"><label>Nome completo *</label><input type="text" name="clientName" required ${cooldownActive ? 'disabled' : ''} /></div>
              <div class="form-grid">
                <div class="form-field"><label>Telefone (WhatsApp) *</label><input type="text" name="clientPhone" required placeholder="(11) 99999-9999" ${cooldownActive ? 'disabled' : ''} /></div>
                <div class="form-field"><label>Email</label><input type="email" name="clientEmail" ${cooldownActive ? 'disabled' : ''} /></div>
              </div>
              <div class="form-field"><label>Data desejada *</label><input type="date" name="bookingDate" id="booking-date" required min="${new Date().toISOString().split('T')[0]}" ${cooldownActive ? 'disabled' : ''} /></div>
              <div class="form-field" id="time-slots-container" style="display:none;">
                <label>Horario disponivel *</label>
                <div class="available-times-grid" id="time-slots-grid"></div>
                <input type="hidden" name="dateTime" id="booking-datetime" />
              </div>
              <div class="form-field"><label>Observacao</label><textarea name="notes" placeholder="Informe detalhes, preferencia ou observacoes para o atendimento" ${cooldownActive ? 'disabled' : ''}></textarea></div>
            </form>
          </aside>
        </div>
      </div>
      <div class="portal-bottom-bar">
        <div class="bottom-summary"><span>${itemCount} item${itemCount === 1 ? '' : 's'}</span><strong>${formatMoney(subtotal)}</strong></div>
        <button type="button" class="btn btn-primary bottom-book-btn" id="bottom-book-btn" ${cooldownActive ? 'disabled' : ''}>${cooldownActive ? `Aguarde ${bookingCooldown}s` : 'Agendar Horário'}</button>
      </div>
    </div>
  `;

  document.querySelectorAll('.portal-service-option').forEach((el) => {
    el.addEventListener('click', () => {
      const id = el.dataset.id;
      const service = services.find((s) => s.id === id);
      if (!service) return;
      const existing = (selectedServices || []).find((item) => item.id === id);
      if (existing) {
        selectedServices = (selectedServices || []).filter((item) => item.id !== id);
      } else {
        selectedServices = [...(selectedServices || []), { id, name: service.name, price: service.price, qty: 1 }];
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
        selectedServices = [...(selectedServices || []), { id, name: service.name, price: service.price, qty: 1 }];
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
          return service ? { id: service.id, name: service.name, price: service.price, qty: 1 } : null;
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
      notes: fd.get('notes')
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
      selectedServices = [];
      try {
        renderSuccess();
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

function renderSuccess() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal portal-success-modal">
      <div class="modal-header">
        <div>
          <h2>Agendamento recebido!</h2>
          <p style="margin:6px 0 0 0; color:var(--text-muted); font-size:14px;">Aguarde 15 segundos para um novo agendamento.</p>
        </div>
        <button type="button" class="modal-close" aria-label="Fechar">×</button>
      </div>
      <div class="portal-success">
        <div class="check-circle">${CHECK_ICON}</div>
        <p style="margin:0 0 8px 0; font-weight:700;">Sua solicitação foi enviada com sucesso.</p>
        <p style="color:var(--text-muted);font-size:14.5px;">O estabelecimento receberá seu pedido e entrará em contato para confirmar o horário.</p>
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
}

boot();
