const express = require('express');
const router = express.Router();
const { registerUser } = require('../controllers/register.controller');
const { body, validationResult } = require('express-validator');

// solicitudes GET para mostrar el formulario de registro
router.get('/', (req, res) => {
  res.render('register');
});

// solicitudes POST para procesar el registro de usuario
router.post('/', [
  body('email').isEmail().withMessage('El email no es válido'),
  body('password').isLength({ min: 4 }).withMessage('La contraseña debe tener al menos 4 caracteres'),
  // Agrega más validaciones según sea necesario
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    await registerUser(req, res);
  } catch (error) {
    next(error);
  }
});

module.exports = router;