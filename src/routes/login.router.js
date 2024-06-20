const express = require('express');
const router = express.Router();
const passport = require('passport');
const { loginUser } = require('../controllers/login.controller');
const User = require('../models/user.model');
const Cart = require('../models/cart');
const CartManager = require('../services/cart.service');
const cartManager = new CartManager();
const bcrypt = require('bcrypt');


// GET para mostrar el formulario de inicio de sesión
router.get('/', (req, res) => {
  res.render('login');
});

// POST para procesar el inicio de sesión del usuario
router.post('/', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user) {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (isPasswordValid) {
        req.session.user = user;
        res.cookie('userEmail', user.email);

        // Crear el carrito para el usuario si no existe
        let cart = await Cart.findOne({ user: user._id });
        if (!cart) {
          cart = await cartManager.createCart(user._id);
          console.log('Carrito creado:', cart);
          
          // Actualizar el campo 'cart' en el modelo de usuario
          user.cart = cart._id;
          await user.save();
        }

        res.redirect('/profile');
      } else {
        res.render('login', { error: 'Contraseña incorrecta' });
      }
    } else {
      res.render('login', { error: 'Usuario no encontrado' });
    }
  } catch (error) {
    console.error('Error en el inicio de sesión:', error);
    res.render('login', { error: 'Error en el inicio de sesión' });
  }
});

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

    // Crear el carrito para el usuario si no existe
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await cartManager.createCart(req.user._id);
    }

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
    res.clearCookie('userEmail'); // Limpia la cookie de userEmail
    console.log('Sesión cerrada exitosamente.');
    res.redirect('/login');
  });
});

module.exports = router;