const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const store = require('../data/store');
const { requireLogin, requireEstablishment } = require('../middleware/auth');

const router = express.Router();
router.use(requireLogin, requireEstablishment);

function decorate(closing) {
  return {
    ...closing,
    createdAt: closing.createdAt || new Date().toISOString()
  };
}

router.get('/', (req, res, next) => {
  try {
    const list = store
      .allScoped('cashClosings', req.session.establishmentId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    res.json(list);
  } catch (err) {
    next(err);
  }
});

// Get total of completed orders for cash closing
router.get('/completed-orders-total', (req, res, next) => {
  try {
    const estId = req.session.establishmentId;
    const appointments = store.queryScoped('appointments', estId, (a) => a.status === 'Concluido');
    const total = appointments.reduce((sum, a) => sum + (Number(a.total) || 0), 0);
    res.json({ total, count: appointments.length });
  } catch (err) {
    next(err);
  }
});

router.post('/', (req, res, next) => {
  try {
    const body = req.body || {};
    const { title, description, amount, closedBy, closingDate } = body;
    if (!title || amount === undefined || amount === null) {
      return res.status(400).json({ error: 'Titulo e valor sao obrigatorios.' });
    }

    const row = store.insert('cashClosings', {
      id: uuid(),
      establishmentId: req.session.establishmentId,
      title,
      description: description || '',
      amount: Number(amount) || 0,
      closedBy: closedBy || '',
      closingDate: closingDate || new Date().toISOString(),
      createdAt: new Date().toISOString()
    });

    res.status(201).json(decorate(row));
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', (req, res, next) => {
  try {
    const existing = store.findByIdScoped('cashClosings', req.params.id, req.session.establishmentId);
    if (!existing) {
      return res.status(404).json({ error: 'Registro nao encontrado.' });
    }
    const { password } = req.body || {};
    if (!password) {
      return res.status(400).json({ error: 'Senha obrigatoria para exclusao.' });
    }
    const user = store.findById('users', req.session.userId);
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Senha invalida.' });
    }
    store.remove('cashClosings', req.params.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
