// Payment Provider Abstraction
// Supports multiple PIX providers: AbacatePay, Mercado Pago, Asaas, Generic

const PROVIDERS = {
  abacatepay: {
    name: 'AbacatePay',
    baseUrl: 'https://api.abacatepay.com/v2',
    authType: 'bearer',
    // Somente o AbacatePay exige um product cadastrado antes do checkout.
    checkoutNeedsProduct: true,
    endpoints: {
      createCustomer: '/customers/create',
      createCheckout: '/checkouts/create',
      createPix: '/transparents/create',
      checkPix: '/transparents/check',
      createProduct: '/products/create',
      listProducts: '/products/list'
    },
    // O AbacatePay valida `customer` como um todo: se voce informa QUALQUER
    // campo, exige name + cellphone + email + taxId. Mandar um customer
    // parcial (ex.: so email, comum no portal quando o cliente nao deixou CPF)
    // fazia a API responder com um erro de union do Zod
    // ("Value should be one of 'object', 'object'") e nenhum QR Code saia.
    // Sem os 4 campos, o PIX e gerado sem customer — aceito pelo provedor.
    formatPixPayload: (params) => {
      const c = params.customer || {};
      const hasCompleteCustomer = !!(c.name && c.cellphone && c.email && c.taxId);
      return {
        method: 'PIX',
        data: {
          amount: Math.round(params.amount * 100),
          description: params.description || 'Pagamento',
          ...(params.expiresIn && { expiresIn: params.expiresIn }),
          ...(hasCompleteCustomer && {
            customer: {
              name: c.name,
              email: c.email,
              cellphone: c.cellphone,
              taxId: c.taxId
            }
          })
        }
      };
    },
    // O contrato v2 do AbacatePay em `items` e' { id, quantity } com
    // additionalProperties: false — o preco vem do produto cadastrado. Mandar
    // o formato interno normalizado ({ id, name, price, qty }) era rejeitado
    // com "Total price must be at least 100 cents", porque `quantity` nao
    // existia e o total do checkout ficava 0.
    formatCheckoutPayload: (params) => {
      const items = normalizeCheckoutItems(params.items);
      // O AbacatePay exige `id` de produto em todo item (checkoutNeedsProduct).
      // Sem esse id o checkout e criado com total 0; falhar aqui deixa o
      // motivo claro em vez do "Total price must be at least 100 cents".
      if (items.some((item) => !item.id)) {
        const err = new Error('Checkout no AbacatePay exige um produto cadastrado (id) em cada item.');
        err.status = 400;
        throw err;
      }
      return {
        items: items.map((item) => ({ id: item.id, quantity: item.qty })),
        frequency: 'ONE_TIME',
        methods: params.methods || ['PIX'],
        ...(params.customerId && { customerId: params.customerId }),
        ...(params.returnUrl && { returnUrl: params.returnUrl }),
        ...(params.completionUrl && { completionUrl: params.completionUrl })
      };
    },
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
    // A preference do MP recebe os itens inline (title/unit_price): nao ha
    // "product" cadastrado, logo pay-card nao deve chamar createProduct.
    checkoutNeedsProduct: false,
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
    formatCheckoutPayload: (params) => {
      const items = normalizeCheckoutItems(params.items).map((item) => ({
        id: item.id,
        title: item.name || 'Pagamento',
        quantity: item.qty,
        unit_price: item.price,
        currency_id: 'BRL'
      }));
      return {
        items,
        back_urls: {
          success: params.returnUrl,
          failure: params.returnUrl,
          pending: params.returnUrl
        },
        auto_return: 'approved',
        ...(params.completionUrl && { notification_url: params.completionUrl })
      };
    },
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
    // O checkout do Asaas e um /payments com value+description: nao ha product.
    checkoutNeedsProduct: false,
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
    formatCheckoutPayload: (params) => {
      const items = normalizeCheckoutItems(params.items);
      return {
        billingType: 'PIX',
        value: items.reduce((sum, item) => sum + (Number(item.price) || 0) * item.qty, 0),
        description: params.description || items.map((i) => `${i.name} x${i.qty}`).join(', ') || 'Pagamento',
        ...(params.returnUrl && { redirectUrl: params.returnUrl }),
        ...(params.completionUrl && { notificationUrl: params.completionUrl })
      };
    },
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
    // API propria: envia o item com todos os campos (id, nome, preco, qtd) para
    // que sirva tanto para o formato "por produto" quanto "por valor".
    checkoutNeedsProduct: false,
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
      items: normalizeCheckoutItems(params.items).map((item) => ({
        ...(item.id && { id: item.id }),
        name: item.name,
        price: item.price,
        qty: item.qty,
        quantity: item.qty
      })),
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

// Normaliza itens de checkout para um unico formato interno:
// { id?, name, price, qty }. Cada provedor entao traduz para o seu contrato.
function normalizeCheckoutItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      ...(item.id ? { id: String(item.id) } : {}),
      name: String(item.name || item.title || 'Pagamento'),
      price: Number(item.price != null ? item.price : item.unit_price) || 0,
      qty: Math.max(1, Math.floor(Number(item.qty || item.quantity) || 1))
    }));
}

