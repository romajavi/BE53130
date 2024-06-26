const express = require('express');
const router = express.Router();
const passport = require('passport');
const { loginUser } = require('../controllers/login.controller');

// GET para mostrar el formulario de inicio de sesión
router.get('/', (req, res) => {
  res.render('login');
});

// POST para procesar el inicio de sesión del usuario
router.post('/', loginUser);

// Ruta para iniciar sesión con GitHub
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

// Ruta de callback para autenticación con GitHub
router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('/products');
  }
);

// Ruta para cerrar sesión
router.get('/logout', (req, res) => {
  console.log('Cerrando sesión...');
  req.session.destroy((err) => {
    if (err) {
      console.error('Error al cerrar sesión:', err);
    }
    res.clearCookie('connect.sid');
    res.clearCookie('userEmail');
    console.log('Sesión cerrada exitosamente.');
    res.redirect('/login');
  });
});

module.exports = router;