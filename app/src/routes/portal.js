const express = require('express');
const { v4: uuid } = require('uuid');
const store = require('../data/store');
const { normalizeSelectedServices, buildServiceSummary } = require('../utils/booking');
const { z } = require('zod');

const isProduction = process.env.NODE_ENV === 'production';

const router = express.Router();

// Validation schemas
const availableTimesQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
});

const bookingSchema = z.object({
  clientName: z.string().min(1, 'Nome do cliente e obrigatorio').max(100, 'Nome muito longo'),
  clientPhone: z.string().min(8, 'Telefone invalido').max(20, 'Telefone muito longo').regex(/^[\d\s\-\(\)\+]+$/, 'Telefone contem caracteres invalidos'),
  clientEmail: z.string().email('Email invalido').max(100).optional().or(z.literal('')),
  selectedServices: z.array(z.object({
    id: z.string().uuid('ID de servico invalido'),
    qty: z.number().int().positive('Quantidade deve ser positiva').max(10, 'Quantidade maxima 10')
  })).min(1, 'Selecione pelo menos um servico'),
  dateTime: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Data/hora invalida (formato: YYYY-MM-DDTHH:MM)'),
  notes: z.string().max(500, 'Observacoes muito longas').optional()
});

// Validation middleware
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const data = req[source];
    const result = schema.safeParse(data);
    if (!result.success) {
      const errors = (result.error.issues || []).map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
      return res.status(400).json({ error: 'Dados invalidos', details: errors });
    }
    req.validated = result.data;
    next();
  };
}

// Public info needed to render the booking page for one establishment.
router.get('/:establishmentId', async (req, res) => {
  try {
    const est = store.findById('establishments', req.params.establishmentId);
    if (!est) return res.status(404).json({ error: 'Estabelecimento nao encontrado.' });
    // Loja pausada pelo administrador da plataforma — portal publico fica offline.
    // Dados nao sao tocados; o dono ainda acessa o painel admin (auth normal).
    if (est.paused === true) {
      return res.status(423).json({
        error: 'Esta loja esta temporariamente pausada. Volte mais tarde.',
        paused: true,
        name: est.name
      });
    }
    const services = store.query('services', (s) => s.establishmentId === est.id);
    res.json({
      id: est.id,
      name: est.name,
      niche: est.niche,
      theme: est.theme || resolveDefaultTheme(est.niche),
      accentOverride: est.accentOverride || null,
      plan: est.plan || 'free',
      paused: false,
      description: est.description,
      phone: est.phone,
      address: est.address,
      logoDataUrl: est.logoDataUrl,
      businessHours: est.businessHours || getDefaultBusinessHours(),
      hasPayment: !!est.abacatePayApiKey,
      services
    });
  } catch (err) {
    console.error('ERROR GET /api/portal/:establishmentId:', err.message);
    res.status(500).json({
      error: 'Erro interno do servidor',
      ...(isProduction ? {} : { details: err.message })
    });
  }
});

function getDefaultBusinessHours() {
  const days = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  const result = {};
  days.forEach((day) => {
    if (day === 'domingo') {
      result[day] = { active: false, open: '09:00', close: '18:00' };
    } else if (day === 'sabado') {
      result[day] = { active: true, open: '09:00', close: '13:00' };
    } else {
      result[day] = { active: true, open: '09:00', close: '18:00' };
    }
  });
  return result;
}

// Map niche legado -> theme slug (mesma logica do scripts/migrate-themes.js).
// Usado para estabelecimentos antigos ainda sem campo `theme`.
const NICHE_TO_THEME = {
  Barbearia: 'servicos',
  Pizzaria: 'alimentacao',
  'Lava Jato': 'servicos',
  'Salao de Beleza': 'servicos',
  'Doces e Salgados': 'alimentacao',
  Oficina: 'servicos',
  Petshop: 'servicos',
  Outro: 'generico'
};
function resolveDefaultTheme(niche) {
  return NICHE_TO_THEME[niche] || 'generico';
}