// Erro de "provedor nao suporta esta operacao" — o chamador deve responder 400
// (falha de configuracao do usuario), nao 500.
function unsupported(providerConfig, endpoint) {
  const err = new Error(`${providerConfig.name} nao suporta a operacao "${endpoint}".`);
  err.code = 'UNSUPPORTED_OPERATION';
  err.status = 400;
  return err;
}

// Alguns provedores (AbacatePay) respondem com o dump de validacao do proprio
// Zod ("Value should be one of 'object', 'object'") quando a API key esta
// invalida. Repassar isso ao dono da loja na ajuda em nada; a causa real,
// quase sempre, e a credencial. Vale tanto para HTTP de erro quanto para o
// envelope de erro em HTTP 200.
function normalizeProviderErrorMessage(message, providerName) {
  const msg = String(message || '');
  if (/should be one of|invalid_type|Expected .+ received|received undefined/i.test(msg)) {
    return `${providerName} recusou a solicitacao. Verifique a API key das Configuracoes `
      + '(chave invalida ou expirada) e os dados da cobranca.';
  }
  return msg;
}

async function makeRequest(provider, endpoint, apiKey, payload, config = {}) {
  const providerConfig = getProvider(provider);
  // Remove barra final para nao gerar "//pix/create" quando a baseUrl tem "/".
  const baseUrl = String(provider === 'generic' ? config.baseUrl : providerConfig.baseUrl || '').replace(/\/+$/, '');

  if (!baseUrl) {
    throw new Error('URL base nao configurada para provedor generico');
  }

  // Sem endpoint cadastrado, a URL viraria ".../undefined" e o fetch lancaria
  // ERR_INVALID_URL (500 opaco). Falha de integracao, nao de codigo.
  const endpointPath = providerConfig.endpoints[endpoint];
  if (!endpointPath) throw unsupported(providerConfig, endpoint);

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

  const method = endpoint === 'checkPix' ? 'GET' : 'POST';
  let url = `${baseUrl}${endpointPath}`;
  const opts = { method, headers };

  if (method === 'POST' && payload) {
    opts.body = JSON.stringify(payload);
  } else if (method === 'GET' && payload) {
    // checkPix consulta por id: sem a query string o provedor nao sabe o que
    // procurar e responde "pendente" para sempre.
    const query = new URLSearchParams(payload).toString();
    if (query) url += (url.includes('?') ? '&' : '?') + query;
  }

  const res = await fetch(url, opts);
  let data;
  try { data = await res.json(); } catch (e) { data = null; }
  
  if (!res.ok) {
    const errMsg = (data && (data.error || data.errorDetail || data.message || (Array.isArray(data.errors) && data.errors[0] && data.errors[0].description)))
      || `${providerConfig.name} retornou ${res.status}`;
    const err = new Error(normalizeProviderErrorMessage(errMsg, providerConfig.name));
    err.responseData = data;
    err.status = res.status;
    throw err;
  }

  // Alguns provedores (AbacatePay) respondem HTTP 200 com um envelope de
  // erro: { success: false, data: null, error: "..." }. Sem checar isso aqui,
  // o parse*Response recebia `null` e o Zod do proprio provedor estourava,
  // devolvendo ao cliente uma mensagem crua e inútil em vez da causa real.
  if (data && typeof data === 'object' && data.success === false) {
    const errMsg = data.error
      || (typeof data.errors === 'object' && data.errors && JSON.stringify(data.errors))
      || `${providerConfig.name} recusou a operacao.`;
    const err = new Error(normalizeProviderErrorMessage(errMsg, providerConfig.name));
    err.responseData = data;
    err.status = 422;
    throw err;
  }

  return data;
}

