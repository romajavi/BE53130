const authMiddleware = (req, res, next) => {
  if (req.session.user) {
    // usuario autenticado continuar con la siguiente función
    next();
  } else {
    // no autenticado redirigir al login
    res.redirect('/login');
  }
};

module.exports = authMiddleware;