// Get available time slots for a given date
router.get('/:establishmentId/available-times', validate(availableTimesQuerySchema, 'query'), async (req, res) => {
  try {
    const est = store.findById('establishments', req.params.establishmentId);
    if (!est) return res.status(404).json({ error: 'Estabelecimento nao encontrado.' });
    if (est.paused === true) {
      return res.status(423).json({ error: 'Esta loja esta pausada.', paused: true });
    }

    const { date } = req.validated;

    // Block past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(date + 'T12:00:00');
    if (selectedDate < today) {
      return res.json({ slots: [], message: 'Data passada nao permitida.' });
    }

    const dayNames = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const dateObj = new Date(date + 'T12:00:00');
    const dayName = dayNames[dateObj.getDay()];
    const hours = est.businessHours || getDefaultBusinessHours();
    const dayHours = hours[dayName];

    if (!dayHours || !dayHours.active) {
      return res.json({ slots: [], message: 'Fechado neste dia.' });
    }

    // Get existing appointments for this date
    const appointments = store.query('appointments', (a) => {
      if (a.establishmentId !== est.id) return false;
      const apptDate = a.dateTime ? a.dateTime.substring(0, 10) : '';
      return apptDate === date && a.status !== 'Cancelado';
    });

    const bookedTimes = new Set(appointments.map((a) => {
      const time = a.dateTime ? a.dateTime.substring(11, 16) : '';
      return time;
    }).filter(Boolean));

    // Generate 30-min slots
    const slots = [];
    const [openH, openM] = dayHours.open.split(':').map(Number);
    const [closeH, closeM] = dayHours.close.split(':').map(Number);
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    for (let m = openMinutes; m < closeMinutes; m += 30) {
      const hh = String(Math.floor(m / 60)).padStart(2, '0');
      const mm = String(m % 60).padStart(2, '0');
      const time = `${hh}:${mm}`;
      slots.push({
        time,
        available: !bookedTimes.has(time)
      });
    }

    res.json({ slots, dayName, hours: dayHours });
  } catch (err) {
    console.error('ERROR GET /api/portal/:establishmentId/available-times:', err.message);
    res.status(500).json({
      error: 'Erro interno do servidor',
      ...(isProduction ? {} : { details: err.message })
    });
  }
});

// Public booking submission -> creates/reuses a client record and a Pendente appointment.
router.post('/:establishmentId/book', validate(bookingSchema), async (req, res) => {
  try {
    const est = store.findById('establishments', req.params.establishmentId);
    if (!est) return res.status(404).json({ error: 'Estabelecimento nao encontrado.' });
    // Defense in depth: mesmo se o front renderizar, nao aceitar agendamento.
    if (est.paused === true) {
      return res.status(423).json({ error: 'Esta loja esta pausada e nao aceita agendamentos.', paused: true });
    }

    const { clientName, clientPhone, clientEmail, selectedServices, dateTime, notes } = req.validated;

    const services = normalizeSelectedServices(selectedServices);
    if (services.length === 0) {
      return res.status(400).json({ error: 'Selecione pelo menos um servico.' });
    }

    for (const item of services) {
      const service = store.findById('services', item.id);
      if (!service || service.establishmentId !== est.id) {
        return res.status(400).json({ error: 'Servico invalido.' });
      }
      item.price = service.price;
      item.name = service.name;
    }

    let client = store.query(
      'clients',
      (c) => c.establishmentId === est.id && c.phone === clientPhone
    )[0];
    if (!client) {
      client = store.insert('clients', {
        id: uuid(),
        establishmentId: est.id,
        name: clientName,
        phone: clientPhone,
        email: clientEmail || '',
        notes: notes || '',
        createdAt: new Date().toISOString()
      });
    }

    const total = services.reduce((sum, item) => sum + item.price * item.qty, 0);
    const serviceName = buildServiceSummary(services);
    const appointment = store.insert('appointments', {
      id: uuid(),
      establishmentId: est.id,
      clientId: client.id,
      employeeId: null,
      serviceId: services[0].id,
      serviceName,
      dateTime,
      total,
      status: 'Pendente',
      source: 'portal',
      createdAt: new Date().toISOString()
    });

    res.status(201).json({ ok: true, appointment, total, hasPayment: !!est.abacatePayApiKey });
  } catch (err) {
    console.error('ERROR in POST /api/portal/:id/book:', err.message);
    res.status(500).json({
      error: 'Erro interno do servidor',
      ...(isProduction ? {} : { details: err.message })
    });
  }
});