async function createPixPayment(provider, apiKey, params, config = {}) {
  const providerConfig = getProvider(provider);
  const payload = providerConfig.formatPixPayload(params);
  const data = await makeRequest(provider, 'createPix', apiKey, payload, config);
  const parsed = providerConfig.parsePixResponse(data);
  // Sem brCode nem QR base64 nao ha PIX para mostrar: o modal renderizava um
  // bloco vazio e o cliente achava que o cobrança tinha sido gerada. Falha
  // aqui e' erro do provedor, nao sucesso silencioso.
  if (!parsed.brCode && !parsed.brCodeBase64 && !parsed.qrCode && !parsed.qrCodeBase64) {
    const err = new Error(
      `${providerConfig.name} nao devolveu o codigo PIX da cobranca. Verifique a API key e os dados enviados.`
    );
    err.responseData = data;
    err.status = 502;
    throw err;
  }
  return parsed;
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
  const endpoint = provider === 'mercadopago' ? 'createPreference' : 'createCheckout';
  let data;
  try {
    data = await makeRequest(provider, endpoint, apiKey, payload, config);
  } catch (err) {
    const wantsCard = (payload.methods || []).includes('CARD');
    // Conta sem cartao habilitado (comum em dev/sandbox e em planos que nao
    // incluem cartao): o provedor rejeita o checkout INTEIRO, nem com PIX
    // junto. Refaz so com PIX para nao perder a venda, e sinaliza em
    // `cardUnavailable` para a interface avisar o usuario.
    if (wantsCard && /CARD is not available/i.test(err.message || '')) {
      data = await makeRequest(provider, endpoint, apiKey, { ...payload, methods: ['PIX'] }, config);
      data = { ...data, cardUnavailable: true };
    } else {
      throw err;
    }
  }
  const parsed = providerConfig.parseCheckoutResponse(data);
  if (data && data.cardUnavailable) parsed.cardUnavailable = true;
  return parsed;
}

async function createProduct(provider, apiKey, params, config = {}) {
  const providerConfig = getProvider(provider);
  if (typeof providerConfig.formatProductPayload !== 'function') {
    throw unsupported(providerConfig, 'createProduct');
  }
  const payload = providerConfig.formatProductPayload(params);
  return await makeRequest(provider, 'createProduct', apiKey, payload, config);
}

async function listProducts(provider, apiKey, config = {}) {
  const providerConfig = getProvider(provider);
  if (!providerConfig.endpoints.listProducts) {
    throw unsupported(providerConfig, 'listProducts');
  }
  return await makeRequest(provider, 'listProducts', apiKey, null, config);
}

// O checkout deste provedor exige um product cadastrado antes? (ver
// checkoutNeedsProduct em cada provider). Se false, o chamador deve passar
// o valor direto em items: [{ name, price, qty }].
function checkoutNeedsProduct(provider) {
  const providerConfig = getProvider(provider);
  return providerConfig.checkoutNeedsProduct === true;
}

module.exports = {
  PROVIDERS,
  getProvider,
  getAvailableProviders,
  normalizeCheckoutItems,
  checkoutNeedsProduct,
  makeRequest,
  createPixPayment,
  checkPixPayment,
  createCustomer,
  createCheckout,
  createProduct,
  listProducts
};