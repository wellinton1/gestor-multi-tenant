const express = require('express');
const { v4: uuid } = require('uuid');
const store = require('../data/store');
const { runWithTenant } = require('../data/tenant-context');
const { normalizeSelectedServices, buildServiceSummary } = require('../utils/booking');
const { z } = require('zod');

const isProduction = process.env.NODE_ENV === 'production';

const router = express.Router();

// Portal e publico, mas toda operacao e em nome de UM estabelecimento (o da
// URL). Propaga esse tenant para a camada de dados, para que as escritas
// (agendamento, cliente novo, uso de cupom) carreguem o contexto de RLS.
router.use('/:establishmentId', (req, res, next) => {
  return runWithTenant(req.params.establishmentId, next);
});

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
    qty: z.number().int().positive('Quantidade deve ser positiva').max(10, 'Quantidade maxima 10'),
    itemType: z.enum(['Produto', 'Servico']).optional()
  })).min(1, 'Selecione pelo menos um servico'),
  dateTime: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Data/hora invalida (formato: YYYY-MM-DDTHH:MM)').optional(),
  notes: z.string().max(500, 'Observacoes muito longas').optional(),
  couponCode: z.string().max(30).optional(),
  addressStreet: z.string().max(150, 'Logradouro muito longo').optional(),
  addressCity: z.string().max(100, 'Cidade muito longa').optional(),
  addressState: z.string().max(50, 'Estado muito longo').optional(),
  addressNumber: z.string().max(20, 'Numero muito longo').optional(),
  addressComplement: z.string().max(100, 'Complemento muito longo').optional(),
  addressDistrict: z.string().max(100, 'Bairro muito longo').optional(),
  addressReference: z.string().max(150, 'Ponto de referencia muito longo').optional(),
  addressLabel: z.string().max(50, 'Favoritar como muito longo').optional()
}).superRefine((data, ctx) => {
  const hasProducts = data.selectedServices.some((s) => s.itemType === 'Produto');
  const hasServices = data.selectedServices.some((s) => s.itemType === 'Servico');
  
  // Se apenas serviços: dateTime é obrigatório
  if (hasServices && !hasProducts) {
    if (!data.dateTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['dateTime'],
        message: 'Data e horario sao obrigatorios para servicos'
      });
    }
  }
  
  // Se apenas produtos: endereço de entrega é obrigatório
  if (hasProducts && !hasServices) {
    const requiredFields = ['addressStreet', 'addressCity', 'addressState', 'addressNumber', 'addressDistrict'];
    for (const field of requiredFields) {
      if (!data[field]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field],
          message: `${field} e obrigatorio para produtos`
        });
      }
    }
  }
  
  // Rejeitar payloads inconsistentes
  if (hasProducts && data.dateTime) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['dateTime'],
      message: 'Produtos nao devem ter data/hora de agendamento'
    });
  }
  
  if (hasServices && (data.addressStreet || data.addressCity || data.addressState || data.addressNumber || data.addressDistrict)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['addressStreet'],
      message: 'Servicos nao devem ter endereco de entrega'
    });
  }
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
    const services = store.allScoped('services', est.id);
    const hasPayment = !!(est.pixApiKey || est.abacatePayApiKey);
    res.json({
      id: est.id,
      name: est.name,
      niche: est.niche,
      theme: est.theme || resolveDefaultTheme(est.niche),
      accentOverride: est.accentOverride || null,
      accentColor: resolveAccentColor(est.accentOverride),
      plan: est.plan || 'free',
      paused: false,
      description: est.description,
      phone: est.phone,
      address: est.address,
      logoDataUrl: est.logoDataUrl,
      businessHours: est.businessHours || getDefaultBusinessHours(),
      hasPayment,
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
function resolveDefaultTheme(niche) {
  return NICHE_TO_THEME[niche] || 'generico';
}

// Mesmas cores da paleta usadas no painel admin (estabelecimentos.js).
// Resolve accentOverride (nome da paleta ou cor livre hex) para um hex aplicavel no CSS.
const PALETTE_COLORS = {
  champagne: '#c9a961', burgundy: '#7d2025', forest: '#2d4a3e', ink: '#1a1814', blush: '#d4a5a5',
  green: '#10b981', cyan: '#06b6d4', lime: '#84cc16', amber: '#f59e0b',
  terracotta: '#c2410c', mustard: '#d4a017', olive: '#6b6232', wine: '#9f1239', charcoal: '#2a2622',
  slate: '#475569', ocean: '#0e7490',
  teal: '#0d9488', navy: '#1e3a8a'
};
function resolveAccentColor(accentOverride) {
  if (!accentOverride) return null;
  if (/^#[0-9a-fA-F]{6}$/.test(accentOverride)) return accentOverride;
  return PALETTE_COLORS[accentOverride] || null;
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
    const appointments = store.queryScoped('appointments', est.id, (a) => {
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

    const now = new Date();
    const isToday = selectedDate.getTime() === today.getTime();
    const currentMinutes = isToday ? now.getHours() * 60 + now.getMinutes() : -1;

    for (let m = openMinutes; m < closeMinutes; m += 30) {
      const hh = String(Math.floor(m / 60)).padStart(2, '0');
      const mm = String(m % 60).padStart(2, '0');
      const time = `${hh}:${mm}`;
      const isPast = isToday && m <= currentMinutes;
      slots.push({
        time,
        available: !bookedTimes.has(time) && !isPast
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

    const { clientName, clientPhone, clientEmail, selectedServices, dateTime, notes, couponCode } = req.validated;

    const services = normalizeSelectedServices(selectedServices);
    if (services.length === 0) {
      return res.status(400).json({ error: 'Selecione pelo menos um servico.' });
    }

    for (const item of services) {
      const service = store.findByIdScoped('services', item.id, est.id);
      if (!service) {
        return res.status(400).json({ error: 'Servico invalido.' });
      }
      item.price = service.price;
      item.name = service.name;
      // itemType já vem validado do schema
    }

    const hasProducts = services.some((item) => item.itemType === 'Produto');
    const hasServices = services.some((item) => item.itemType === 'Servico');
    const needsDelivery = est.niche === 'Pizzaria' || hasProducts;
    const deliveryAddress = {
      addressStreet: String(req.validated.addressStreet || '').trim(),
      addressCity: String(req.validated.addressCity || '').trim(),
      addressState: String(req.validated.addressState || '').trim(),
      addressNumber: String(req.validated.addressNumber || '').trim(),
      addressComplement: String(req.validated.addressComplement || '').trim(),
      addressDistrict: String(req.validated.addressDistrict || '').trim(),
      addressReference: String(req.validated.addressReference || '').trim(),
      addressLabel: String(req.validated.addressLabel || '').trim()
    };
    if (needsDelivery) {
      const requiredAddress = ['addressStreet', 'addressNumber', 'addressDistrict', 'addressCity', 'addressState'];
      const missing = requiredAddress.filter((f) => !deliveryAddress[f]);
      if (missing.length > 0) {
        return res.status(400).json({ error: 'Endereco de entrega obrigatorio para produtos.', details: missing.join(', ') });
      }
    }

    let client = store.queryScoped(
      'clients',
      est.id,
      (c) => c.phone === clientPhone
    )[0];
    if (!client) {
      client = store.insert('clients', {
        id: uuid(),
        establishmentId: est.id,
        name: clientName,
        phone: clientPhone,
        email: clientEmail || '',
        notes: notes || '',
        ...(needsDelivery ? deliveryAddress : {}),
        createdAt: new Date().toISOString()
      });
    } else if (needsDelivery) {
      client = store.update('clients', client.id, deliveryAddress);
    }

    const subtotal = services.reduce((sum, item) => sum + item.price * item.qty, 0);
    let total = subtotal;
    let appliedCoupon = null;
    let discount = 0;

    if (couponCode) {
      const coupon = store.queryScoped('coupons', est.id, (c) => c.code === String(couponCode).toUpperCase())[0];
      if (coupon) {
        const now = new Date();
        if (coupon.status === 'active' &&
            (!coupon.startsAt || new Date(coupon.startsAt) <= now) &&
            (!coupon.endsAt || new Date(coupon.endsAt) >= now) &&
            (coupon.usageLimit === null || coupon.usageLimit === undefined || coupon.usedCount < coupon.usageLimit) &&
            (!coupon.minTotal || subtotal >= coupon.minTotal) &&
            (!coupon.applicableServices || coupon.applicableServices.length === 0 || services.some(s => coupon.applicableServices.includes(s.id)))) {
          
          if (coupon.type === 'percent') {
            discount = subtotal * (coupon.value / 100);
            if (coupon.maxDiscount && discount > coupon.maxDiscount) {
              discount = coupon.maxDiscount;
            }
          } else if (coupon.type === 'fixed') {
            discount = Math.min(coupon.value, subtotal);
          }
          discount = Math.round(discount * 100) / 100;
          total = Math.max(0, subtotal - discount);
          
          coupon.usedCount = (coupon.usedCount || 0) + 1;
          store.update('coupons', coupon.id, { usedCount: coupon.usedCount });
          
          appliedCoupon = {
            id: coupon.id,
            code: coupon.code,
            type: coupon.type,
            value: coupon.value,
            discount
          };
        }
      }
    }

    const appointmentData = {
      id: uuid(),
      establishmentId: est.id,
      clientId: client.id,
      employeeId: null,
      serviceId: services[0].id,
      serviceName,
      total,
      status: 'Pendente',
      source: 'portal',
      couponId: appliedCoupon ? appliedCoupon.id : null,
      couponCode: appliedCoupon ? appliedCoupon.code : null,
      discount,
      subtotal,
      hasDelivery: needsDelivery,
      deliveryAddress: needsDelivery ? deliveryAddress : null,
      createdAt: new Date().toISOString()
    };
    
    // Apenas serviços têm data/hora de agendamento
    if (hasServices && !hasProducts) {
      appointmentData.dateTime = dateTime;
    }
    
    const appointment = store.insert('appointments', appointmentData);

    const hasPayment = !!(est.pixApiKey || est.abacatePayApiKey);
    res.status(201).json({ ok: true, appointment, total, subtotal, discount, appliedCoupon, hasPayment });
  } catch (err) {
    console.error('ERROR in POST /api/portal/:id/book:', err.message);
    res.status(500).json({
      error: 'Erro interno do servidor',
      ...(isProduction ? {} : { details: err.message })
    });
  }
});

const {
  createPixPayment,
  checkPixPayment,
  createCustomer,
  createCheckout,
  createProduct
} = require('../utils/payment-providers');

function getPaymentConfig(est) {
  return {
    provider: est.pixProvider || 'abacatepay',
    apiKey: est.pixApiKey || est.abacatePayApiKey || '',
    baseUrl: est.pixBaseUrl || '',
    extraHeaders: est.pixExtraHeaders ? JSON.parse(est.pixExtraHeaders) : {}
  };
}

router.post('/:establishmentId/pay-pix', async (req, res) => {
  try {
    const est = store.findById('establishments', req.params.establishmentId);
    if (!est) return res.status(404).json({ error: 'Estabelecimento nao encontrado.' });
    const config = getPaymentConfig(est);
    if (!config.apiKey) return res.status(400).json({ error: 'Pagamento nao configurado para este estabelecimento.' });

    const { amount, description, customerEmail, customerName, customerPhone, customerTaxId } = req.body || {};
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valor e obrigatorio.' });
    }

    const customer = customerEmail ? {
      email: customerEmail,
      name: customerName,
      cellphone: customerPhone,
      taxId: customerTaxId
    } : undefined;

    const result = await createPixPayment(config.provider, config.apiKey, {
      amount,
      description: description || 'Agendamento',
      customer
    }, config);

    res.json(result);
  } catch (err) {
    console.error('ERROR POST /api/portal/:id/pay-pix:', err.message);
    res.status(500).json({
      error: err.message || 'Erro ao gerar PIX',
      ...(isProduction ? {} : { details: err.message, response: err.responseData })
    });
  }
});

// Pagamento com cartao de credito (cliente final): cria checkout hospedado
// e devolve a URL para o cliente concluir o pagamento. Aceita valor parcial (sinal).
router.post('/:establishmentId/pay-card', async (req, res) => {
  try {
    const est = store.findById('establishments', req.params.establishmentId);
    if (!est) return res.status(404).json({ error: 'Estabelecimento nao encontrado.' });
    const config = getPaymentConfig(est);
    if (!config.apiKey) return res.status(400).json({ error: 'Pagamento nao configurado para este estabelecimento.' });

    const { amount, description, customerEmail, customerName, customerPhone, customerTaxId, returnUrl, completionUrl } = req.body || {};
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valor e obrigatorio.' });
    }

    // Cliente pre-cadastrado e opcional: sem email o checkout coleta os dados na pagina hospedada.
    let customerId;
    if (customerEmail) {
      const customerResult = await createCustomer(config.provider, config.apiKey, {
        email: customerEmail,
        name: customerName,
        cellphone: customerPhone,
        taxId: customerTaxId
      }, config);
      customerId = customerResult.data?.id || customerResult.id;
    }

    const productResult = await createProduct(config.provider, config.apiKey, {
      externalId: `portal-${est.id}-${Date.now()}`,
      name: String(description || 'Agendamento'),
      price: amount
    }, config);
    const productId = productResult.data?.id || productResult.id;

    const isHttpUrl = (v) => typeof v === 'string' && /^https?:\/\//i.test(v);
    const checkoutResult = await createCheckout(config.provider, config.apiKey, {
      items: [{ id: productId, quantity: 1 }],
      customerId,
      returnUrl,
      completionUrl
    }, config);

    res.json(checkoutResult);
  } catch (err) {
    console.error('ERROR POST /api/portal/:id/pay-card:', err.message, err.responseData || '');
    res.status(500).json({
      error: err.message || 'Erro ao criar pagamento com cartao',
      ...(isProduction ? {} : { details: err.message, response: err.responseData })
    });
  }
});

router.get('/:establishmentId/check-pix/:pixId', async (req, res) => {
  try {
    const est = store.findById('establishments', req.params.establishmentId);
    if (!est) return res.status(404).json({ error: 'Estabelecimento nao encontrado.' });
    const config = getPaymentConfig(est);
    if (!config.apiKey) return res.status(400).json({ error: 'Pagamento nao configurado.' });

    const result = await checkPixPayment(config.provider, config.apiKey, req.params.pixId, config);
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
