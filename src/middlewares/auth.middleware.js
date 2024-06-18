const User = require('../models/user.model');

const authMiddleware = async (req, res, next) => {
  console.log('req.cookies:', req.cookies);
  const userEmail = req.cookies.userEmail;
  console.log('Correo electrónico del usuario en la cookie (authMiddleware):', userEmail);

  if (userEmail) {
    try {
      const user = await User.findOne({ email: userEmail });
      if (user) {
        req.user = user;
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