const authMiddleware = (req, res, next) => {
  const user = req.session.user;

  if (user && (user.email || user.provider === 'github')) {
    next();
  } else {
    res.redirect('/login');
  }
};

module.exports = authMiddleware;