const makeCrudRouter = require('./makeCrudRouter');

module.exports = makeCrudRouter(
  'services',
  ['category', 'name', 'description', 'price', 'durationMinutes', 'photoDataUrl'],
  (body) => ({
    price: Number(body.price) || 0,
    durationMinutes: Number(body.durationMinutes) || 0,
    photoDataUrl: body.photoDataUrl || ''
  })
);
