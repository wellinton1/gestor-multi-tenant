const makeCrudRouter = require('./makeCrudRouter');

module.exports = makeCrudRouter(
  'services',
  ['itemType', 'category', 'name', 'description', 'price', 'durationMinutes', 'photoDataUrl'],
  (body) => ({
    itemType: body.itemType === 'Produto' ? 'Produto' : 'Servico',
    price: Number(body.price) || 0,
    durationMinutes: body.durationMinutes ? Number(body.durationMinutes) : 0,
    photoDataUrl: body.photoDataUrl || ''
  })
);
