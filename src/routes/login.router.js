const express = require('express');
const router = express.Router();
const { loginUser } = require('../controllers/login.controller');

// GET para mostrar el formulario de inicio de sesión
router.get('/', (req, res) => {
  res.render('login');
});

// POST para procesar el inicio de sesión del usuario
router.post('/', loginUser);

module.exports = router;