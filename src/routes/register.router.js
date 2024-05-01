const express = require('express');
const router = express.Router();
const { registerUser } = require('../controllers/register.controller');

//  solicitudes GET para mostrar el formulario de registro
router.get('/', (req, res) => {
  res.render('register');
});

// solicitudes POST para procesar el registro de usuario
router.post('/', registerUser);

module.exports = router;