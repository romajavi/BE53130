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
        console.log('Usuario no encontrado en la base de datos (authMiddleware)');
        res.redirect('/login');
      }
    } catch (error) {
      console.error('Error al obtener el usuario (authMiddleware):', error);
      res.redirect('/login');
    }
  } else {
    console.log('No se encontró la cookie userEmail (authMiddleware)');
    res.redirect('/login');
  }
};

const isUser = (req, res, next) => {
  if (req.user && req.user.role === 'usuario') {
    next();
  } else {
    res.status(403).json({ error: "Acceso denegado. Se requiere rol de usuario." });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.email === 'adminCoder@coder.com')) {
    next();
  } else {
    res.status(403).json({ error: "Acceso denegado. Se requiere rol de administrador." });
  }
};

module.exports = { authMiddleware, isUser, isAdmin };