const express = require('express');
const { v4: uuid } = require('uuid');
const store = require('../data/store');
const { requireLogin, requireEstablishment } = require('../middleware/auth');

// Builds a small tenant-scoped CRUD router.
// fields: allow-list of editable fields for this collection.
// defaults: fn(body) -> object with any computed/default fields to merge in on create.
function makeCrudRouter(collection, fields, defaults) {
  const router = express.Router();
  router.use(requireLogin, requireEstablishment);

  router.get('/', (req, res, next) => {
    try {
      const list = store
        .allScoped(collection, req.session.establishmentId)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      res.json(list);
    } catch (err) {
      next(err);
    }
  });

  router.post('/', (req, res, next) => {
    try {
      const body = req.body || {};
      const row = { id: uuid(), establishmentId: req.session.establishmentId, createdAt: new Date().toISOString() };
      fields.forEach((f) => {
        row[f] = body[f] !== undefined ? String(body[f]).trim() : '';
      });
      if (defaults) Object.assign(row, defaults(body));
      const inserted = store.insert(collection, row);
      res.status(201).json(inserted);
    } catch (err) {
      next(err);
    }
  });

  router.put('/:id', (req, res, next) => {
    try {
      const existing = store.findByIdScoped(collection, req.params.id, req.session.establishmentId);
      if (!existing) {
        return res.status(404).json({ error: 'Registro nao encontrado.' });
      }
      const body = req.body || {};
      const patch = {};
      fields.forEach((f) => {
        if (body[f] !== undefined) patch[f] = body[f];
      });
      const updated = store.update(collection, req.params.id, patch);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:id', (req, res, next) => {
    try {
      const existing = store.findByIdScoped(collection, req.params.id, req.session.establishmentId);
      if (!existing) {
        return res.status(404).json({ error: 'Registro nao encontrado.' });
      }
      store.remove(collection, req.params.id);
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = makeCrudRouter;
