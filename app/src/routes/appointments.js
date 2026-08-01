const express = require('express');
const { v4: uuid } = require('uuid');
const store = require('../data/store');
const { requireLogin, requireEstablishment } = require('../middleware/auth');

const router = express.Router();
router.use(requireLogin, requireEstablishment);

const VALID_STATUSES = ['Pendente', 'Em Andamento', 'Concluido', 'Cancelado'];

function decorate(appt, estId) {
  const client = store.findById('clients', appt.clientId);
  const employee = appt.employeeId ? store.findById('employees', appt.employeeId) : null;
  return {
    ...appt,
    clientName: client ? client.name : '(cliente removido)',
    clientPhone: client ? client.phone : '',
    employeeName: employee ? employee.name : null
  };
}

router.get('/', (req, res, next) => {
  try {
    const list = store
      .query('appointments', (row) => row.establishmentId === req.session.establishmentId)
      .sort((a, b) => (a.dateTime < b.dateTime ? 1 : -1))
      .map((row) => decorate(row));
    res.json(list);
  } catch (err) {
    next(err);
  }
});

router.post('/', (req, res, next) => {
  try {
    const body = req.body || {};
    const { clientId, newClientName, newClientPhone, employeeId, serviceId, dateTime, total, status } = body;
    const estId = req.session.establishmentId;

    let finalClientId = clientId;
    if (!finalClientId && newClientName) {
      const created = store.insert('clients', {
        id: uuid(),
        establishmentId: estId,
        name: newClientName,
        phone: newClientPhone || '',
        email: '',
        notes: '',
        createdAt: new Date().toISOString()
      });
      finalClientId = created.id;
    }
    if (!finalClientId || !dateTime) {
      return res.status(400).json({ error: 'Cliente e data/hora sao obrigatorios.' });
    }

    if (finalClientId) {
      const client = store.findById('clients', finalClientId);
      if (!client || client.establishmentId !== estId) {
        return res.status(400).json({ error: 'Cliente invalido.' });
      }
    }
    if (employeeId) {
      const employee = store.findById('employees', employeeId);
      if (!employee || employee.establishmentId !== estId) {
        return res.status(400).json({ error: 'Funcionario invalido.' });
      }
    }

    let serviceName = '';
    let computedTotal = Number(total) || 0;
    if (serviceId) {
      const service = store.findById('services', serviceId);
      if (!service || service.establishmentId !== estId) {
        return res.status(400).json({ error: 'Servico invalido.' });
      }
      serviceName = service.name;
      if (!total) computedTotal = service.price;
    }

    const finalStatus = VALID_STATUSES.includes(status) ? status : 'Pendente';

    const row = store.insert('appointments', {
      id: uuid(),
      establishmentId: estId,
      clientId: finalClientId,
      employeeId: employeeId || null,
      serviceId: serviceId || null,
      serviceName,
      dateTime,
      total: computedTotal,
      status: finalStatus,
      source: 'admin',
      createdAt: new Date().toISOString()
    });
    res.status(201).json(decorate(row));
  } catch (err) {
    next(err);
  }
});

router.put('/:id', (req, res, next) => {
  try {
    const existing = store.findById('appointments', req.params.id);
    if (!existing || existing.establishmentId !== req.session.establishmentId) {
      return res.status(404).json({ error: 'Agendamento nao encontrado.' });
    }
    const body = req.body || {};
    const patch = {};
    ['clientId', 'employeeId', 'serviceId', 'dateTime', 'total'].forEach((f) => {
      if (body[f] !== undefined) patch[f] = body[f];
    });
    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) {
        return res.status(400).json({ error: 'Status invalido.' });
      }
      patch.status = body.status;
    }
    if (body.clientId !== undefined) {
      const client = store.findById('clients', body.clientId);
      if (!client || client.establishmentId !== req.session.establishmentId) {
        return res.status(400).json({ error: 'Cliente invalido.' });
      }
      patch.clientId = body.clientId;
    }
    if (body.employeeId !== undefined) {
      const employee = store.findById('employees', body.employeeId);
      if (!employee || employee.establishmentId !== req.session.establishmentId) {
        return res.status(400).json({ error: 'Funcionario invalido.' });
      }
      patch.employeeId = body.employeeId;
    }
    if (body.serviceId) {
      const service = store.findById('services', body.serviceId);
      if (!service || service.establishmentId !== req.session.establishmentId) {
        return res.status(400).json({ error: 'Servico invalido.' });
      }
      patch.serviceId = body.serviceId;
      patch.serviceName = service.name;
    }
    const updated = store.update('appointments', req.params.id, patch);
    res.json(decorate(updated));
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', (req, res, next) => {
  try {
    const existing = store.findById('appointments', req.params.id);
    if (!existing || existing.establishmentId !== req.session.establishmentId) {
      return res.status(404).json({ error: 'Agendamento nao encontrado.' });
    }
    store.remove('appointments', req.params.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
