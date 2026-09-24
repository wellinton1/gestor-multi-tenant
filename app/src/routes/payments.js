const express = require('express');
const store = require('../data/store');
const { requireLogin, requireEstablishment } = require('../middleware/auth');
const {
  getAvailableProviders,
  createPixPayment,
  checkPixPayment,
  createCustomer,
  createCheckout,
  createProduct,
  listProducts
} = require('../utils/payment-providers');

const router = express.Router();
router.use(requireLogin, requireEstablishment);

function getPaymentConfig(estId) {
  const est = store.findById('establishments', estId);
  if (!est) return null;
  const provider = est.pixProvider || 'abacatepay';
  const apiKey = est.pixApiKey || est.abacatePayApiKey || '';
  const baseUrl = est.pixBaseUrl || '';
  const extraHeaders = est.pixExtraHeaders ? JSON.parse(est.pixExtraHeaders) : {};
  return { provider, apiKey, baseUrl, extraHeaders, configured: !!(apiKey && provider) };
}

router.get('/providers', (req, res) => {
  res.json({ providers: getAvailableProviders() });
});

router.get('/config', (req, res) => {
  const config = getPaymentConfig(req.session.establishmentId);
  if (!config) return res.json({ configured: false });
  res.json({
    configured: config.configured,
    provider: config.provider,
    masked: config.apiKey ? '...' + config.apiKey.slice(-6) : null
  });
});

router.put('/config', async (req, res, next) => {
  try {
    const estId = req.session.establishmentId;
    const { provider, apiKey, baseUrl, extraHeaders } = req.body || {};
    
    const providers = getAvailableProviders().map(p => p.id);
    if (!providers.includes(provider)) {
      return res.status(400).json({ error: 'Provedor inválido' });
    }

    const updateData = {
      pixProvider: provider,
      pixApiKey: String(apiKey || '').trim(),
      pixBaseUrl: provider === 'generic' ? String(baseUrl || '').trim() : '',
      pixExtraHeaders: provider === 'generic' && extraHeaders ? JSON.stringify(extraHeaders) : ''
    };

    // Mantém compatibilidade com campo antigo
    if (provider === 'abacatepay') {
      updateData.abacatePayApiKey = updateData.pixApiKey;
    }

    store.update('establishments', estId, updateData);
    res.json({ ok: true, provider });
  } catch (err) { next(err); }
});

router.delete('/config', (req, res, next) => {
  try {
    const estId = req.session.establishmentId;
    store.update('establishments', estId, {
      pixProvider: 'abacatepay',
      pixApiKey: '',
      pixBaseUrl: '',
      pixExtraHeaders: '',
      abacatePayApiKey: ''
    });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.post('/create-customer', async (req, res, next) => {
  try {
    const config = getPaymentConfig(req.session.establishmentId);
    if (!config?.configured) return res.status(400).json({ error: 'Configure a chave da API de pagamentos nas Configurações.' });

    const { email, name, cellphone, taxId } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email do cliente é obrigatório.' });

    const result = await createCustomer(config.provider, config.apiKey, { email, name, cellphone, taxId }, config);
    res.json(result);
  } catch (err) { next(err); }
});

router.post('/create-checkout', async (req, res, next) => {
  try {
    const config = getPaymentConfig(req.session.establishmentId);
    if (!config?.configured) return res.status(400).json({ error: 'Configure a chave da API de pagamentos nas Configurações.' });

    const { items, customerId, methods, returnUrl, completionUrl } = req.body || {};
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Itens são obrigatórios.' });
    }

    const result = await createCheckout(config.provider, config.apiKey, { items, customerId, methods, returnUrl, completionUrl }, config);
    res.json(result);
  } catch (err) { next(err); }
});

router.post('/create-pix', async (req, res, next) => {
  try {
    const config = getPaymentConfig(req.session.establishmentId);
    if (!config?.configured) return res.status(400).json({ error: 'Configure a chave da API de pagamentos nas Configurações.' });

    const { amount, description, expiresIn, customer } = req.body || {};
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valor é obrigatório e deve ser maior que zero.' });
    }

    const result = await createPixPayment(config.provider, config.apiKey, { amount, description, expiresIn, customer }, config);
    res.json(result);
  } catch (err) { next(err); }
});

router.get('/check/:id', async (req, res, next) => {
  try {
    const config = getPaymentConfig(req.session.establishmentId);
    if (!config?.configured) return res.status(400).json({ error: 'Configure a chave da API de pagamentos nas Configurações.' });

    const result = await checkPixPayment(config.provider, config.apiKey, req.params.id, config);
    res.json(result);
  } catch (err) { next(err); }
});

router.post('/create-product', async (req, res, next) => {
  try {
    const config = getPaymentConfig(req.session.establishmentId);
    if (!config?.configured) return res.status(400).json({ error: 'Configure a chave da API de pagamentos nas Configurações.' });

    const { externalId, name, price, description } = req.body || {};
    if (!externalId || !name || !price) {
      return res.status(400).json({ error: 'externalId, name e price são obrigatórios.' });
    }

    const result = await createProduct(config.provider, config.apiKey, { externalId, name, price, description }, config);
    res.json(result);
  } catch (err) { next(err); }
});

router.get('/products', async (req, res, next) => {
  try {
    const config = getPaymentConfig(req.session.establishmentId);
    if (!config?.configured) return res.status(400).json({ error: 'Configure a chave da API de pagamentos nas Configurações.' });

    const result = await listProducts(config.provider, config.apiKey, config);
    res.json(result);
  } catch (err) { next(err); }
});

module.exports = router;