const ABACATEPAY_BASE = 'https://api.abacatepay.com/v2';

async function abacateRequest(method, path, apiKey, body) {
  const opts = {
    method,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${ABACATEPAY_BASE}${path}`, opts);
  let data;
  try { data = await res.json(); } catch (e) { data = null; }
  if (!res.ok) {
    const errMsg = (data && (data.error || (data.errorDetail) || (data.message))) || `AbacatePay retornou ${res.status}`;
    const err = new Error(errMsg);
    err.responseData = data;
    throw err;
  }
  return data;
}

router.post('/:establishmentId/pay-pix', async (req, res) => {
  try {
    const est = store.findById('establishments', req.params.establishmentId);
    if (!est) return res.status(404).json({ error: 'Estabelecimento nao encontrado.' });
    const apiKey = est.abacatePayApiKey;
    if (!apiKey) return res.status(400).json({ error: 'Pagamento nao disponivel para este estabelecimento.' });

    const { amount, description, customerEmail, customerName, customerPhone } = req.body || {};
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valor e obrigatorio.' });
    }

    const payload = {
      method: 'PIX',
      data: {
        amount: Math.round(amount * 100)
      }
    };
    if (description) payload.data.description = String(description);

    console.log('DEBUG AbacatePay payload:', JSON.stringify(payload, null, 2));
    console.log('DEBUG AbacatePay API key:', apiKey.substring(0, 10) + '...');

    const opts = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    };

    console.log('DEBUG Request headers:', opts.headers);
    console.log('DEBUG Request body:', opts.body);

    const apiRes = await fetch(`${ABACATEPAY_BASE}/transparents/create`, opts);
    const responseText = await apiRes.text();
    console.log('DEBUG Response status:', apiRes.status);
    console.log('DEBUG Response body:', responseText);

    let data;
    try { data = JSON.parse(responseText); } catch (e) { data = null; }

    if (!apiRes.ok) {
      const errMsg = (data && (data.error || data.errorDetail || data.message)) || `AbacatePay retornou ${apiRes.status}`;
      return res.status(500).json({
        error: errMsg,
        debug: {
          status: apiRes.status,
          response: data || responseText,
          payload: payload
        }
      });
    }

    res.json(data);
  } catch (err) {
    console.error('ERROR POST /api/portal/:id/pay-pix:', err.message);
    res.status(500).json({
      error: err.message || 'Erro ao gerar PIX',
      debug: { message: err.message }
    });
  }
});

router.get('/:establishmentId/check-pix/:pixId', async (req, res) => {
  try {
    const est = store.findById('establishments', req.params.establishmentId);
    if (!est) return res.status(404).json({ error: 'Estabelecimento nao encontrado.' });
    const apiKey = est.abacatePayApiKey;
    if (!apiKey) return res.status(400).json({ error: 'Pagamento nao disponivel.' });

    const result = await abacateRequest('GET', `/transparents/check?id=${req.params.pixId}`, apiKey);
    res.json(result);
  } catch (err) {
    console.error('ERROR GET /api/portal/:id/check-pix:', err.message);
    res.status(500).json({
      error: 'Erro ao verificar pagamento',
      ...(isProduction ? {} : { details: err.message })
    });
  }
});

module.exports = router;
