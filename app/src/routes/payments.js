const express = require('express');
const store = require('../data/store');
const { requireLogin, requireEstablishment } = require('../middleware/auth');

const router = express.Router();
router.use(requireLogin, requireEstablishment);

const ABACATEPAY_BASE = 'https://api.abacatepay.com/v2';

function getApiKey(estId) {
  const est = store.findById('establishments', estId);
  return est && est.abacatePayApiKey ? est.abacatePayApiKey : null;
}

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
    const errMsg = (data && (data.error || data.errorDetail || data.message)) || `AbacatePay retornou ${res.status}`;
    const err = new Error(errMsg);
    err.responseData = data;
    throw err;
  }
  return data;
}

router.put('/api-key', (req, res, next) => {
  try {
    const estId = req.session.establishmentId;
    const { apiKey } = req.body || {};
    const value = String(apiKey || '').trim();
    if (!value) {
      return res.status(400).json({ error: 'API key obrigatoria.' });
    }
    store.update('establishments', estId, { abacatePayApiKey: value });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.delete('/api-key', (req, res, next) => {
  try {
    const estId = req.session.establishmentId;
    store.update('establishments', estId, { abacatePayApiKey: '' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.get('/api-key', (req, res) => {
  const estId = req.session.establishmentId;
  const key = getApiKey(estId);
  res.json({ configured: !!key, masked: key ? '...' + key.slice(-6) : null });
});

router.post('/create-customer', async (req, res, next) => {
  try {
    const estId = req.session.establishmentId;
    const apiKey = getApiKey(estId);
    if (!apiKey) return res.status(400).json({ error: 'Configure a API key do AbacatePay nas Configuracoes.' });

    const { email, name, cellphone, taxId } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email do cliente e obrigatorio.' });

    const payload = { email };
    if (name) payload.name = name;
    if (cellphone) payload.cellphone = cellphone;
    if (taxId) payload.taxId = taxId;

    const result = await abacateRequest('POST', '/customers/create', apiKey, payload);
    res.json(result);
  } catch (err) { next(err); }
});

router.post('/create-checkout', async (req, res, next) => {
  try {
    const estId = req.session.establishmentId;
    const apiKey = getApiKey(estId);
    if (!apiKey) return res.status(400).json({ error: 'Configure a API key do AbacatePay nas Configuracoes.' });

    const { items, customerId, methods, returnUrl, completionUrl } = req.body || {};
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Itens sao obrigatorios.' });
    }

    const payload = {
      items,
      frequency: 'ONE_TIME',
      methods: methods || ['PIX']
    };
    if (customerId) payload.customerId = customerId;
    if (returnUrl) payload.returnUrl = returnUrl;
    if (completionUrl) payload.completionUrl = completionUrl;

    const result = await abacateRequest('POST', '/checkouts/create', apiKey, payload);
    res.json(result);
  } catch (err) { next(err); }
});

router.post('/create-pix', async (req, res, next) => {
  try {
    const estId = req.session.establishmentId;
    const apiKey = getApiKey(estId);
    if (!apiKey) return res.status(400).json({ error: 'Configure a API key do AbacatePay nas Configuracoes.' });

    const { amount, description, expiresIn, customer } = req.body || {};
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valor e obrigatorio e deve ser maior que zero.' });
    }

    const payload = {
      method: 'PIX',
      data: {
        amount: Math.round(amount * 100),
        description: String(description || 'Pagamento')
      }
    };
    if (expiresIn) payload.data.expiresIn = expiresIn;
    if (customer && typeof customer === 'object' && customer.name && customer.email && customer.cellphone) {
      payload.data.customer = {
        name: String(customer.name),
        email: String(customer.email),
        cellphone: String(customer.cellphone)
      };
      if (customer.taxId) payload.data.customer.taxId = String(customer.taxId);
    }

    const result = await abacateRequest('POST', '/transparents/create', apiKey, payload);
    res.json(result);
  } catch (err) { next(err); }
});

router.get('/check/:id', async (req, res, next) => {
  try {
    const estId = req.session.establishmentId;
    const apiKey = getApiKey(estId);
    if (!apiKey) return res.status(400).json({ error: 'Configure a API key do AbacatePay nas Configuracoes.' });

    const result = await abacateRequest('GET', `/transparents/check?id=${req.params.id}`, apiKey);
    res.json(result);
  } catch (err) { next(err); }
});

router.post('/create-product', async (req, res, next) => {
  try {
    const estId = req.session.establishmentId;
    const apiKey = getApiKey(estId);
    if (!apiKey) return res.status(400).json({ error: 'Configure a API key do AbacatePay nas Configuracoes.' });

    const { externalId, name, price, description } = req.body || {};
    if (!externalId || !name || !price) {
      return res.status(400).json({ error: 'externalId, name e price sao obrigatorios.' });
    }

    const payload = {
      externalId,
      name,
      price: Math.round(price * 100),
      currency: 'BRL'
    };
    if (description) payload.description = description;

    const result = await abacateRequest('POST', '/products/create', apiKey, payload);
    res.json(result);
  } catch (err) { next(err); }
});

router.get('/products', async (req, res, next) => {
  try {
    const estId = req.session.establishmentId;
    const apiKey = getApiKey(estId);
    if (!apiKey) return res.status(400).json({ error: 'Configure a API key do AbacatePay nas Configuracoes.' });

    const result = await abacateRequest('GET', '/products/list', apiKey);
    res.json(result);
  } catch (err) { next(err); }
});

module.exports = router;
