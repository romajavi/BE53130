const express = require('express');
const router = express.Router();
const passport = require('passport');
const { loginUser } = require('../controllers/login.controller'); 
const axios = require('axios');

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
    // Crear una sesión temporal con los datos del usuario de GitHub
    const profile = req.user._json;
    const userEmail = profile.email || null; 

    req.session.user = {
      id: profile.id,
      displayName: profile.name || profile.login,
      username: profile.login,
      photos: profile.avatar_url ? [{ value: profile.avatar_url }] : [],
      provider: 'github',
      email: userEmail, 
      role: 'usuario' 
    };

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
    res.clearCookie('connect.sid'); // Limpia la cookie de sesión
    console.log('Sesión cerrada exitosamente.');
    res.redirect('/login');
  });
});

module.exports = router;