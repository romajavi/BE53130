const express = require('express');
const router = express.Router();
const passport = require('passport');
const { loginUser } = require('../controllers/login.controller');
const axios = require('axios');
const CartManager = require('../services/cart.service');

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
  async (req, res) => {
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

    // Después del inicio de sesión exitoso
    fetch('/api/carts/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include' // Para incluir las cookies de sesión
    })
      .then(response => response.json())
      .then(data => {
        // El carrito se ha creado correctamente
        console.log('Carrito creado:', data.cartId);
        // Redirigir al usuario a la página deseada
        res.redirect('/products');
      })
      .catch(error => {
        console.error('Error al crear el carrito:', error);
        res.redirect('/login');
      });
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