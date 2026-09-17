const express = require('express');
const { v4: uuid } = require('uuid');
const store = require('../data/store');
const { requireLogin, requireEstablishment } = require('../middleware/auth');
const { z } = require('zod');

const router = express.Router();
router.use(requireLogin, requireEstablishment);

const COUPON_TYPES = ['percent', 'fixed'];
const VALID_STATUSES = ['active', 'inactive', 'expired'];

const couponSchema = z.object({
  code: z.string().min(2, 'Código deve ter pelo menos 2 caracteres').max(30, 'Código muito longo').regex(/^[A-Z0-9_-]+$/, 'Use apenas letras maiúsculas, números, _ e -'),
  type: z.enum(COUPON_TYPES),
  value: z.number().positive('Valor deve ser positivo'),
  maxDiscount: z.number().min(0).optional(),
  minTotal: z.number().min(0).optional(),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
  usageLimit: z.number().int().min(1).optional().nullable(),
  applicableServices: z.array(z.string().uuid()).optional(),
  status: z.enum(VALID_STATUSES).default('active')
});

function validateCouponData(body) {
  const result = couponSchema.safeParse(body);
  if (!result.success) {
    const errors = result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
    return { error: errors };
  }
  return { data: result.data };
}

function isCouponValid(coupon, estId, serviceIds, subtotal) {
  if (coupon.status !== 'active') return { valid: false, reason: 'Cupom inativo' };
  if (coupon.establishmentId !== estId) return { valid: false, reason: 'Cupom não pertence a este estabelecimento' };

  const now = new Date();
  if (coupon.startsAt && new Date(coupon.startsAt) > now) return { valid: false, reason: 'Cupom ainda não iniciou' };
  if (coupon.endsAt && new Date(coupon.endsAt) < now) return { valid: false, reason: 'Cupom expirado' };

  if (coupon.usageLimit !== null && coupon.usageLimit !== undefined && coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, reason: 'Limite de usos atingido' };
  }

  if (coupon.minTotal && subtotal < coupon.minTotal) {
    return { valid: false, reason: `Valor mínimo de R$ ${coupon.minTotal.toFixed(2)}` };
  }

  if (coupon.applicableServices && coupon.applicableServices.length > 0) {
    const hasApplicable = serviceIds.some(id => coupon.applicableServices.includes(id));
    if (!hasApplicable) return { valid: false, reason: 'Cupom não válido para os serviços selecionados' };
  }

  return { valid: true };
}

function calculateDiscount(coupon, subtotal) {
  let discount = 0;
  if (coupon.type === 'percent') {
    discount = subtotal * (coupon.value / 100);
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
  } else if (coupon.type === 'fixed') {
    discount = Math.min(coupon.value, subtotal);
  }
  return Math.round(discount * 100) / 100;
}

router.get('/', async (req, res, next) => {
  try {
    const list = store
      .allScoped('coupons', req.session.establishmentId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    res.json(list);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const validation = validateCouponData(req.body);
    if (validation.error) return res.status(400).json({ error: validation.error });

    const data = validation.data;
    const existing = store.queryScoped('coupons', req.session.establishmentId, (c) => c.code === data.code.toUpperCase())[0];
    if (existing) return res.status(400).json({ error: 'Código de cupom já existe' });

    const coupon = store.insert('coupons', {
      id: uuid(),
      establishmentId: req.session.establishmentId,
      code: data.code.toUpperCase(),
      type: data.type,
      value: data.value,
      maxDiscount: data.maxDiscount ?? null,
      minTotal: data.minTotal ?? null,
      startsAt: data.startsAt ?? null,
      endsAt: data.endsAt ?? null,
      usageLimit: data.usageLimit ?? null,
      usedCount: 0,
      applicableServices: data.applicableServices ?? [],
      status: data.status,
      createdAt: new Date().toISOString()
    });
    res.status(201).json(coupon);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const existing = store.findByIdScoped('coupons', req.params.id, req.session.establishmentId);
    if (!existing) {
      return res.status(404).json({ error: 'Cupom não encontrado' });
    }

    const validation = validateCouponData(req.body);
    if (validation.error) return res.status(400).json({ error: validation.error });

    const data = validation.data;
    if (data.code.toUpperCase() !== existing.code) {
      const dup = store.queryScoped('coupons', req.session.establishmentId, (c) => c.code === data.code.toUpperCase())[0];
      if (dup) return res.status(400).json({ error: 'Código de cupom já existe' });
    }

    const updated = store.update('coupons', req.params.id, {
      code: data.code.toUpperCase(),
      type: data.type,
      value: data.value,
      maxDiscount: data.maxDiscount ?? null,
      minTotal: data.minTotal ?? null,
      startsAt: data.startsAt ?? null,
      endsAt: data.endsAt ?? null,
      usageLimit: data.usageLimit ?? null,
      applicableServices: data.applicableServices ?? [],
      status: data.status
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const existing = store.findByIdScoped('coupons', req.params.id, req.session.establishmentId);
    if (!existing) {
      return res.status(404).json({ error: 'Cupom não encontrado' });
    }
    store.remove('coupons', req.params.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.post('/validate', async (req, res, next) => {
  try {
    const { code, serviceIds, subtotal } = req.body || {};
    if (!code) return res.status(400).json({ error: 'Código do cupom é obrigatório' });

    const coupon = store.queryScoped('coupons', req.session.establishmentId, (c) => c.code === String(code).toUpperCase())[0];
    if (!coupon) return res.status(404).json({ valid: false, error: 'Cupom não encontrado' });

    const validation = isCouponValid(coupon, req.session.establishmentId, serviceIds || [], Number(subtotal) || 0);
    if (!validation.valid) {
      return res.json({ valid: false, error: validation.reason });
    }

    const discount = calculateDiscount(coupon, Number(subtotal) || 0);
    res.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        maxDiscount: coupon.maxDiscount,
        discount
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;