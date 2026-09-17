// Payment Provider Abstraction
// Supports multiple PIX providers: AbacatePay, Mercado Pago, Asaas, Generic

const PROVIDERS = {
  abacatepay: {
    name: 'AbacatePay',
    baseUrl: 'https://api.abacatepay.com/v2',
    authType: 'bearer',
    endpoints: {
      createCustomer: '/customers/create',
      createCheckout: '/checkouts/create',
      createPix: '/transparents/create',
      checkPix: '/transparents/check',
      createProduct: '/products/create',
      listProducts: '/products/list'
    },
    formatPixPayload: (params) => ({
      method: 'PIX',
      data: {
        amount: Math.round(params.amount * 100),
        description: params.description || 'Pagamento',
        ...(params.expiresIn && { expiresIn: params.expiresIn }),
        ...(params.customer && {
          customer: {
            name: params.customer.name,
            email: params.customer.email,
            cellphone: params.customer.cellphone,
            ...(params.customer.taxId && { taxId: params.customer.taxId })
          }
        })
      }
    }),
    formatCheckoutPayload: (params) => ({
      items: params.items,
      frequency: 'ONE_TIME',
      methods: params.methods || ['PIX'],
      ...(params.customerId && { customerId: params.customerId }),
      ...(params.returnUrl && { returnUrl: params.returnUrl }),
      ...(params.completionUrl && { completionUrl: params.completionUrl })
    }),
    formatCustomerPayload: (params) => ({
      email: params.email,
      ...(params.name && { name: params.name }),
      ...(params.cellphone && { cellphone: params.cellphone }),
      ...(params.taxId && { taxId: params.taxId })
    }),
    formatProductPayload: (params) => ({
      externalId: params.externalId,
      name: params.name,
      price: Math.round(params.price * 100),
      currency: 'BRL',
      ...(params.description && { description: params.description })
    }),
    parsePixResponse: (data) => ({
      id: data.data?.id || data.id,
      brCode: data.data?.brCode || data.brCode,
      brCodeBase64: data.data?.brCodeBase64 || data.brCodeBase64,
      qrCode: data.data?.qrCode || data.qrCode,
      qrCodeBase64: data.data?.qrCodeBase64 || data.qrCodeBase64,
      status: data.data?.status || data.status,
      expiresAt: data.data?.expiresAt || data.expiresAt
    }),
    parseCheckoutResponse: (data) => ({
      id: data.data?.id || data.id,
      url: data.data?.url || data.url,
      status: data.data?.status || data.status
    }),
    parseCheckResponse: (data) => ({
      status: data.data?.status || data.status,
      paidAt: data.data?.paidAt || data.paidAt
    })
  },

  mercadopago: {
    name: 'Mercado Pago',
    baseUrl: 'https://api.mercadopago.com',
    authType: 'bearer',
    endpoints: {
      createPix: '/v1/payments',
      checkPix: '/v1/payments',
      createCustomer: '/v1/customers',
      createPreference: '/checkout/preferences'
    },
    formatPixPayload: (params) => ({
      transaction_amount: params.amount,
      description: params.description || 'Pagamento',
      payment_method_id: 'pix',
      payer: params.customer ? {
        email: params.customer.email,
        first_name: params.customer.name?.split(' ')[0] || 'Cliente',
        last_name: params.customer.name?.split(' ').slice(1).join(' ') || '',
        phone: params.customer.cellphone ? {
          area_code: params.customer.cellphone.slice(0, 2),
          number: params.customer.cellphone.slice(2)
        } : undefined,
        identification: params.customer.taxId ? {
          type: 'CPF',
          number: params.customer.taxId.replace(/\D/g, '')
        } : undefined
      } : { email: 'cliente@email.com' },
      ...(params.expiresIn && { date_of_expiration: new Date(Date.now() + params.expiresIn * 1000).toISOString() })
    }),
    formatCheckoutPayload: (params) => ({
      items: params.items?.map(item => ({
        id: item.id,
        title: item.name || item.title,
        quantity: item.qty || item.quantity || 1,
        unit_price: item.price || item.unit_price,
        currency_id: 'BRL'
      })) || [],
      back_urls: {
        success: params.returnUrl,
        failure: params.returnUrl,
        pending: params.returnUrl
      },
      auto_return: 'approved',
      ...(params.completionUrl && { notification_url: params.completionUrl })
    }),
    formatCustomerPayload: (params) => ({
      email: params.email,
      first_name: params.name?.split(' ')[0] || 'Cliente',
      last_name: params.name?.split(' ').slice(1).join(' ') || '',
      ...(params.cellphone && { phone: { area_code: params.cellphone.slice(0, 2), number: params.cellphone.slice(2) } }),
      ...(params.taxId && { identification: { type: 'CPF', number: params.taxId.replace(/\D/g, '') } })
    }),
    parsePixResponse: (data) => ({
      id: data.id,
      brCode: data.point_of_interaction?.transaction_data?.qr_code,
      brCodeBase64: data.point_of_interaction?.transaction_data?.qr_code_base64,
      qrCode: data.point_of_interaction?.transaction_data?.qr_code,
      qrCodeBase64: data.point_of_interaction?.transaction_data?.qr_code_base64,
      status: data.status,
      expiresAt: data.date_of_expiration
    }),
    parseCheckoutResponse: (data) => ({
      id: data.id,
      url: data.init_point || data.sandbox_init_point,
      status: data.status
    }),
    parseCheckResponse: (data) => ({
      status: data.status,
      paidAt: data.date_approved
    })
  },

  asaas: {
    name: 'Asaas',
    baseUrl: 'https://api.asaas.com/v3',
    authType: 'access_token',
    endpoints: {
      createPix: '/payments',
      checkPix: '/payments',
      createCustomer: '/customers',
      createCheckout: '/payments'
    },
    formatPixPayload: (params) => ({
      billingType: 'PIX',
      value: params.amount,
      description: params.description || 'Pagamento',
      ...(params.expiresIn && { dueDate: new Date(Date.now() + params.expiresIn * 1000).toISOString().split('T')[0] }),
      ...(params.customer && {
        customer: {
          name: params.customer.name,
          email: params.customer.email,
          phone: params.customer.cellphone,
          cpfCnpj: params.customer.taxId
        }
      })
    }),
    formatCheckoutPayload: (params) => ({
      billingType: 'PIX',
      value: params.items?.reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0) || 0,
      description: params.items?.map(i => `${i.name} x${i.qty || 1}`).join(', ') || 'Pagamento',
      ...(params.returnUrl && { redirectUrl: params.returnUrl }),
      ...(params.completionUrl && { notificationUrl: params.completionUrl })
    }),
    formatCustomerPayload: (params) => ({
      name: params.name || params.email.split('@')[0],
      email: params.email,
      ...(params.cellphone && { phone: params.cellphone }),
      ...(params.taxId && { cpfCnpj: params.taxId.replace(/\D/g, '') })
    }),
    parsePixResponse: (data) => ({
      id: data.id,
      brCode: data.pixQrCode,
      brCodeBase64: data.pixQrCodeBase64,
      qrCode: data.pixQrCode,
      qrCodeBase64: data.pixQrCodeBase64,
      status: data.status,
      expiresAt: data.dueDate
    }),
    parseCheckoutResponse: (data) => ({
      id: data.id,
      url: data.invoiceUrl || data.bankSlipUrl,
      status: data.status
    }),
    parseCheckResponse: (data) => ({
      status: data.status,
      paidAt: data.paymentDate
    })
  },

  generic: {
    name: 'PIX Genérico (API Própria)',
    baseUrl: '', // Configured per establishment
    authType: 'bearer',
    endpoints: {
      createPix: '/pix/create',
      checkPix: '/pix/check',
      createCustomer: '/customers',
      createCheckout: '/checkout/create'
    },
    formatPixPayload: (params) => ({
      amount: Math.round(params.amount * 100),
      description: params.description || 'Pagamento',
      ...(params.expiresIn && { expiresIn: params.expiresIn }),
      ...(params.customer && { customer: params.customer })
    }),
    formatCheckoutPayload: (params) => ({
      items: params.items,
      ...(params.customerId && { customerId: params.customerId }),
      ...(params.returnUrl && { returnUrl: params.returnUrl }),
      ...(params.completionUrl && { completionUrl: params.completionUrl })
    }),
    formatCustomerPayload: (params) => ({
      email: params.email,
      ...(params.name && { name: params.name }),
      ...(params.cellphone && { cellphone: params.cellphone }),
      ...(params.taxId && { taxId: params.taxId })
    }),
    parsePixResponse: (data) => ({
      id: data.id || data.transactionId,
      brCode: data.brCode || data.pixCode || data.qrCode,
      brCodeBase64: data.brCodeBase64 || data.qrCodeBase64,
      qrCode: data.qrCode || data.pixCode,
      qrCodeBase64: data.qrCodeBase64,
      status: data.status,
      expiresAt: data.expiresAt
    }),
    parseCheckoutResponse: (data) => ({
      id: data.id || data.checkoutId,
      url: data.url || data.checkoutUrl,
      status: data.status
    }),
    parseCheckResponse: (data) => ({
      status: data.status,
      paidAt: data.paidAt
    })
  }
};

