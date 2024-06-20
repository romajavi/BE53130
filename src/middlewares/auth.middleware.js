const User = require('../models/user.model');

const authMiddleware = async (req, res, next) => {
  const userEmail = req.cookies.userEmail;

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

module.exports = authMiddleware;