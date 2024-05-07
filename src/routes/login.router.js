const express = require('express');
const router = express.Router();
const { loginUser } = require('../controllers/login.controller');

// GET para mostrar el formulario de inicio de sesión
router.get('/', (req, res) => {
  res.render('login');
});

// POST para procesar el inicio de sesión del usuario
router.post('/', loginUser);

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