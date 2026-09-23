const makeCrudRouter = require('./makeCrudRouter');

module.exports = makeCrudRouter('clients', [
  'name',
  'email',
  'phone',
  'notes',
  'addressStreet',
  'addressCity',
  'addressState',
  'addressNumber',
  'addressComplement',
  'addressDistrict',
  'addressReference',
  'addressLabel'
]);
