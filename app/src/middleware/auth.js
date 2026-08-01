function requireLogin(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Nao autenticado.' });
  }
  next();
}

function requireEstablishment(req, res, next) {
  if (!req.session || !req.session.establishmentId) {
    return res.status(400).json({ error: 'Nenhum estabelecimento selecionado.' });
  }
  next();
}

module.exports = { requireLogin, requireEstablishment };
