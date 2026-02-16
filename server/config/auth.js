// ============================================
// CONFIGURACIÓN DE AUTENTICACIÓN JWT
// ============================================

const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'vitaguard-heroes-super-secret-key-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

// Generar token JWT (access o refresh)
const generateToken = (userId, username, type = 'access') => {
  const expiresIn = type === 'refresh' ? JWT_REFRESH_EXPIRES_IN : JWT_EXPIRES_IN;

  return jwt.sign(
    {
      userId,
      username,
      type,               // 👈 IMPORTANTE
      timestamp: Date.now()
    },
    JWT_SECRET,
    { expiresIn }
  );
};

// Verificar token JWT
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Token inválido: ' + error.message);
  }
};

// Middleware para verificar autenticación
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Token de acceso requerido',
      message: 'Debes iniciar sesión para acceder a este recurso'
    });
  }

  try {
    const decoded = verifyToken(token);

    // Si alguien intenta usar refresh como access
    if (decoded.type && decoded.type !== 'access') {
      return res.status(403).json({
        error: 'Token inválido',
        message: 'Token incorrecto para este recurso'
      });
    }

    req.user = {
      id: decoded.userId,
      userId: decoded.userId,
      username: decoded.username,
      timestamp: decoded.timestamp
    };

    next();
  } catch (error) {
    return res.status(403).json({
      error: 'Token inválido',
      message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente'
    });
  }
};

// Middleware para autenticación opcional
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = verifyToken(token);
      req.user = {
        id: decoded.userId,
        userId: decoded.userId,
        username: decoded.username,
        timestamp: decoded.timestamp
      };
    } catch (error) {
      req.user = null;
    }
  } else {
    req.user = null;
  }

  next();
};

module.exports = {
  generateToken,
  verifyToken,
  authenticateToken,
  optionalAuth,
  JWT_SECRET
};
