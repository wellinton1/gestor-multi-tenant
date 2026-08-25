const express = require('express');
const store = require('../data/store');
const { requireLogin, requireEstablishment } = require('../middleware/auth');

const router = express.Router();
router.use(requireLogin, requireEstablishment);

router.get('/', (req, res, next) => {
  try {
    const estId = req.session.establishmentId;
    const appointments = store.query('appointments', (a) => a.establishmentId === estId);
    const clients = store.query('clients', (c) => c.establishmentId === estId);
    const employees = store.query('employees', (e) => e.establishmentId === estId);

    const inProgress = appointments.filter((a) => a.status === 'Em Andamento').length;
    const revenue = appointments
      .filter((a) => a.status === 'Concluido')
      .reduce((sum, a) => sum + (Number(a.total) || 0), 0);

    const recent = appointments
      .slice()
      .sort((a, b) => (a.dateTime < b.dateTime ? 1 : -1))
      .slice(0, 5)
      .map((a) => {
        const client = store.findById('clients', a.clientId);
        return {
          id: a.id,
          clientName: client ? client.name : '(cliente removido)',
          dateTime: a.dateTime,
          total: a.total,
          status: a.status
        };
      });

    res.json({
      totalAppointments: appointments.length,
      inProgress,
      totalClients: clients.length,
      totalEmployees: employees.length,
      revenue,
      recentAppointments: recent
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
