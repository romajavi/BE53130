const Product = require('../models/product');
const User = require("../models/user.model");

const registerUser = async (req, res) => {
  try {
    console.log('Solicitud de registro recibida:', req.body);
    const { first_name, last_name, email, age, password } = req.body;

    // Verificación por si falta algún campo requerido
    if (!first_name || !last_name || !email || !age || !password) {
      return res.status(400).json({ message: "Todos los campos son requeridos." });
    }

    // Verificación si el email ya está en uso
    const existingUser = await User.findOne({ email }).lean();
    console.log('Usuario existente:', existingUser);

    if (existingUser) {
      return res.status(400).json({ message: "El email ya está en uso." });
    }

    // Crear un nuevo usuario con el rol "usuario" por defecto
    const newUser = new User({
      first_name,
      last_name,
      email,
      age,
      password,
      role: 'usuario'
    });
    await newUser.save();

    console.log('Nuevo usuario creado:', newUser);

    res.redirect('/login');
  } catch (error) {
    if (error.name === 'MongooseTimeoutError') {
      console.error("Error de tiempo de espera al registrar usuario:", error);
      res.status(500).json({ message: "El servidor está tardando demasiado en responder. Por favor, intenta nuevamente más tarde." });
    } else {
      console.error("Error al registrar usuario:", error);
      res.status(500).json({ message: "Error al registrar usuario." });
    }
  }
};

module.exports = { registerUser };