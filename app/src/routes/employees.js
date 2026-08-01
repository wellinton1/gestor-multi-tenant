const makeCrudRouter = require('./makeCrudRouter');

module.exports = makeCrudRouter('employees', ['name', 'role', 'email', 'phone'], (body) => ({
  role: body.role || 'Funcionario'
}));
