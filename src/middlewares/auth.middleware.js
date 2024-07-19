const User = require('../models/user.model');
const logger = require('../utils/logger');

const authMiddleware = async (req, res, next) => {
  const userEmail = req.cookies.userEmail;

  if (userEmail === 'adminCoder@coder.com') {
    req.user = {
      _id: 'admin',
      email: 'adminCoder@coder.com',
      role: 'admin',
      first_name: 'Admin'
    };
    return next();
  }

  if (userEmail) {
    try {
      const user = await User.findOne({ email: userEmail });
      if (user) {
        req.user = user;
        if (user.cartId) {
          req.cartId = user.cartId;
        }
        next();
      } else {
        logger.warn('Usuario no encontrado en la base de datos (authMiddleware)');
        res.redirect('/login');
      }
    } catch (error) {
      logger.error('Error al obtener el usuario (authMiddleware):', error);
      res.redirect('/login');
    }
  } else {
    logger.info('No se encontró la cookie userEmail (authMiddleware)');
    res.redirect('/login');
  }
};

const isUser = (req, res, next) => {
  if (req.user && (req.user.role === 'user' || req.user.role === 'premium')) {
    next();
  } else {
    res.status(403).json({ error: "Acceso denegado. Se requiere rol de usuario o premium." });
  }
};

const isAdmin = (req, res, next) => {
  logger.debug('Verificando rol de admin para:', req.user);
  if (req.user && (req.user.role === 'admin' || req.user.email === 'adminCoder@coder.com')) {
    next();
  } else {
    logger.warn('Acceso denegado a ruta de admin para:', req.user);
    res.status(403).json({ error: "Acceso denegado. Se requiere rol de administrador." });
  }
};

const isPremiumOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'premium')) {
    next();
  } else {
    res.status(403).json({ error: "Acceso denegado. Se requiere rol de administrador o premium." });
  }
};

const isPremium = (req, res, next) => {
  if (req.user && req.user.role === 'premium') {
    next();
  } else {
    res.status(403).json({ error: "Acceso denegado. Se requiere rol premium." });
  }
};

module.exports = { authMiddleware, isAdmin, isUser, isPremiumOrAdmin, isPremium };