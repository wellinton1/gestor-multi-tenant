const makeCrudRouter = require('./makeCrudRouter');

module.exports = makeCrudRouter('clients', ['name', 'email', 'phone', 'notes']);
