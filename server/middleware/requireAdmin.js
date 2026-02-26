const User = require('../models/User');

module.exports = async function requireAdmin(req, res, next) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado (solo admin)' });
    }

    // opcional: deja el rol disponible
    req.user.role = user.role;

    next();
  } catch (e) {
    console.error('requireAdmin error:', e);
    return res.status(500).json({ error: 'Error validando admin' });
  }
};