function getProvider(providerId) {
  const provider = PROVIDERS[providerId];
  if (!provider) {
    throw new Error(`Provedor de pagamento desconhecido: ${providerId}`);
  }
  return provider;
}

function getAvailableProviders() {
  return Object.entries(PROVIDERS).map(([id, provider]) => ({
    id,
    name: provider.name
  }));
}

async function makeRequest(provider, endpoint, apiKey, payload, config = {}) {
  const providerConfig = getProvider(provider);
  const baseUrl = provider === 'generic' ? config.baseUrl : providerConfig.baseUrl;
  
  if (!baseUrl) {
    throw new Error('URL base não configurada para provedor genérico');
  }

  const headers = {
    'Content-Type': 'application/json'
  };

  if (providerConfig.authType === 'access_token') {
    headers['access_token'] = apiKey;
  } else {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  // Add custom headers for generic provider
  if (provider === 'generic' && config.extraHeaders) {
    Object.assign(headers, config.extraHeaders);
  }

  const url = `${baseUrl}${providerConfig.endpoints[endpoint]}`;
  const method = endpoint === 'checkPix' ? 'GET' : 'POST';

  const opts = {
    method,
    headers
  };

  if (method === 'POST' && payload) {
    opts.body = JSON.stringify(payload);
  } else if (method === 'GET' && payload) {
    // For GET requests, append query params
    const params = new URLSearchParams(payload);
    const separator = url.includes('?') ? '&' : '?';
    opts.method = 'GET';
    // We'll handle GET with query params differently
  }

  const res = await fetch(url, opts);
  let data;
  try { data = await res.json(); } catch (e) { data = null; }
  
  if (!res.ok) {
    const errMsg = (data && (data.error || data.errorDetail || data.message || data.errors?.[0]?.description)) 
      || `${providerConfig.name} retornou ${res.status}`;
    const err = new Error(errMsg);
    err.responseData = data;
    err.status = res.status;
    throw err;
  }
  
  return data;
}

async function createPixPayment(provider, apiKey, params, config = {}) {
  const providerConfig = getProvider(provider);
  const payload = providerConfig.formatPixPayload(params);
  const data = await makeRequest(provider, 'createPix', apiKey, payload, config);
  return providerConfig.parsePixResponse(data);
}

async function checkPixPayment(provider, apiKey, paymentId, config = {}) {
  const providerConfig = getProvider(provider);
  const payload = { id: paymentId };
  const data = await makeRequest(provider, 'checkPix', apiKey, payload, config);
  return providerConfig.parseCheckResponse(data);
}

async function createCustomer(provider, apiKey, params, config = {}) {
  const providerConfig = getProvider(provider);
  const payload = providerConfig.formatCustomerPayload(params);
  return await makeRequest(provider, 'createCustomer', apiKey, payload, config);
}

async function createCheckout(provider, apiKey, params, config = {}) {
  const providerConfig = getProvider(provider);
  const payload = providerConfig.formatCheckoutPayload(params);
  const data = await makeRequest(provider, provider === 'mercadopago' ? 'createPreference' : 'createCheckout', apiKey, payload, config);
  return providerConfig.parseCheckoutResponse(data);
}

async function createProduct(provider, apiKey, params, config = {}) {
  const providerConfig = getProvider(provider);
  const payload = providerConfig.formatProductPayload(params);
  return await makeRequest(provider, 'createProduct', apiKey, payload, config);
}

async function listProducts(provider, apiKey, config = {}) {
  return await makeRequest(provider, 'listProducts', apiKey, null, config);
}

module.exports = {
  PROVIDERS,
  getProvider,
  getAvailableProviders,
  makeRequest,
  createPixPayment,
  checkPixPayment,
  createCustomer,
  createCheckout,
  createProduct,
  listProducts
};