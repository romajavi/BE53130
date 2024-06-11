const User = require('../models/user.model');

const authMiddleware = async (req, res, next) => {
  const user = req.session.user;

  if (user) {
    try {
      const dbUser = await User.findById(user._id);
      if (dbUser) {
        req.user = dbUser;
        next();
      } else {
        res.redirect('/login');
      }
    } catch (error) {
      console.error('Error al obtener el usuario:', error);
      res.redirect('/login');
    }
  } else {
    res.redirect('/login');
  }
};

module.exports = authMiddleware;

